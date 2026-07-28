import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../utils/api';

const SpotRegistrationModal = ({ event, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        rollNumber: '',
        studentName: '',
        email: '',
        branch: '',
        section: '',
        phoneNumber: '',
        year: '',
        semester: '',
        teamName: '',
        transactionId: '',
        paymentMode: 'Online'
    });

    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Reset verified status if roll number changes
    useEffect(() => {
        if (verified) setVerified(false);
        setError('');
    }, [formData.rollNumber]);

    const handleVerify = async () => {
        if (!formData.rollNumber) {
            setError('Please enter a Roll Number first.');
            return;
        }
        setVerifying(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await api.post('/registrations/verify-roll', {
                rollNumber: formData.rollNumber,
                eventId: event.EventID || event.id
            });

            const student = res.data.student;

            // Auto-fill form with student data if available
            // Note: Keys depend on the Excel structure. We try common ones.
            const mapData = {
                studentName: student.Name || student.name || student['Student Name'] || student['Student Name'] || '',
                email: student.Email || student.email || student['Email ID'] || '',
                branch: student.Branch || student.branch || '',
                section: student.Section || student.section || '',
                phoneNumber: student.PhoneNumber || student['Mobile No.'] || student['Phone'] || '',
                year: student.Year || student.year || '',
                semester: student.Semester || student.semester || ''
            };

            setFormData(prev => ({ ...prev, ...mapData }));
            setVerified(true);
            setSuccessMsg('Roll Number Verified. Proceed with details.');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Verification failed. Student not found or internal error.');
            setVerified(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!verified) {
            setError('You must verify the Roll Number before registering.');
            return;
        }
        if (event.EventType === 'Team' && !formData.teamName) {
            setError('Team Name is required for team events.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                eventId: event.EventID || event.id,
                rollNumber: formData.rollNumber,
                studentName: formData.studentName,
                email: formData.email,
                branch: formData.branch,
                section: formData.section,
                phoneNumber: formData.phoneNumber,
                year: formData.year,
                semester: formData.semester,
                teamName: event.EventType === 'Team' ? formData.teamName : null,
                teamMembers: null, // Spot registration only stores leader details as per requirement
                transactionId: formData.paymentMode === 'Online' ? formData.transactionId : 'OFFLINE',
                paymentMode: formData.paymentMode,
                paymentScreenshot: ''
            };

            await api.post('/registrations', payload);
            setSuccessMsg('Registration Successful! OTP sent to student email. (Valid for one entry only)');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#050a1f] rounded-[2rem] w-full max-w-2xl shadow-3xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh] mt-10 md:mt-0"
            >
                {/* Header */}
                <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Spot Registration</h2>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1 line-clamp-1">{event.EventTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Error / Success Messages */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-3">
                                <Check size={16} /> {successMsg}
                            </motion.div>
                        )}

                        {/* Roll Number & Verify */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Roll Number (Leader)</label>
                            <div className="flex gap-3">
                                <input
                                    required
                                    type="text"
                                    className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                    value={formData.rollNumber}
                                    onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifying || !formData.rollNumber}
                                    className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all ${verified ? 'bg-green-500 text-white' : 'bg-cyan-500 text-[#020617] hover:bg-cyan-400'}`}
                                >
                                    {verifying ? <Loader2 className="animate-spin h-4 w-4" /> : (verified ? <Check size={16} /> : <ShieldCheck size={16} />)}
                                    {verified ? 'Verified' : 'Verify'}
                                </button>
                            </div>
                        </div>

                        {/* Details Grid - Only active if verified */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 transition-all duration-500 ${verified ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Student Name</label>
                                <input required type="text" className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-medium"
                                    value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Branch</label>
                                <input required type="text" className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-medium"
                                    value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Section</label>
                                <input required type="text" className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-medium"
                                    value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Email</label>
                                <input required type="email" className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-medium"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Phone Number</label>
                                <input required type="tel" className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-medium"
                                    value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Payment Mode</label>
                                <div className="flex gap-4">
                                    {['Online', 'Offline'].map((mode) => (
                                        <label
                                            key={mode}
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.paymentMode === mode
                                                ? mode === 'Online'
                                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                                    : 'bg-amber-500/10 border-amber-500 text-amber-400'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                className="hidden"
                                                name="paymentMode"
                                                value={mode}
                                                checked={formData.paymentMode === mode}
                                                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{mode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {event.EventType === 'Team' && (
                                <div className="col-span-2 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                                    <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 mb-2">Team Name</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-[#020617] border border-amber-500/20 rounded-xl outline-none text-amber-100 font-bold focus:ring-1 focus:ring-amber-500"
                                        value={formData.teamName} onChange={e => setFormData({ ...formData, teamName: e.target.value })} placeholder="Enter Team Name" />
                                </div>
                            )}

                            {formData.paymentMode === 'Online' && (
                                <div className="col-span-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1 mb-2">Transaction ID</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-[#020617] border border-white/10 rounded-xl outline-none text-white font-bold focus:ring-1 focus:ring-cyan-500"
                                        value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} placeholder="Enter Transaction ID" />
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-xl hover:bg-white/10 text-[10px]">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !verified}
                                className={`flex-[2] py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg flex justify-center items-center gap-2 ${verified ? 'bg-cyan-500 text-[#020617] hover:bg-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Registration'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default SpotRegistrationModal;
