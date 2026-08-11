import React, { useState } from "react";
import { api, ApiError } from "../api";
import { UserPlus, LogIn, Activity } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { id: number; username: string; role: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Decorative ambient background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-slow-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] animate-slow-pulse"></div>

      <div className="relative w-full max-w-md px-6 py-12">
        <div className="glass-panel p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
              <Activity className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">NetGraph</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 text-center">
              {isSetupMode
                ? "Create initial administrator account"
                : "Log in to your network dashboard"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="admin"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isSetupMode ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Initialize Setup
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Log In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-900 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSetupMode(!isSetupMode);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isSetupMode
                ? "Already have an account? Log In"
                : "First launch? Complete Database Setup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
