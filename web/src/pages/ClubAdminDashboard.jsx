import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import SpotRegistrationModal from '../components/SpotRegistrationModal';
import EntryOTPModal from '../components/EntryOTPModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Calendar, MapPin, Clock, Loader2, X, Trash2, Tag, Image as ImageIcon, Upload, Users, Edit, DownloadCloud, UserPlus } from 'lucide-react';

const ClubAdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [qrUploading, setQrUploading] = useState(false);

    const [newEvent, setNewEvent] = useState({
        eventTitle: '',
        description: '',
        rules: '',
        eventType: 'Single',
        teamSize: 1,
        date: '',
        time: '',
        venue: '',
        posterUrl: '',
        maxParticipants: 100,
        registrationDeadline: '',
        entryFee: 0,
        qrCode: '',
        clubId: user?.id || 1
    });

    const [myClub, setMyClub] = useState(null);
    const [viewingParticipants, setViewingParticipants] = useState(null);
    const [participants, setParticipants] = useState([]);

    const [showSpotModal, setShowSpotModal] = useState(false);
    const [spotEvent, setSpotEvent] = useState(null);

    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpEvent, setOtpEvent] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownloadReport = async () => {
        try {
            const response = await api.get('/registrations/download-club-report', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Registrations_${myClub?.ClubName || 'Club'}.xlsx`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert('Failed to download report: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const fetchParticipants = async (eventId, eventTitle) => {
        try {
            const res = await api.get(`/registrations/event/${eventId}`);
            setParticipants(res.data);
            setViewingParticipants({ id: eventId, title: eventTitle });
        } catch (error) {
            alert('Failed to fetch participants');
            console.error(error);
        }
    };

    const fetchData = async () => {
        try {
            const [eventsRes, clubsRes] = await Promise.all([
                api.get('/events'),
                api.get('/clubs')
            ]);
            if (Array.isArray(eventsRes.data)) {
                setEvents(eventsRes.data);
            }

            if (user && Array.isArray(clubsRes.data)) {
                const foundClub = clubsRes.data.find(c => c.CreatedBy === user.id);
                if (foundClub) {
                    setMyClub(foundClub);
                    setNewEvent(prev => ({ ...prev, clubId: foundClub.ClubID }));
                } else {
                    console.warn("No club found matching user ID:", user.id);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedExtensions.includes(file.type)) {
            alert('Please upload only .png, .jpeg or .jpg images.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewEvent({ ...newEvent, posterUrl: res.data.fullUrl });
        } catch (error) {
            alert('Image upload failed');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleQrCodeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedExtensions.includes(file.type)) {
            alert('Please upload only .png, .jpeg or .jpg images.');
            return;
        }

        setQrUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewEvent({ ...newEvent, qrCode: res.data.fullUrl });
        } catch (error) {
            alert('QR Code upload failed');
            console.error(error);
        } finally {
            setQrUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!myClub?.ClubID) {
            alert("Error: Could not identify which club you belong to. Please contact Admin.");
            return;
        }

        // Date Validation
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time part for date comparison

        const eventDate = new Date(newEvent.date);
        const deadlineDate = new Date(newEvent.registrationDeadline);

        if (eventDate < currentDate) {
            if (!window.confirm("Warning: You have selected an event date in the past. Are you sure you want to proceed?")) {
                return;
            }
        }

        if (deadlineDate < currentDate) {
            if (!window.confirm("Warning: You have selected a registration deadline in the past. Are you sure you want to proceed?")) {
                return;
            }
        }

        setSubmitting(true);
        try {
            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, newEvent);
            } else {
                await api.post('/events', {
                    ...newEvent,
                    clubId: myClub.ClubID
                });
            }
            setShowModal(false);
            setEditingEventId(null);
            fetchData();
            setNewEvent({
                eventTitle: '', description: '', rules: '', eventType: 'Single', teamSize: 1, date: '', time: '', venue: '', posterUrl: '', maxParticipants: 100, registrationDeadline: '', entryFee: 0, qrCode: ''
            });
        } catch (error) {
            alert('Failed to save event: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (event) => {
        // Prevent editing if event is finished
        const today = new Date();
        const eventDate = new Date(event.Date);
        const isEventFinished = new Date(eventDate.toDateString()) < new Date(today.toDateString());

        if (isEventFinished) {
            alert("This event has finished and cannot be edited.");
            return;
        }

        setEditingEventId(event.EventID || event.id);

        // Helper to format date for input (handling local timezone)
        const toLocalISO = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString();
        };

        setNewEvent({
            eventTitle: event.EventTitle,
            description: event.Description,
            rules: event.Rules || '',
            eventType: event.EventType || 'Single',
            teamSize: event.TeamSize || 1,
            // For Date input, we want YYYY-MM-DD. 
            // If event.Date is 00:00 UTC, toLocalISO gives local representation. 
            // In IST (UTC+5:30), 00:00 UTC -> 05:30. Date part remains same.
            date: event.Date ? toLocalISO(event.Date).split('T')[0] : '',
            time: event.Time,
            venue: event.Venue,
            posterUrl: event.PosterURL || '',
            maxParticipants: event.MaxParticipants || 100,
            // For datetime-local, we want YYYY-MM-DDTHH:mm
            registrationDeadline: event.RegistrationDeadline ? toLocalISO(event.RegistrationDeadline).slice(0, 16) : '',
            entryFee: event.EntryFee || 0,
            qrCode: event.QRCode || '',
            clubId: event.ClubID
        });
        setShowModal(true);
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete event: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteRegistration = async (id) => {
        if (!window.confirm('Are you sure you want to delete this registration?')) return;
        try {
            await api.delete(`/registrations/${id}`);
            // Refresh list
            if (viewingParticipants) {
                fetchParticipants(viewingParticipants.id, viewingParticipants.title);
            }
        } catch (error) {
            alert('Failed to delete registration');
        }
    };

    const handleSpotClick = (event) => {
        setSpotEvent(event);
        setShowSpotModal(true);
    };

    const myEvents = Array.isArray(events) ? events.filter(e => e.ClubID === myClub?.ClubID) : [];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 pt-24 pb-12 relative overflow-hidden">
            {/* Optimized Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[80px]"></div>
                <div className="absolute inset-0 bg-grid-white opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/80 to-[#020617]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 mb-12 border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all opacity-20 group-hover:opacity-40"></div>
                            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 shadow-2xl overflow-hidden border border-white/10 relative z-10 transform group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500">
                                <img
                                    src={myClub?.LogoURL || 'https://placehold.co/400?text=No+Logo'}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/400?text=Club';
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-cyan-500/20">
                                <Tag className="h-3 w-3" />
                                Prime Organizer
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                                {myClub?.ClubName || 'Creative Hub'}
                            </h1>
                            <p className="text-slate-400 font-medium text-lg italic">
                                Master Console: <span className="text-cyan-400 font-black not-italic">{user?.name || user?.Name || 'Authorized Admin'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDownloadReport}
                            className="p-5 bg-white/5 text-cyan-400 hover:text-white rounded-[1.5rem] border border-cyan-500/20 hover:border-cyan-500 backdrop-blur-xl transition-all shadow-xl group"
                            title="Download Club Excel Report"
                        >
                            <DownloadCloud className="h-6 w-6 group-hover:scale-125 transition-transform" />
                        </button>

                        <button
                            onClick={() => {
                                setEditingEventId(null);
                                setNewEvent({
                                    eventTitle: '', description: '', rules: '', eventType: 'Single', teamSize: 1, date: '', time: '', venue: '', posterUrl: '', maxParticipants: 100, registrationDeadline: '', entryFee: 0, qrCode: ''
                                });
                                setShowModal(true);
                            }}
                            className="group relative px-10 py-5 bg-white text-[#020617] hover:bg-cyan-500 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                                <span>Post New Event</span>
                            </div>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-16 w-16 animate-spin text-cyan-400" /></div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {myEvents.map((event) => (
                            <div key={event.EventID || event.id} className="group bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden hover:border-cyan-500/50 transition-all duration-700 hover:-translate-y-4 relative">
                                <div className="h-44 relative overflow-hidden">
                                    <img
                                        src={event.PosterURL || `https://placehold.co/500/300?text=${encodeURIComponent(event.EventTitle || 'Event')}`}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/500/300?text=Event';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />

                                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                        <div className="bg-[#020617]/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black text-cyan-400 uppercase border border-cyan-500/20 shadow-2xl">
                                            {event.EventType || 'Single'}
                                        </div>
                                        {(() => {
                                            const today = new Date();
                                            const eventDate = new Date(event.Date);
                                            const isFinished = new Date(eventDate.toDateString()) < new Date(today.toDateString());
                                            if (isFinished) {
                                                return <div className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase shadow-sm">Finished</div>;
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    {(() => {
                                        const today = new Date();
                                        const regDeadline = new Date(event.RegistrationDeadline); // Check specific deadline
                                        const isDeadlinePassed = regDeadline < today;

                                        if (isDeadlinePassed) {
                                            return (
                                                <button
                                                    onClick={() => handleSpotClick(event)}
                                                    className="p-2.5 bg-cyan-500 text-[#020617] hover:bg-white rounded-lg transition-all shadow-xl font-bold"
                                                    title="Spot Registration"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                    {!(() => {
                                        const today = new Date();
                                        const eventDate = new Date(event.Date);
                                        return new Date(eventDate.toDateString()) < new Date(today.toDateString());
                                    })() && (
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="p-2.5 bg-white hover:bg-cyan-500 hover:text-white rounded-lg text-[#020617] transition-all shadow-xl"
                                                title="Edit Event"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    <button
                                        onClick={() => {
                                            setOtpEvent(event);
                                            setShowOTPModal(true);
                                        }}
                                        className="p-2.5 bg-yellow-500 text-[#020617] hover:bg-white rounded-lg transition-all shadow-xl font-bold"
                                        title="Verify Entry OTP"
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(event.EventID || event.id)}
                                        className="p-2.5 bg-white hover:bg-red-500 hover:text-white rounded-lg text-[#020617] transition-all shadow-xl"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                                        {event.Venue}
                                    </div>
                                    <h3 className="text-xl font-black text-white leading-tight mb-4 tracking-tighter truncate">{event.EventTitle}</h3>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                                            <span>{new Date(event.Date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Clock className="h-3.5 w-3.5 text-cyan-400" />
                                            <span>{event.Time}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => fetchParticipants(event.EventID || event.id, event.EventTitle)}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-[#020617] transition-all flex items-center justify-center gap-2 shadow-2xl"
                                    >
                                        <Users size={16} />
                                        Entry Manifest
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Participants Modal */}
                <AnimatePresence>
                    {viewingParticipants && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setViewingParticipants(null)}
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative bg-[#050a1f] rounded-[3rem] w-full max-w-5xl shadow-3xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
                            >
                                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Manifest: {viewingParticipants.title}</h2>
                                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mt-1">Total Authorized: {participants.length}</p>
                                    </div>
                                    <button onClick={() => setViewingParticipants(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-white/5">
                                    {participants.length === 0 ? (
                                        <div className="text-center py-20 text-slate-500 font-black uppercase tracking-[0.3em] italic">No active registrations found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-separate border-spacing-y-4">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendee</th>
                                                        <th className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Protocol</th>
                                                        <th className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference</th>
                                                        <th className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence</th>
                                                        <th className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Admin</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {participants.map((reg) => (
                                                        <tr key={reg.RegistrationID} className="group bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300">
                                                            <td className="px-6 py-5 rounded-l-3xl border-y border-l border-white/5">
                                                                <div className="font-black text-white text-base tracking-tight">{reg.StudentName}</div>
                                                                <div className="text-[10px] text-cyan-400/60 font-black uppercase tracking-widest mt-1">{reg.RollNumber} • {reg.Branch}</div>
                                                                <div className="text-[10px] font-bold text-slate-600 mt-0.5">Year: {reg.Year} • Sem: {reg.Semester}</div>
                                                                {reg.PhoneNumber && <div className="text-xs text-cyan-400 font-bold mt-1">Contact: {reg.PhoneNumber}</div>}
                                                            </td>
                                                            <td className="px-6 py-5 border-y border-white/5 text-center">
                                                                {reg.TeamName ? (
                                                                    <div className="space-y-2">
                                                                        <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Team: {reg.TeamName}</div>
                                                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2 mt-2">
                                                                            {(typeof reg.TeamMembers === 'string' ? JSON.parse(reg.TeamMembers || '[]') : (reg.TeamMembers || [])).map((m, idx) => (
                                                                                <div key={idx} className="text-[10px] leading-tight flex flex-col border-l-2 border-cyan-400/20 pl-2">
                                                                                    <span className="font-bold text-white">{typeof m === 'object' ? (m.name || m.Name) : m}</span>
                                                                                    {typeof m === 'object' && (
                                                                                        <span className="text-slate-500 font-medium">
                                                                                            {m.branch || m.Branch}-{m.section || m.Section} • Year {m.year || m.Year} • Sem {m.semester || m.Semester} • {m.phoneNumber || m.PhoneNumber}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Solo</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 border-y border-white/5">
                                                                {reg.TransactionID !== 'OFFLINE' && (
                                                                    <>
                                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TXN ID</div>
                                                                        <div className="font-mono text-xs text-slate-300 tracking-widest">{reg.TransactionID}</div>
                                                                    </>
                                                                )}
                                                                {reg.TransactionID === 'OFFLINE' && (
                                                                    <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Offline Payment</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 border-y border-white/5">
                                                                <a href={reg.PaymentScreenshot} target="_blank" rel="noreferrer" className="flex items-center gap-3 group/receipt">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover/receipt:border-cyan-400/50 transition-all">
                                                                        <img src={reg.PaymentScreenshot} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-500 group-hover/receipt:text-cyan-400 uppercase tracking-widest">View URL</span>
                                                                </a>
                                                            </td>
                                                            <td className="px-6 py-5 rounded-r-3xl border-y border-r border-white/5 text-right">
                                                                <button onClick={() => handleDeleteRegistration(reg.RegistrationID)} className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Delete Registration">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {
                    myEvents.length === 0 && !loading && (
                        <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl">
                            <Calendar className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">No Operations Found</h3>
                            <p className="text-slate-500 font-medium italic">Protocol suggests initializing your first event record.</p>
                        </div>
                    )
                }

                {/* Create/Edit Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                                onClick={() => { setShowModal(false); setEditingEventId(null); }}
                            />
                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.98, opacity: 0 }}
                                className="relative bg-[#050a1f] rounded-[3rem] w-full max-w-3xl shadow-3xl overflow-hidden flex flex-col border border-white/10 max-h-[90vh]"
                            >
                                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{editingEventId ? 'Sync Event' : 'Initialize Event'}</h2>
                                    <button onClick={() => { setShowModal(false); setEditingEventId(null); }} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Event Title</label>
                                            <input required type="text" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none transition-all text-white font-bold"
                                                value={newEvent.eventTitle} onChange={e => setNewEvent({ ...newEvent, eventTitle: e.target.value })} placeholder="e.g. Nexus Symposium" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Participation Mode</label>
                                            <div className="flex gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                                                {['Single', 'Team'].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setNewEvent({ ...newEvent, eventType: mode, teamSize: mode === 'Single' ? 1 : newEvent.teamSize })}
                                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newEvent.eventType === mode ? 'bg-white text-[#020617] shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Brief Intelligence</label>
                                            <textarea required className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-medium min-h-[120px]"
                                                value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Mission summary..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Operational Rules</label>
                                            <textarea className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-medium min-h-[120px]"
                                                value={newEvent.rules} onChange={e => setNewEvent({ ...newEvent, rules: e.target.value })} placeholder="Protocols to follow..."></textarea>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Date</label>
                                            <input required type="date" className="w-full px-6 py-4 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                onClick={e => e.target.showPicker?.()}
                                                value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Time</label>
                                            <input required type="time" className="w-full px-6 py-4 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                onClick={e => e.target.showPicker?.()}
                                                value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Capacity</label>
                                            <input required type="number" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                value={newEvent.maxParticipants} onChange={e => setNewEvent({ ...newEvent, maxParticipants: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Venue Location</label>
                                            <input required type="text" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} placeholder="e.g. Sector-7 Hall" />
                                        </div>
                                        {newEvent.eventType === 'Team' && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Squad Size</label>
                                                <input required type="number" min="2" className="w-full px-6 py-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-amber-100 font-bold"
                                                    value={newEvent.teamSize} onChange={e => setNewEvent({ ...newEvent, teamSize: e.target.value })} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Lockdown Deadline</label>
                                            <input required type="datetime-local" className="w-full px-6 py-4 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                onClick={e => e.target.showPicker?.()}
                                                value={newEvent.registrationDeadline} onChange={e => setNewEvent({ ...newEvent, registrationDeadline: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Processing Fee (₹)</label>
                                            <input required type="number" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white font-bold"
                                                value={newEvent.entryFee} onChange={e => setNewEvent({ ...newEvent, entryFee: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Visual Asset (Poster)</label>
                                            <div className="flex items-center gap-6">
                                                <label className="flex-1 group/upload">
                                                    <input type="file" accept=".png,.jpeg,.jpg" onChange={handleImageUpload} className="hidden" />
                                                    <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex flex-col items-center gap-3 cursor-pointer">
                                                        <Upload className="h-8 w-8 text-slate-600 group-hover/upload:text-cyan-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uploading ? 'Processing...' : 'Upload Asset'}</span>
                                                    </div>
                                                </label>
                                                {newEvent.posterUrl ? (
                                                    <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                                        <img src={newEvent.posterUrl} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="h-32 w-32 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                                                        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-cyan-400" /> : <ImageIcon className="h-8 w-8 text-slate-600" />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3">Credential QR (Payments)</label>
                                            <div className="flex items-center gap-6">
                                                <label className="flex-1 group/upload">
                                                    <input type="file" accept=".png,.jpeg,.jpg" onChange={handleQrCodeUpload} className="hidden" />
                                                    <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex flex-col items-center gap-3 cursor-pointer">
                                                        <Upload className="h-8 w-8 text-slate-600 group-hover/upload:text-cyan-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{qrUploading ? 'Processing...' : 'Upload QR'}</span>
                                                    </div>
                                                </label>
                                                {newEvent.qrCode ? (
                                                    <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white p-2">
                                                        <img src={newEvent.qrCode} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="h-32 w-32 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                                                        {qrUploading ? <Loader2 className="h-8 w-8 animate-spin text-cyan-400" /> : <div className="text-xs text-center text-slate-600 font-bold p-1">No QR</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 flex gap-6">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingEventId(null); }} className="flex-1 py-5 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all text-[10px]">
                                            Abort
                                        </button>
                                        <button type="submit" disabled={submitting || uploading || qrUploading} className="flex-[2] py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95 text-[10px] flex justify-center items-center gap-3">
                                            {submitting ? <Loader2 className="animate-spin" /> : (editingEventId ? <Edit size={18} /> : <Plus size={18} />)}
                                            {editingEventId ? 'Commit Changes' : 'Publish the Event'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Spot Registration Modal */}
                <AnimatePresence>
                    {showSpotModal && spotEvent && (
                        <SpotRegistrationModal
                            event={spotEvent}
                            onClose={() => { setShowSpotModal(false); setSpotEvent(null); }}
                            onSuccess={() => {
                                fetchParticipants(spotEvent.EventID || spotEvent.id, spotEvent.EventTitle);
                                // Optional: Refresh full data if needed, but participants list is main valid target
                            }}
                        />
                    )}
                    {showOTPModal && otpEvent && (
                        <EntryOTPModal
                            event={otpEvent}
                            onClose={() => {
                                setShowOTPModal(false);
                                setOtpEvent(null);
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClubAdminDashboard;
