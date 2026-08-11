import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Devices } from "./pages/Devices";
import { Logs } from "./pages/Logs";
import { 
  Activity, 
  Layers, 
  Terminal, 
  LogOut, 
  Shield, 
  User as UserIcon,
  Sun,
  Moon
} from "lucide-react";

interface User {
  id: number;
  username: string;
  role: string;
}

const Navigation: React.FC<{ user: User; onLogout: () => void; theme: string; toggleTheme: () => void }> = ({ user, onLogout, theme, toggleTheme }) => {
  const location = useLocation();
  const isAdmin = user.role === "admin";

  const getLinkClass = (path: string) => {
    return location.pathname === path ? "nav-btn-active" : "nav-btn";
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex flex-col justify-between p-6 h-screen sticky top-0 transition-colors duration-300">
      <div className="space-y-8">
        {/* Brand Logo & Theme toggle */}
        <div className="flex items-center justify-between">
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
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className={getLinkClass("/dashboard")}>
            <Layers className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/devices" className={getLinkClass("/devices")}>
            <Activity className="w-5 h-5" />
            Devices
          </Link>
          {isAdmin && (
            <Link to="/audit-logs" className={getLinkClass("/audit-logs")}>
              <Terminal className="w-5 h-5" />
              Audit Logs
            </Link>
          )}
        </nav>
      </div>

      {/* Profile & Logout Section */}
      <div className="border-t border-slate-200 dark:border-slate-900 pt-6 space-y-4">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 p-3 rounded-xl transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="font-semibold text-slate-800 dark:text-white text-xs block truncate">
              {user.username}
            </span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1 font-medium capitalize mt-0.5">
              <Shield className="w-3 h-3" />
              {user.role}
            </span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });

  // Sync theme class with HTML element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // Authenticate user on page load
  const restoreSession = async () => {
    try {
      const activeUser = await api.getMe();
      setUser(activeUser);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <div className="relative flex flex-col items-center">
          <Activity className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-slate-500 text-xs mt-4 tracking-widest uppercase">
            Loading NetGraph
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <BrowserRouter>
      <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Navigation Sidebar */}
        <Navigation user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />

        {/* Main Content Area */}
        <main className="flex-1 p-8 md:p-10 max-w-6xl mx-auto overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/devices" element={<Devices />} />
            {user.role === "admin" && (
              <Route path="/audit-logs" element={<Logs />} />
            )}
            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
