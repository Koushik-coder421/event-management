import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, MapPin, Clock, Users, ArrowLeft, ShieldCheck, Info, CheckCircle2, User, CreditCard, Timer, Upload, AlertCircle, X, Loader2, Edit, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [step, setStep] = useState(1); // 1: Roll Verify, 2: Profile/Team, 3: Payment, 4: Success

    // Form States
    const [rollNumber, setRollNumber] = useState('');
    const [studentInfo, setStudentInfo] = useState({ name: '', email: '', branch: '', section: '', phoneNumber: '', year: '', semester: '' });
    const [teamInfo, setTeamInfo] = useState({ teamName: '', members: [] });
    const [paymentInfo, setPaymentInfo] = useState({ transactionId: '', screenshot: '' });

    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [editForm, setEditForm] = useState({
        eventTitle: '', description: '', rules: '', eventType: '', teamSize: 1, entryFee: 0,
        date: '', time: '', venue: '', posterUrl: '', maxParticipants: 0, registrationDeadline: ''
    });

    // Timer State
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);
                setEditForm({
                    eventTitle: res.data.EventTitle,
                    description: res.data.Description,
                    rules: res.data.Rules,
                    eventType: res.data.EventType,
                    teamSize: res.data.TeamSize,
                    entryFee: res.data.EntryFee,
                    date: res.data.Date ? res.data.Date.split('T')[0] : '',
                    time: res.data.Time,
                    venue: res.data.Venue,
                    posterUrl: res.data.PosterURL,
                    maxParticipants: res.data.MaxParticipants,
                    registrationDeadline: res.data.RegistrationDeadline ? new Date(res.data.RegistrationDeadline).toISOString().slice(0, 16) : ''
                });
                if (res.data.EventType === 'Team') {
                    const size = parseInt(res.data.TeamSize) || 1;
                    setTeamInfo(prev => ({
                        ...prev,
                        members: Array(size - 1).fill(null).map(() => ({
                            name: '', branch: '', section: '', phoneNumber: '', year: '', semester: ''
                        }))
                    }));
                }
            } catch (err) {
                console.error("Error fetching event details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    // Timer Logic
    useEffect(() => {
        let timer;
        if (timerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerifyRoll = async () => {
        setVerifying(true);
        setError('');
        try {
            await api.post('/registrations/verify-roll', { rollNumber, eventId: id });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Roll number verification failed.');
        } finally {
            setVerifying(false);
        }
    };

    const qrCodeUrl = useMemo(() => {
        if (!event) return '';
        if (event.QRCode) return event.QRCode;
        const fee = (event.EntryFee !== undefined && event.EntryFee !== null) ? event.EntryFee : 100;
        const title = event.EventTitle ? encodeURIComponent(event.EventTitle) : 'Event';
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ykoushik78@okaxis%26am=${fee}%26tn=Registration+for+${title}`;
    }, [event]);

    const handleScreenshotUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPaymentInfo({ ...paymentInfo, screenshot: res.data.fullUrl });
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateEvent = async () => {
        setSubmitting(true);
        try {
            await api.put(`/events/${id}`, editForm);
            const res = await api.get(`/events/${id}`);
            setEvent(res.data);
            setShowEditModal(false);
            alert("Event updated successfully!");
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const isDeadlinePassed = event?.RegistrationDeadline && new Date() > new Date(event.RegistrationDeadline);
    const canEdit = user && (user.role === 'Super Admin' || user.role === 'Admin' || user.id === event?.clubOwnerId);

    const handleRegisterClick = () => {
        if (isDeadlinePassed) {
            alert("Online registration has finished. Please proceed with offline registration at the club office.");
            return;
        }
        setShowRegisterModal(true);
    };

    const resetRegistration = () => {
        setStep(1);
        setRollNumber('');
        setStudentInfo({ name: '', email: '', branch: '', section: '', phoneNumber: '', year: '', semester: '' });
        const size = parseInt(event?.TeamSize) || 1;
        setTeamInfo({
            teamName: '',
            members: Array(size - 1).fill(null).map(() => ({
                name: '', branch: '', section: '', phoneNumber: '', year: '', semester: ''
            }))
        });
        setPaymentInfo({ transactionId: '', screenshot: '' });
        setTimeLeft(300);
        setTimerActive(false);
        setError('');
    };

    const handleFinalRegister = async () => {
        setSubmitting(true);
        try {
            const payload = {
                eventId: id,
                rollNumber,
                studentName: studentInfo.name,
                email: studentInfo.email,
                branch: studentInfo.branch,
                section: studentInfo.section,
                phoneNumber: studentInfo.phoneNumber,
                year: studentInfo.year,
                semester: studentInfo.semester,
                teamName: event.EventType === 'Team' ? teamInfo.teamName : undefined,
                teamMembers: event.EventType === 'Team' ? teamInfo.members : undefined,
                transactionId: paymentInfo.transactionId,
                paymentScreenshot: paymentInfo.screenshot
            };

            await api.post('/registrations', payload);
            setStep(4);
            setTimerActive(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-cyan-400" /></div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">Event Not Found</div>;

    return (
        <div className="min-h-screen bg-[#020617] pt-24 pb-12 relative overflow-hidden text-white selection:bg-cyan-500 selection:text-white">
            {/* Optimized Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[80px] delay-1000"></div>
                <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/80 to-[#020617]"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-10 flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft size={16} /> Return to Events
                </button>

                <div className="bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 backdrop-blur-3xl shadow-2xl mb-12">
                    <div className="relative h-[450px]">
                        <img
                            src={event.PosterURL || 'https://placehold.co/1200x600?text=Event'}
                            className="w-full h-full object-cover"
                            alt={event.EventTitle}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent" />
                        <div className="absolute bottom-10 left-10 flex justify-between items-end w-[calc(100%-5rem)]">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-md rounded-full mb-4">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                        {event.categoryName || 'General Event'} • {event.EventType || 'Single'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">{event.EventTitle}</h1>
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="bg-white/10 hover:bg-cyan-500 hover:text-[#020617] text-white p-4 rounded-2xl transition-all border border-white/20 shadow-2xl"
                                >
                                    <Edit size={24} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-10 grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-12">
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                        <Info size={20} className="text-cyan-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Event Description</h2>
                                </div>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{event.Description}</p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <ShieldCheck size={20} className="text-amber-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Event Rules</h2>
                                </div>
                                <div className="bg-amber-500/5 rounded-3xl p-8 border border-amber-500/10 backdrop-blur-xl">
                                    <p className="text-amber-200/80 leading-relaxed whitespace-pre-wrap font-medium">{event.Rules || 'No specific rules for this event.'}</p>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 backdrop-blur-2xl shadow-2xl">
                                <h3 className="font-black text-white uppercase tracking-widest text-xs mb-8 pb-4 border-b border-white/5">Event Details</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Calendar className="text-cyan-400" size={16} /></div>
                                        <span className="text-sm font-bold tracking-tight">{new Date(event.Date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Clock className="text-cyan-400" size={16} /></div>
                                        <span className="text-sm font-bold tracking-tight">{event.Time}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10"><MapPin className="text-cyan-400" size={16} /></div>
                                        <span className="text-sm font-bold tracking-tight">{event.Venue}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Users className="text-cyan-400" size={16} /></div>
                                        <span className="text-sm font-bold tracking-tight">{event.EventType === 'Team' ? `Team Size: ${event.TeamSize}` : 'Solo Event'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                                        <CreditCard className="text-cyan-400" size={18} />
                                        <span className="text-sm font-black text-white">₹{event.EntryFee || '0'} Entry Fee</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRegisterClick}
                                    disabled={isDeadlinePassed}
                                    className={`w-full mt-10 py-5 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl transition-all ${isDeadlinePassed
                                        ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                                        : 'bg-white text-[#020617] hover:bg-cyan-500 shadow-cyan-500/20 active:scale-95'}`}
                                >
                                    {isDeadlinePassed ? 'Registration Closed' : 'Register Now'}
                                </button>

                                {isDeadlinePassed && (
                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
                                        <AlertCircle size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Deadline Exceeded</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            <AnimatePresence>
                {showRegisterModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegisterModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="relative bg-[#020617] rounded-[3rem] w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
                        >
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-600/10 rounded-full blur-3xl"></div>
                            </div>

                            {/* Progress Header */}
                            <div className="relative z-10 p-6 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(s => (
                                        <div key={s} className={`h-1 w-10 rounded-full transition-all duration-300 ${step >= s ? 'bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.3)]' : 'bg-white/10'}`} />
                                    ))}
                                </div>
                                <button onClick={() => setShowRegisterModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="relative z-10 p-10 max-h-[80vh] overflow-y-auto">
                                {step === 1 && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-cyan-400 border border-cyan-500/20 shadow-2xl">
                                            <User size={36} />
                                        </div>
                                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Registration</h2>
                                        <p className="text-slate-500 mb-10 font-medium italic">Please enter your roll number to start.</p>
                                        <div className="space-y-6 text-left">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 mb-3 block">Roll Number</label>
                                                <input
                                                    value={rollNumber}
                                                    onChange={e => setRollNumber(e.target.value)}
                                                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 transition-all font-black uppercase text-xl text-white tracking-widest placeholder:text-white/20"
                                                    placeholder="23P81AXXXX"
                                                />
                                            </div>
                                            {error && (
                                                <div className="text-red-400 flex items-center gap-3 text-sm font-bold bg-red-500/10 p-5 rounded-2xl border border-red-500/20 animate-pulse">
                                                    <AlertCircle size={18} /> {error}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleVerifyRoll}
                                                disabled={verifying || !rollNumber}
                                                className="w-full py-5 bg-white text-[#020617] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-cyan-500 transition-all disabled:opacity-20 active:scale-95 text-xs"
                                            >
                                                {verifying ? 'Verifying...' : 'Next Step'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Attendee Details</h2>
                                            <div className="text-[10px] bg-cyan-500/10 px-4 py-2 rounded-full font-black text-cyan-400 border border-cyan-500/20 tracking-widest uppercase">
                                                Roll: {rollNumber}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                                                <input value={studentInfo.name} onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Email</label>
                                                <input type="email" value={studentInfo.email} onChange={e => setStudentInfo({ ...studentInfo, email: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Branch</label>
                                                <input value={studentInfo.branch} onChange={e => setStudentInfo({ ...studentInfo, branch: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Section</label>
                                                <input value={studentInfo.section} onChange={e => setStudentInfo({ ...studentInfo, section: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                                                <input value={studentInfo.phoneNumber} onChange={e => setStudentInfo({ ...studentInfo, phoneNumber: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Year</label>
                                                <select
                                                    value={studentInfo.year}
                                                    onChange={e => setStudentInfo({ ...studentInfo, year: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white/80 text-sm font-bold bg-[#020617]"
                                                >
                                                    <option value="" className="bg-[#020617]">Select Year</option>
                                                    {[1, 2, 3, 4].map(y => <option key={y} value={y} className="bg-[#020617]">{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Semester</label>
                                                <select
                                                    value={studentInfo.semester}
                                                    onChange={e => setStudentInfo({ ...studentInfo, semester: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white/80 text-sm font-bold bg-[#020617]"
                                                >
                                                    <option value="" className="bg-[#020617]">Select Sem</option>
                                                    <option value="1" className="bg-[#020617]">1st Sem</option>
                                                    <option value="2" className="bg-[#020617]">2nd Sem</option>
                                                </select>
                                            </div>
                                        </div>

                                        {event.EventType === 'Team' && (
                                            <div className="pt-8 border-t border-white/5 space-y-6">
                                                <h3 className="font-black text-amber-400 flex items-center gap-3 text-sm uppercase tracking-tighter"><Users size={20} /> Team Members (Lead: {rollNumber})</h3>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Team Name</label>
                                                    <input value={teamInfo.teamName} onChange={e => setTeamInfo({ ...teamInfo, teamName: e.target.value })} className="w-full px-5 py-4 bg-amber-500/5 border border-amber-500/20 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 text-white font-medium placeholder:text-white/20" placeholder="Team Name Here" />
                                                </div>
                                                <div className="space-y-6">
                                                    {teamInfo.members.map((m, idx) => (
                                                        <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-5">
                                                            <div className="text-[10px] font-black text-slate-600 mb-1 tracking-widest">MEMBER #{idx + 2}</div>
                                                            <input
                                                                value={m.name}
                                                                onChange={e => {
                                                                    const nm = [...teamInfo.members];
                                                                    nm[idx] = { ...nm[idx], name: e.target.value };
                                                                    setTeamInfo({ ...teamInfo, members: nm });
                                                                }}
                                                                className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20"
                                                                placeholder="Legal Name"
                                                            />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <input
                                                                    value={m.branch}
                                                                    onChange={e => {
                                                                        const nm = [...teamInfo.members];
                                                                        nm[idx] = { ...nm[idx], branch: e.target.value };
                                                                        setTeamInfo({ ...teamInfo, members: nm });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20"
                                                                    placeholder="Branch"
                                                                />
                                                                <input
                                                                    value={m.section}
                                                                    onChange={e => {
                                                                        const nm = [...teamInfo.members];
                                                                        nm[idx] = { ...nm[idx], section: e.target.value };
                                                                        setTeamInfo({ ...teamInfo, members: nm });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20"
                                                                    placeholder="Sec"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <select
                                                                    value={m.year}
                                                                    onChange={e => {
                                                                        const nm = [...teamInfo.members];
                                                                        nm[idx] = { ...nm[idx], year: e.target.value };
                                                                        setTeamInfo({ ...teamInfo, members: nm });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-xl text-[10px] text-white"
                                                                >
                                                                    <option value="">Year</option>
                                                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y} Yr</option>)}
                                                                </select>
                                                                <select
                                                                    value={m.semester}
                                                                    onChange={e => {
                                                                        const nm = [...teamInfo.members];
                                                                        nm[idx] = { ...nm[idx], semester: e.target.value };
                                                                        setTeamInfo({ ...teamInfo, members: nm });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-xl text-[10px] text-white"
                                                                >
                                                                    <option value="">Sem</option>
                                                                    <option value="1">1st</option>
                                                                    <option value="2">2nd</option>
                                                                </select>
                                                            </div>
                                                            <input
                                                                value={m.phoneNumber}
                                                                onChange={e => {
                                                                    const nm = [...teamInfo.members];
                                                                    nm[idx] = { ...nm[idx], phoneNumber: e.target.value };
                                                                    setTeamInfo({ ...teamInfo, members: nm });
                                                                }}
                                                                className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20"
                                                                placeholder="Phone Number"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4 mt-10">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="flex-1 py-5 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all text-[10px]"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => { setStep(3); setTimerActive(true); }}
                                                disabled={
                                                    !studentInfo.name?.trim() ||
                                                    !studentInfo.email?.trim() ||
                                                    !studentInfo.branch?.trim() ||
                                                    !studentInfo.section?.trim() ||
                                                    !studentInfo.phoneNumber?.trim() ||
                                                    !studentInfo.year ||
                                                    !studentInfo.semester ||
                                                    (event.EventType === 'Team' && (
                                                        !teamInfo.teamName?.trim() ||
                                                        teamInfo.members.some(m => !m.name?.trim() || !m.branch?.trim() || !m.section?.trim() || !m.phoneNumber?.trim() || !m.year || !m.semester)
                                                    ))
                                                }
                                                className="flex-[2] py-5 bg-white text-[#020617] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-cyan-500 transition-all disabled:opacity-20 active:scale-95 text-xs"
                                            >
                                                Next Step
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="text-center">
                                        <div className="flex justify-between items-center mb-8">
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Payment</h2>
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] tracking-widest ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'} border border-current/20`}>
                                                <Timer size={14} /> {formatTime(timeLeft)}
                                            </div>
                                        </div>

                                        <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 text-left backdrop-blur-xl">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Registration Summary</div>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="px-4 py-2 bg-[#020617] rounded-xl text-[10px] font-black text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                                                    Roll: {rollNumber}
                                                </span>
                                                <span className="px-4 py-2 bg-[#020617] rounded-xl text-[10px] font-black text-white border border-white/10 uppercase tracking-wider">
                                                    {studentInfo.name}
                                                </span>
                                                {event.EventType === 'Team' && teamInfo.teamName && (
                                                    <span className="px-4 py-2 bg-amber-500/10 rounded-xl text-[10px] font-black text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                                        Team: {teamInfo.teamName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative mb-10 bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(34,211,238,0.15)] inline-block border border-white/20">
                                            <div className={`overflow-hidden rounded-2xl transition-all duration-700 ${timeLeft === 0 ? 'blur-2xl scale-90 opacity-20' : ''}`}>
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="UPI QR Code"
                                                    className="w-48 h-48 brightness-95 contrast-125"
                                                />
                                            </div>
                                            {timeLeft === 0 && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                    <AlertCircle className="text-red-500 mb-3" size={40} />
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Time Expired</p>
                                                    <button onClick={resetRegistration} className="mt-4 px-6 py-2 bg-[#020617] text-white text-[10px] font-black rounded-full uppercase tracking-tighter">Restart</button>
                                                </div>
                                            )}
                                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                                <ShieldCheck size={20} className="text-white" />
                                            </div>
                                        </div>

                                        <div className="space-y-6 text-left">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Transaction ID</label>
                                                <input
                                                    disabled={timeLeft === 0}
                                                    value={paymentInfo.transactionId}
                                                    onChange={e => setPaymentInfo({ ...paymentInfo, transactionId: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-mono tracking-widest uppercase text-sm"
                                                    placeholder="1234567890XX"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Payment Screenshot</label>
                                                <div className="mt-1 flex items-center gap-4">
                                                    <input
                                                        disabled={timeLeft === 0}
                                                        type="file"
                                                        onChange={handleScreenshotUpload}
                                                        id="screenshot-upload"
                                                        className="hidden"
                                                    />
                                                    <label htmlFor="screenshot-upload" className="flex-1 px-5 py-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-center gap-3 transition-all hover:border-cyan-500/30">
                                                        {uploading ? <Loader2 className="animate-spin" size={16} /> : paymentInfo.screenshot ? <span className="text-cyan-400 flex items-center gap-1"><CheckCircle2 size={16} /> Upload Success</span> : <><Upload size={16} /> Upload Screenshot</>}
                                                    </label>
                                                    {paymentInfo.screenshot && (
                                                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 shadow-2xl"><img src={paymentInfo.screenshot} className="w-full h-full object-cover" /></div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mt-10">
                                                <button
                                                    onClick={() => { setStep(2); setTimerActive(false); }}
                                                    disabled={timeLeft === 0}
                                                    className="flex-1 py-5 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all disabled:opacity-20 text-[10px]"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={handleFinalRegister}
                                                    disabled={submitting || !paymentInfo.transactionId || !paymentInfo.screenshot || timeLeft === 0}
                                                    className="flex-[2] py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-white transition-all flex justify-center items-center gap-3 disabled:opacity-20 active:scale-95 text-[10px]"
                                                >
                                                    {submitting ? 'Registering...' : 'Complete Registration'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="text-center py-6">
                                        <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                                                <CheckCircle2 className="text-cyan-400" size={60} />
                                            </motion.div>
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Registration Successful</h2>
                                        <p className="text-cyan-400 mb-10 font-bold italic text-sm px-6">
                                            Event details and Entry OTP have been sent to your email.
                                            <span className="block text-white/50 mt-1 uppercase tracking-widest text-[10px]">Do not share this OTP with anyone • Valid for one-time entry only.</span>
                                        </p>
                                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-left mb-10 backdrop-blur-3xl">
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Attendee</span>
                                                <span className="text-sm text-white font-black">{studentInfo.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Event</span>
                                                <span className="text-sm text-white font-black">{event.EventTitle}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Registration ID</span>
                                                <span className="text-sm text-cyan-400 font-black">#RE-{Math.floor(Math.random() * 99999)}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowRegisterModal(false)}
                                            className="w-full py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95 text-xs"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Event Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-[#020617] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
                        >
                            <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Edit Event</h2>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                            </div>
                            <div className="p-10 overflow-y-auto space-y-8 bg-white/5">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Event Title</label>
                                        <input value={editForm.eventTitle} onChange={e => setEditForm({ ...editForm, eventTitle: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-bold" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Event Description</label>
                                        <textarea rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Event Rules</label>
                                        <textarea rows={3} value={editForm.rules} onChange={e => setEditForm({ ...editForm, rules: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-medium" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Event Date</label>
                                        <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full px-5 py-4 bg-[#020617] border border-white/10 rounded-xl text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Event Time</label>
                                        <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} className="w-full px-5 py-4 bg-[#020617] border border-white/10 rounded-xl text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Venue</label>
                                        <input value={editForm.venue} onChange={e => setEditForm({ ...editForm, venue: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Entry Fee (₹)</label>
                                        <input type="number" value={editForm.entryFee} onChange={e => setEditForm({ ...editForm, entryFee: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Registration Deadline</label>
                                        <input type="datetime-local" value={editForm.registrationDeadline} onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })} className="w-full px-5 py-4 bg-[#020617] border border-white/10 rounded-xl text-white" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Poster URL</label>
                                        <input value={editForm.posterUrl} onChange={e => setEditForm({ ...editForm, posterUrl: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 text-white" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateEvent}
                                    disabled={submitting}
                                    className="w-full py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventDetails;
