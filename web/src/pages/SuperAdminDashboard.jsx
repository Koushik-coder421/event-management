import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    Users,
    Trash2,
    Plus,
    Layers,
    Shield,
    LogOut,
    Calendar,
    MapPin,
    Clock,
    X,
    Upload,
    RefreshCw,
    Settings,
    User,
    Mail,
    Lock,
    Search,
    Filter,
    Loader2,
    DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminDashboard = () => {
    const { user, login } = useContext(AuthContext); // login can be used to refresh local storage if needed, but we'll use a direct update
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddClub, setShowAddClub] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', description: '', email: '', password: '', logoUrl: '' });
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        department: user?.department || 'General'
    });
    const [uploading, setUploading] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [viewingParticipants, setViewingParticipants] = useState(null);
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownloadReport = async () => {
        try {
            const response = await api.get('/registrations/download-report', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Registrations_Master_Report.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert('Failed to download report');
        }
    };

    const fetchParticipants = async (eventId, eventTitle) => {
        try {
            const res = await api.get(`/registrations/event/${eventId}`);
            setParticipants(res.data);
            setViewingParticipants({ id: eventId, title: eventTitle });
        } catch (error) {
            alert('Failed to fetch participants');
        }
    };

    const handleDeleteRegistration = async (id) => {
        if (!window.confirm('Delete this registration?')) return;
        try {
            await api.delete(`/registrations/${id}`);
            if (viewingParticipants) {
                fetchParticipants(viewingParticipants.id, viewingParticipants.title);
            }
        } catch (error) {
            alert('Failed to delete registration');
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewClub({ ...newClub, logoUrl: res.data.fullUrl });
        } catch (err) {
            alert('Logo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/clubs'),
                api.get('/events'),
                api.get('/auth/users').catch(() => ({ data: [] }))
            ]);

            let hasError = false;

            if (results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)) {
                setClubs(results[0].value.data);
            } else if (results[0].status === 'rejected') {
                console.error('Clubs fetch failed:', results[0].reason);
                hasError = true;
            }

            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)) {
                setEvents(results[1].value.data);
            } else if (results[1].status === 'rejected') {
                console.error('Events fetch failed:', results[1].reason);
                hasError = true;
            }

            if (results[2].status === 'fulfilled') {
                setUsers(results[2].value.data);
            } else {
                setUsers([]);
            }

            if (hasError) {
                alert('Notice: Some platform data could not be retrieved.');
            }
        } catch (error) {
            console.error('General fetch error:', error);
            alert('Failed to connect to the management server.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClub = async (e) => {
        e.preventDefault();
        try {
            await api.post('/clubs', {
                clubName: newClub.name,
                description: newClub.description,
                email: newClub.email,
                password: newClub.password,
                logoUrl: newClub.logoUrl
            });
            alert('Organization launched successfully!');
            setShowAddClub(false);
            setNewClub({ name: '', description: '', email: '', password: '', logoUrl: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating club');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const res = await api.put('/auth/profile', profileForm);
            // Update local storage and context
            localStorage.setItem('user', JSON.stringify(res.data.user));
            alert('Profile updated successfully! Please refresh or re-login if changes don\'t reflect immediately.');
            setShowSettings(false);
            window.location.reload(); // Force reload to ensure context and everything is in sync
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleDeleteClub = async (id) => {
        if (!window.confirm('Are you sure? This will delete the club account and all its events.')) return;
        try {
            await api.delete(`/clubs/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this platform-wide event?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    if (loading && !showSettings) return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Initializing Secure Channel...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 selection:text-cyan-400 pt-24 pb-12 relative overflow-hidden">
            {/* Nebula Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-grid-white opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4 py-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                            <Shield className="h-3 w-3 text-cyan-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">System Override Active</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Central <br /> Command</h1>
                        <p className="text-slate-400 font-medium mt-2 italic text-sm">Authorized Admin: <span className="text-cyan-400 font-black not-italic px-2">{user?.name || user?.Name || 'System Root'}</span></p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all shadow-xl group"
                            title="Core Settings"
                        >
                            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                        <button
                            onClick={handleDownloadReport}
                            className="p-4 bg-white/5 text-cyan-400 hover:text-white rounded-2xl border border-cyan-500/20 hover:border-cyan-500 backdrop-blur-xl transition-all shadow-xl group"
                            title="Download Master Excel Report"
                        >
                            <DownloadCloud className="h-5 w-5 group-hover:scale-125 transition-transform" />
                        </button>
                        <button
                            onClick={fetchData}
                            className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all shadow-xl group"
                            title="Refresh Subsystems"
                        >
                            <RefreshCw className={`h-5 w-5 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddClub(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-[#020617] hover:bg-cyan-500 transition-all font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            <Plus className="h-5 w-5" /> Deploy New Club
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Club Management */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 shadow-3xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20"><Layers className="h-6 w-6" /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registered Clubs</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">System Club Registry</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {clubs.length === 0 ? (
                                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                        <p className="text-slate-500 font-black uppercase tracking-widest italic text-xs">No active clubs detected.</p>
                                    </div>
                                ) : clubs.map(club => (
                                    <div key={club.ClubID} className="group p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-500 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-900 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500 overflow-hidden shadow-2xl">
                                                <img src={club.LogoURL || "https://placehold.co/200"} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white tracking-tight uppercase mb-1">{club.ClubName}</h3>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">{club.Description?.substring(0, 100)}...</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteClub(club.ClubID)} className="p-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shadow-sm">
                                            <Trash2 className="h-6 w-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Event Overview */}
                        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 shadow-3xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20"><Calendar className="h-6 w-6" /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Event Registry</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Event Records</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {events.length === 0 ? (
                                    <div className="col-span-2 text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                        <p className="text-slate-500 font-black uppercase tracking-widest italic text-xs">Zero operational event records found.</p>
                                    </div>
                                ) : events.map(event => {
                                    const today = new Date();
                                    const eventDate = new Date(event.Date);
                                    const isEventFinished = new Date(eventDate.toDateString()) < new Date(today.toDateString());

                                    return (
                                        <div key={event.EventID || event.id} className="relative group p-6 rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl flex flex-col justify-between overflow-hidden hover:border-cyan-500/40 transition-all duration-500 h-[220px]">
                                            {event.PosterURL && (
                                                <div className="absolute inset-0 z-0">
                                                    <img src={event.PosterURL} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
                                                </div>
                                            )}

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <div className="px-3 py-1.5 bg-[#020617]/40 backdrop-blur-md border border-cyan-500/20 rounded-full shadow-2xl">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">
                                                                {event.ClubName || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                        {isEventFinished && (
                                                            <div className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase border border-red-500/20 shadow-sm flex items-center justify-center leading-none">
                                                                Finished
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleDeleteEvent(event.EventID || event.id)} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <h4 className="text-xl font-black text-white tracking-tight uppercase line-clamp-2 leading-none">{event.EventTitle}</h4>
                                            </div>

                                            <div className="relative z-10 mt-6 flex items-center justify-between gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                                                        <Calendar size={10} />
                                                        {new Date(event.Date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Clock size={10} />
                                                        {event.Time}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fetchParticipants(event.EventID || event.id, event.EventTitle)}
                                                    className="px-4 py-3 bg-white/10 hover:bg-white text-white hover:text-[#020617] border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 backdrop-blur-md group/btn"
                                                >
                                                    <Users size={12} className="group-hover/btn:scale-110 transition-transform" />
                                                    Manifest
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-10">
                        <div className="bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 rounded-[3rem] p-10 text-white shadow-3xl relative overflow-hidden border border-white/10">
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 blur-[80px]"></div>
                            <Shield className="absolute -bottom-10 -left-10 h-64 w-64 text-white/5 -rotate-12 pointer-events-none" />

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-10 relative z-10">System Status</h3>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 flex items-center justify-between group hover:border-cyan-500/40 transition-all">
                                    <div>
                                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Active Clubs</div>
                                        <div className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{clubs.length}</div>
                                    </div>
                                    <Layers className="h-8 w-8 text-cyan-500/20" />
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 flex items-center justify-between group hover:border-amber-500/40 transition-all">
                                    <div>
                                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Registered Events</div>
                                        <div className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors uppercase">{events.length}</div>
                                    </div>
                                    <Calendar className="h-8 w-8 text-amber-500/20" />
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 flex items-center justify-between group hover:border-cyan-500/40 transition-all">
                                    <div>
                                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Verified Users</div>
                                        <div className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{users.length}</div>
                                    </div>
                                    <Users className="h-8 w-8 text-cyan-500/20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants Modal */}
            <AnimatePresence>
                {viewingParticipants && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingParticipants(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative bg-[#020617] rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-3xl">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Manifest: {viewingParticipants.title}</h2>
                                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mt-1">Audit Protocol Enabled</p>
                                </div>
                                <button onClick={() => setViewingParticipants(null)} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="p-8 overflow-y-auto custom-scrollbar bg-white/5">
                                {participants.length === 0 ? (
                                    <div className="text-center py-20 text-slate-600 font-black uppercase tracking-[0.3em] italic">No registration records found.</div>
                                ) : (
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
                                                        {reg.Email && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{reg.Email}</div>}
                                                        {reg.PhoneNumber && <div className="text-xs text-cyan-400 font-bold mt-1">Contact: {reg.PhoneNumber}</div>}
                                                    </td>
                                                    <td className="px-6 py-5 border-y border-white/5 text-center">
                                                        {reg.TeamName ? (
                                                            <div className="space-y-2">
                                                                <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Team: {reg.TeamName}</div>
                                                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2 mt-2">
                                                                    {(typeof reg.TeamMembers === 'string' ? JSON.parse(reg.TeamMembers || '[]') : (reg.TeamMembers || [])).map((m, idx) => (
                                                                        <div key={idx} className="text-[10px] leading-tight flex flex-col border-l-2 border-cyan-400/20 pl-2">
                                                                            <span className="font-bold text-white text-left">{typeof m === 'object' ? (m.name || m.Name) : m}</span>
                                                                            {typeof m === 'object' && (
                                                                                <span className="text-slate-500 font-medium text-left">
                                                                                    {m.branch || m.Branch}-{m.section || m.Section} • Year {m.year || m.Year} • Sem {m.semester || m.Semester}
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
                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TXN ID</div>
                                                        <div className="font-mono text-xs text-slate-300 tracking-widest">{reg.TransactionID}</div>
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
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Profile Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="relative bg-[#020617] rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.1)]"
                        >
                            <div className="p-10 border-b border-white/10 bg-white/5 backdrop-blur-3xl">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Core Identity</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Security Parameter Interface</p>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="p-10 space-y-8 bg-white/5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 ml-1 tracking-[0.2em]">Authorized Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors h-5 w-5" />
                                        <input
                                            required placeholder="Verify Identity"
                                            className="w-full pl-16 pr-8 py-5 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none transition-all text-white font-bold"
                                            value={profileForm.name}
                                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 ml-1 tracking-[0.2em]">Communication Channel</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors h-5 w-5" />
                                        <input
                                            required placeholder="Secure Email" type="email"
                                            className="w-full pl-16 pr-8 py-5 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none transition-all text-white font-bold"
                                            value={profileForm.email}
                                            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 ml-1 tracking-[0.2em]">Assigned Sector</label>
                                    <div className="relative group">
                                        <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors h-5 w-5" />
                                        <input
                                            required placeholder="Department/Sector"
                                            className="w-full pl-16 pr-8 py-5 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none transition-all text-white font-bold"
                                            value={profileForm.department}
                                            onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 ml-1 tracking-[0.2em]">Access Key Override</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors h-5 w-5" />
                                        <input
                                            placeholder="••••••••" type="password"
                                            className="w-full pl-16 pr-8 py-5 bg-[#020617] border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none transition-all text-white font-bold"
                                            value={profileForm.password}
                                            onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings(false)}
                                        className="flex-1 py-5 bg-white/5 text-slate-500 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all text-[10px]"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdatingProfile}
                                        className="flex-[2] py-5 bg-cyan-500 text-[#020617] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95 text-[10px] flex justify-center items-center gap-3"
                                    >
                                        {isUpdatingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : 'Commit Profile'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Club Modal */}
            <AnimatePresence>
                {showAddClub && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddClub(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, scaleY: 0.5 }} animate={{ scale: 1, opacity: 1, scaleY: 1 }} exit={{ scale: 0.9, opacity: 0, scaleY: 0.5 }}
                            className="relative bg-[#020617] rounded-[3rem] w-full max-w-xl p-10 shadow-3xl border border-white/10"
                        >
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Initialize <br /> Club</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Cross-Club Deployment Interface</p>
                            <form onSubmit={handleAddClub} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <input required placeholder="Registry Name" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-cyan-500/40 transition-all" value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} />
                                    <input required placeholder="Manager Signal" type="email" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-cyan-500/40 transition-all" value={newClub.email} onChange={e => setNewClub({ ...newClub, email: e.target.value })} />
                                </div>
                                <input required placeholder="Initial Auth Key" type="password" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-cyan-500/40 transition-all" value={newClub.password} onChange={e => setNewClub({ ...newClub, password: e.target.value })} />
                                <textarea required placeholder="Mission Briefing (Description)" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium outline-none focus:border-cyan-500/40 transition-all min-h-[120px]" value={newClub.description} onChange={e => setNewClub({ ...newClub, description: e.target.value })} />

                                <div className="pt-4">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 ml-1 tracking-widest text-center">Visual Identifier Asset</label>
                                    <div className="flex items-center gap-6">
                                        <label className="flex-1 group/upload">
                                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                            <div className="w-full py-8 border-2 border-dashed border-white/10 rounded-3xl hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex flex-col items-center gap-3 cursor-pointer">
                                                <Upload size={24} className="text-slate-600 group-hover/upload:text-cyan-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold tracking-widest">{uploading ? 'Transmitting...' : 'Upload Asset'}</span>
                                            </div>
                                        </label>
                                        {newClub.logoUrl && (
                                            <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                                <img src={newClub.logoUrl} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" disabled={uploading} className="w-full py-5 bg-white text-[#020617] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-cyan-500 transition-all active:scale-95 text-[10px] mt-4">Launch Club Deployment</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
