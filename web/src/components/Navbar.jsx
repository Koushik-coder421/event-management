import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Calendar, Shield, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
            <div className="absolute inset-0 bg-[#020617]/40 backdrop-blur-xl border-b border-white/5 shadow-2xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="group flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-all"></div>
                                <Calendar className="h-8 w-8 text-cyan-400 relative z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                Campus<span className="text-white">Connect</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-6">
                        {user ? (
                            <>
                                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                        Active: {user.name}
                                    </span>
                                </div>

                                {['Admin', 'admin', 'Super Admin'].includes(user.role) && (
                                    <Link to="/admin-dashboard" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-all font-black text-[10px] uppercase tracking-widest px-3 py-2 hover:bg-white/5 rounded-xl">
                                        <Shield className="h-4 w-4" />
                                        <span className="hidden md:inline">Central Command</span>
                                    </Link>
                                )}

                                {['ClubAdmin', 'clubadmin', 'Club Admin'].includes(user.role) && (
                                    <Link to="/club-dashboard" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-all font-black text-[10px] uppercase tracking-widest px-3 py-2 hover:bg-white/5 rounded-xl">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden md:inline">Ops Center</span>
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/5 group"
                                >
                                    <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                    <span className="hidden md:inline">Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="group relative px-8 py-3 rounded-full bg-white text-[#020617] font-black uppercase tracking-widest text-[10px] hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 overflow-hidden"
                            >
                                <span className="relative z-10">Portal Login</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
