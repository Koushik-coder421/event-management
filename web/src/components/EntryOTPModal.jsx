import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, AlertCircle, CheckCircle2, User, Hash, Trophy } from 'lucide-react';
import api from '../utils/api';

const EntryOTPModal = ({ event, onClose }) => {
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!otp) return;

        setVerifying(true);
        setError('');
        setResult(null);

        try {
            const res = await api.post('/registrations/verify-otp', {
                eventId: event.EventID || event.id,
                otp: otp
            });

            setResult(res.data.details);
            setOtp('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Verification failed. Invalid OTP.');
            if (err.response?.data?.details) {
                setResult(err.response.data.details);
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
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
                className="relative bg-[#050a1f] rounded-[2.5rem] w-full max-w-lg shadow-3xl overflow-hidden border border-white/10 flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/20 rounded-2xl">
                            <ShieldCheck className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Verify Entry OTP</h2>
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1">{event.EventTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8">
                    {!result && !error ? (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <p className="text-slate-400 text-sm font-medium">Please enter the 6-digit OTP provided by the participant.</p>
                            </div>

                            <div className="relative group">
                                <input
                                    required
                                    type="text"
                                    maxLength="6"
                                    placeholder="Enter 6-digit OTP"
                                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white text-center text-3xl font-black tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm placeholder:font-bold"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={verifying || otp.length < 6}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl flex justify-center items-center gap-3 transition-all ${otp.length === 6 ? 'bg-cyan-500 text-[#020617] hover:bg-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            >
                                {verifying ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                Verify & Admit
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {error ? (
                                <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="p-6 bg-red-500/20 rounded-full">
                                            <AlertCircle className="h-12 w-12 text-red-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Verification Failed</h3>
                                        <p className="text-red-400 font-bold mt-2">{error}</p>
                                    </div>

                                    {result && (
                                        <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 text-left space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Registered Student</p>
                                                    <p className="text-white font-bold">{result.studentName}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                                This OTP was already used. Please check with the student.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setError(''); setResult(null); }}
                                        className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-[10px]"
                                    >
                                        Try Another OTP
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="p-6 bg-green-500/20 rounded-full animate-bounce">
                                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Entry Approved</h3>
                                        <p className="text-green-400 font-bold mt-2 tracking-widest uppercase text-[10px]">Significant Success! Proceed with Event</p>
                                    </div>

                                    <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 text-left space-y-5 shadow-2xl">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Student Leader</p>
                                                <p className="text-xl font-black text-white tracking-tight">{result.studentName}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Hash className="h-3 w-3 text-cyan-400" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Roll No</span>
                                                </div>
                                                <p className="text-sm font-bold text-white">{result.rollNumber}</p>
                                            </div>

                                            {result.teamName && (
                                                <div className="col-span-2 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Trophy className="h-3 w-3 text-cyan-400" />
                                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Team Name</span>
                                                    </div>
                                                    <p className="text-lg font-black text-white">{result.teamName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-xl text-xs"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default EntryOTPModal;
