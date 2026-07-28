import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const user = await login(email, password);
            const userRole = (user.role || '').toLowerCase().replace(/\s/g, '');
            if (['admin', 'superadmin'].includes(userRole)) {
                navigate('/admin-dashboard');
            } else if (['clubadmin'].includes(userRole)) {
                navigate('/club-dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-400 mb-6 shadow-xl shadow-primary/20">
                        <Lock className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome Back</h1>
                    <p className="text-indigo-200/60 font-medium">Elevate your event experience</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm border border-red-500/20 backdrop-blur-md flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-indigo-200/50 mb-2 ml-1 tracking-widest">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300/30 h-5 w-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white/10 text-white placeholder-white/20 outline-none transition-all"
                                placeholder="commander@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase text-indigo-200/50 mb-2 ml-1 tracking-widest">Secret Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300/30 h-5 w-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                required
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white/10 text-white placeholder-white/20 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95 transition-all"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                                Access Dashboard
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-indigo-200/40">
                        Securing Campus Connectivity since 2024
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
