import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, MapPin, Clock, ArrowLeft, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';

const AllEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [clubs, setClubs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const [eventsRes, clubsRes] = await Promise.all([
                    api.get('/events'),
                    api.get('/clubs')
                ]);
                setEvents(eventsRes.data);
                setClubs(clubsRes.data);
            } catch (err) {
                console.error("Error fetching events", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.EventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.Description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (event.categoryName || event.ClubName) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#020617] pt-24 pb-12 relative overflow-hidden text-white selection:bg-cyan-500 selection:text-white">
            {/* Nebula Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all mb-6 font-bold uppercase tracking-widest text-[10px]"
                        >
                            <ArrowLeft size={16} /> Back to Hub
                        </button>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                            Global <span className="text-cyan-400">Archives.</span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Synchronized Events: <span className="text-white font-black">{filteredEvents.length}</span> Objects Identified
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search archives..."
                                className="pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-72 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none backdrop-blur-xl transition-all text-white placeholder-slate-600 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                            <select
                                className="pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl appearance-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 outline-none backdrop-blur-xl transition-all text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="All" className="bg-[#020617] text-white">All Categories</option>
                                {clubs.map(club => (
                                    <option key={club.ClubID} value={club.ClubName} className="bg-[#020617] text-white">{club.ClubName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.4)]"></div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl">
                        <Calendar className="mx-auto h-20 w-20 text-slate-800 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2">Null Sector</h3>
                        <p className="text-slate-500 font-medium italic">No matches found in the current archival quadrant.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                            className="mt-10 px-8 py-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-cyan-500 hover:text-[#020617] transition-all"
                        >
                            Reset Parameters
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredEvents.map((event, index) => {
                            // Normalize dates to YYYY-MM-DD using LOCAL Time
                            // (Previous error: toISOString uses UTC. If it's 26th locally but still 25th in UTC, it mismatches)

                            const today = new Date();
                            const eventDate = new Date(event.Date);

                            // Check if event date is strict BEFORE today (ignoring time)
                            // We compare Year, Month, Day parts manually or via local string

                            const isEventFinished = new Date(eventDate.toDateString()) < new Date(today.toDateString());


                            return (
                                <motion.div
                                    key={event.EventID || event.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`group bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-cyan-500/40 transition-all duration-700 ${isEventFinished ? 'shadow-none' : 'hover:shadow-[0_0_60px_rgba(34,211,238,0.08)] hover:-translate-y-2'}`}
                                >
                                    <div className="h-52 relative overflow-hidden">
                                        <img
                                            src={event.PosterURL || `https://placehold.co/600x400?text=${encodeURIComponent(event.EventTitle)}`}
                                            alt={event.EventTitle}
                                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ${isEventFinished ? 'grayscale opacity-40' : ''}`}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/600x400?text=Event';
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
                                        <h3 className="text-xl font-black text-white mb-4 group-hover:text-cyan-400 transition-colors tracking-tight line-clamp-1">
                                            {event.EventTitle}
                                        </h3>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold">
                                                <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg">
                                                    <MapPin size={12} className="text-cyan-500" />
                                                </div>
                                                <span className="tracking-tight">{event.Venue}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold">
                                                <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg">
                                                    <Clock size={12} className="text-cyan-500" />
                                                </div>
                                                <span className="tracking-tight">{event.Time}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => !isEventFinished && navigate(`/event/${event.EventID || event.id}`)}
                                            disabled={isEventFinished}
                                            className={`w-full py-3.5 font-black rounded-xl transition-all text-[9px] tracking-[0.2em] uppercase ${isEventFinished
                                                ? 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
                                                : 'bg-white text-[#020617] hover:bg-cyan-500 shadow-xl'}`}
                                        >
                                            {isEventFinished ? 'Closed' : 'View Details'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllEventsPage;
