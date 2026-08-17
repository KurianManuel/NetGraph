import React, { useState } from "react";
import { api, ApiError } from "../api";
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Activity, 
  Network, 
  Cpu, 
  Laptop, 
  Smartphone, 
  Video, 
  LogIn, 
  UserPlus, 
  X 
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { id: number; username: string; role: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);
  const [username, setUsername] = useState<string>( "");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isSetupMode) {
        // Run setup then auto login
        await api.setupAdmin(username, password);
        const loginRes = await api.login(username, password);
        onLoginSuccess(loginRes.user);
      } else {
        const loginRes = await api.login(username, password);
        onLoginSuccess(loginRes.user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Is the server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300 select-none relative overflow-hidden">
      {/* Decorative ambient background lights */}
      <div className="glow-bubble top-10 left-10 w-96 h-96 bg-indigo-500/10"></div>
      <div className="glow-bubble bottom-10 right-10 w-96 h-96 bg-purple-500/5"></div>

      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 min-h-[580px] transition-colors duration-300">
        
        {/* Left Branding Column */}
        <div className="w-full md:w-[45%] bg-slate-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.05),transparent_70%)]"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight block">
                  NetGraph
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Local Discovery
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Discover. Visualize.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Monitor your network.
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                NetGraph helps you discover devices, visualize topology, and monitor changes in your network in real time.
              </p>
            </div>
          </div>

          {/* SVG Animated Topology Illustration */}
          <div className="relative w-full h-44 my-4 flex items-center justify-center z-10">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 dark:opacity-40">
              <line x1="50%" y1="50%" x2="15%" y2="20%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="85%" y2="20%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="10%" y2="70%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="90%" y2="70%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Gateway Central Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-lg shadow-indigo-500/20">
                <Network className="w-5 h-5" />
              </div>
            </div>

            {/* Floating nodes */}
            <div className="absolute top-[10%] left-[10%] z-20">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute top-[10%] right-[10%] z-20">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                <Network className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute bottom-[20%] left-[2%] z-20">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute bottom-[20%] right-[2%] z-20">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-20">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Secure lock footer */}
          <div className="relative z-10 flex items-center gap-2 text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            <Shield className="w-4 h-4 text-emerald-500 animate-pulse" />
            Secure • Private • Self-Hosted
          </div>
        </div>

        {/* Right Auth Form Column */}
        <div className="w-full md:w-[55%] bg-white dark:bg-slate-900/40 p-8 md:p-12 flex flex-col justify-between relative z-10 transition-colors duration-300">
          
          <div className="space-y-6 my-auto">
            {/* Header titles */}
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isSetupMode ? "Create Administrator" : "Welcome back!"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {isSetupMode 
                  ? "Register the initial administrator account" 
                  : "Sign in to your NetGraph account"}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-3 px-4 pl-11 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-3 px-4 pl-11 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mt-2 select-none">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:outline-none"
                  />
                  Remember me
                </label>
                {!isSetupMode && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold focus:outline-none"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isSetupMode ? (
                  <>
                    <UserPlus className="w-4.5 h-4.5" />
                    Initialize Setup
                  </>
                ) : (
                  <>
                    <LogIn className="w-4.5 h-4.5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Database Setup / Register mode toggle */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isSetupMode ? "Already configured? " : "First launch? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSetupMode(!isSetupMode);
                setError(null);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold focus:outline-none"
            >
              {isSetupMode ? "Sign In" : "Complete Database Setup"}
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password CLI Helper Modal Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full p-6 relative animate-in zoom-in duration-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Password Recovery
              </h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Since NetGraph runs in a secure, self-hosted local environment, passwords cannot be reset via email or third-party cloud utilities.
              </p>
              <p>
                To reset your password, connect to your server console and run the secure admin CLI script:
              </p>
              
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-indigo-300 leading-normal select-text">
                <p className="text-slate-500 mb-2"># Run from project workspace root</p>
                <p className="text-white select-all">python backend/reset_password.py</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
