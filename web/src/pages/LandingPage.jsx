import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowRight, Calendar, Users, Trophy, ChevronRight, Zap, Music, Code, Clock, MapPin } from 'lucide-react';

// Icons mapping based on club name (simple heuristic for demo)
const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('sport')) return <Trophy className="h-8 w-8 text-white" />;
    if (n.includes('tech') || n.includes('code')) return <Code className="h-8 w-8 text-white" />;
    if (n.includes('cultural') || n.includes('music') || n.includes('dance')) return <Music className="h-8 w-8 text-white" />;
    return <Zap className="h-8 w-8 text-white" />;
};

const LandingPage = () => {
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clubsRes = await api.get('/clubs');
                setClubs(clubsRes.data);
                const eventsRes = await api.get('/events');
                console.log("Fetched Events:", eventsRes.data);
                setEvents(eventsRes.data);
            } catch (err) {
                console.error("Error fetching public data", err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-white">
            {/* Nebula Background Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[5%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]"></div>
            </div>

            {/* Hero Section */}
            <header className="relative pt-24 lg:pt-36 pb-16 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-indigo-500/15 rounded-full filter blur-[100px] animate-blob"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-xl mb-8 transform hover:scale-105 transition-all cursor-default">
                        <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">The Future of Interaction</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                        DESIGN YOUR <br /> CAMPUS <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">LEGACY.</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        Join an elite network of student leaders and creators. Experience
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 font-black"> CampusConnect</span> — your daily campus hub.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                        <button
                            onClick={() => document.getElementById('events-section').scrollIntoView({ behavior: 'smooth' })}
                            className="group relative px-10 py-4 rounded-full bg-cyan-500 text-[#020617] font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3 overflow-hidden"
                        >
                            <span className="relative z-10">Explore Events</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                        <Link
                            to="/login"
                            className="px-10 py-4 rounded-full border border-white/20 hover:border-cyan-500/40 text-white font-black uppercase tracking-widest text-xs backdrop-blur-md hover:bg-cyan-500/5 transition-all flex items-center gap-3"
                        >
                            Portal Login
                        </Link>
                    </div>
                </div>
            </header>

            {/* Categories Section */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <div className="max-w-xl">
                            <div className="text-cyan-500 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Active Club Nodes</div>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">EXPLORE <br /> CLUBS.</h2>
                            <div className="h-1 w-16 bg-cyan-500 rounded-full"></div>
                        </div>
                    </div>

                    {clubs.length === 0 ? (
                        <div className="text-center p-20 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl">
                            <Users className="h-16 w-16 text-cyan-500/30 mx-auto mb-6" />
                            <p className="text-slate-400 text-xl font-bold tracking-tight italic">Initializing network...</p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-10">
                            {clubs.map((club) => (
                                <div
                                    key={club.ClubID || club.id}
                                    onClick={() => navigate('/login')}
                                    className="group relative h-[380px] rounded-[3rem] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-700 cursor-pointer shadow-2xl"
                                >
                                    {/* Background Image with Zoom Effect */}
                                    <div className="absolute inset-0 z-0">
                                        {club.LogoURL ? (
                                            <img
                                                src={club.LogoURL}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[2s]"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-[#050510]"></div>';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#050510]" />
                                        )}
                                        {/* Cinematic Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/40 to-transparent transition-opacity duration-500" />
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    </div>

                                    {/* Elevated Content */}
                                    <div className="relative z-10 h-full p-8 flex flex-col justify-end">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl flex items-center justify-center mb-5 border border-white/20 transform group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
                                            {getIcon(club.ClubName)}
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-3 tracking-tighter leading-none">{club.ClubName}</h3>
                                        <p className="text-slate-300 text-sm mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0 font-medium leading-relaxed">
                                            {club.Description || "Dive into a world of excellence and explore curated events designed for students."}
                                        </p>
                                        <div className="flex items-center text-white text-[9px] font-black uppercase tracking-[0.2em] gap-3">
                                            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg">Explore</span>
                                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-[#020617] group-hover:border-cyan-500 transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Events Section */}
            <section id="events-section" className="py-24 relative">
                {/* Decorative pulse for section transition */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                        <div>
                            <div className="text-cyan-500 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Live Updates</div>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">UPCOMING <br /> EVENTS.</h2>
                        </div>
                        <Link to="/all-events" className="group flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all backdrop-blur-xl">
                            <span className="text-xs font-black uppercase tracking-widest">Global Archives</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform text-cyan-500" />
                        </Link>
                    </div>

                    {events.length === 0 ? (
                        <div className="text-center py-24 border border-white/10 rounded-[3rem] bg-white/[0.02]">
                            <p className="text-slate-500 text-sm font-bold tracking-[0.2em] uppercase">Synchronizing...</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map((event) => {
                                const today = new Date();
                                const eventDate = new Date(event.Date);
                                // Check if event date is strictly BEFORE today (ignoring time) using local date string comparison
                                const isEventFinished = new Date(eventDate.toDateString()) < new Date(today.toDateString());

                                return (
                                    <div key={event.EventID || event.id} className={`group bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-cyan-500/40 transition-all duration-700 ${isEventFinished ? 'shadow-none' : 'hover:shadow-[0_0_60px_rgba(34,211,238,0.08)] hover:-translate-y-2'}`}>
                                        <div className="h-52 relative overflow-hidden">
                                            <img
                                                src={event.PosterURL || event.categoryLogo || `https://placehold.co/500x300?text=${encodeURIComponent(event.EventTitle || 'Event')}`}
                                                alt={event.EventTitle}
                                                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ${isEventFinished ? 'grayscale opacity-40' : ''}`}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/500x300?text=Event';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-90"></div>

                                            <div className="absolute top-4 left-4 bg-[#020617]/80 backdrop-blur-2xl border border-white/10 p-3 rounded-xl flex flex-col items-center shadow-2xl min-w-[50px]">
                                                <span className="text-[8px] font-black text-cyan-400 uppercase mb-1 tracking-wider">{new Date(event.Date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-black text-white leading-none">{new Date(event.Date).getDate()}</span>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl">
                                                <span className="text-[8px] font-black text-cyan-200 uppercase tracking-widest leading-none">
                                                    {event.categoryName || event.ClubName || 'Verified'}
                                                </span>
                                            </div>
                                            {isEventFinished && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60]">
                                                    <div className="border-[2px] border-red-500/80 rounded-lg px-3 py-1 -rotate-12 bg-black/70 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                                                        <span className="text-red-500 font-black text-lg tracking-[0.1em] uppercase">FINISHED</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent"></div>
                                                <div className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">{event.Venue}</div>
                                            </div>

                                            <h3 className="text-xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors tracking-tight leading-snug truncate">{event.EventTitle}</h3>
                                            <p className="text-slate-400 text-[13px] mb-6 line-clamp-2 font-medium leading-relaxed">{event.Description}</p>

                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                                                    <Calendar className="h-3.5 w-3.5 text-cyan-500 mb-1.5" />
                                                    <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Date</div>
                                                    <div className="text-[11px] font-bold text-white">{event.Date ? new Date(event.Date).toLocaleDateString() : 'Active'}</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                                                    <Clock className="h-3.5 w-3.5 text-cyan-500 mb-1.5" />
                                                    <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Time</div>
                                                    <div className="text-[11px] font-bold text-white">{event.Time}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => !isEventFinished && navigate(`/event/${event.EventID || event.id}`)}
                                                disabled={isEventFinished}
                                                className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isEventFinished
                                                    ? 'bg-white/5 text-slate-700 cursor-not-allowed'
                                                    : 'bg-white text-[#020617] hover:bg-cyan-500 shadow-lg active:scale-95'}`}
                                            >
                                                {isEventFinished ? 'Closed' : 'View Details'}
                                                {!isEventFinished && <ArrowRight className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
