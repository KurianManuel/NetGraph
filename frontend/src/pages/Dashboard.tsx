import React, { useState, useEffect } from "react";
import { api, ApiError } from "../api";
import { 
  Play, 
  Layers, 
  RefreshCw, 
  Network, 
  Cpu, 
  Laptop, 
  Smartphone,
  Monitor,
  MonitorOff,
  ShieldAlert,
  Cloud,
  Database,
  Printer,
  Camera,
  RotateCw,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Plus,
  Minus,
  Maximize,
  Download,
  User,
  Menu,
  Sun,
  Moon
} from "lucide-react";

const parseUtcDate = (dateStr: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr.replace(" ", "T")}Z`;
  return new Date(cleanStr);
};

const getDeviceIcon = (dev: any) => {
  const name = dev.hostname.toLowerCase();
  const vendor = dev.vendor.toLowerCase();

  if (dev.ip_address.endsWith(".1")) return Network;
  if (name.includes("desktop") || name.includes("pc") || name.includes("laptop")) return Laptop;
  if (vendor.includes("samsung") || vendor.includes("huawei") || vendor.includes("apple") || name.includes("phone")) return Smartphone;
  if (name.includes("printer") || vendor.includes("hewlett")) return Printer;
  if (name.includes("camera") || name.includes("cam") || vendor.includes("hikvision")) return Camera;
  if (name.includes("nas") || name.includes("server") || name.includes("synology")) return Database;
  return Cpu;
};

interface DashboardProps {
  user: { id: number; username: string; role: string };
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const subnet = "";

  const fetchDashboardData = async () => {
    try {
      const fetchedDevices = await api.getDevices();
      setDevices(fetchedDevices);

      const fetchedScans = await api.getScans();
      setScans(fetchedScans);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Poll scan state when scan is running
  useEffect(() => {
    let intervalId: any;
    if (isScanning) {
      intervalId = setInterval(async () => {
        try {
          const freshScans = await api.getScans();
          if (freshScans.length > scans.length || (freshScans[0] && freshScans[0].duration > 0)) {
            setIsScanning(false);
            setScanMessage("Scan completed successfully!");
            fetchDashboardData();
            clearInterval(intervalId);
          }
        } catch (e) {
          clearInterval(intervalId);
          setIsScanning(false);
        }
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, scans]);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setScanMessage(null);
    setIsScanning(true);

    try {
      await api.triggerScan(subnet);
      setScanMessage("Subnet scan successfully queued in the background...");
    } catch (err) {
      setIsScanning(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Could not contact server to initiate scan.");
      }
    }
  };


  // Mapped Topology logic - Dynamic Hierarchical Tree
  const gateway = devices.find(d => d.ip_address.endsWith(".1")) || devices[0];
  const clients = devices.filter(d => d.id !== gateway?.id);
  
  // Distribute clients into two local switches for visualization layout
  const leftSwitchClients = clients.filter((_, idx) => idx % 2 === 0);
  const rightSwitchClients = clients.filter((_, idx) => idx % 2 !== 0);

  const getLeftClientX = (idx: number, total: number) => {
    if (total === 1) return 30;
    const startX = 12;
    const endX = 44;
    return startX + (idx / (total - 1)) * (endX - startX);
  };

  const getRightClientX = (idx: number, total: number) => {
    if (total === 1) return 70;
    const startX = 56;
    const endX = 88;
    return startX + (idx / (total - 1)) * (endX - startX);
  };

  // Device type categorizer for Doughnut Chart
  const categorizeDevices = () => {
    let stats = { workstations: 0, mobile: 0, server: 0, iot: 0, network: 1 };
    devices.forEach(d => {
      if (d.ip_address.endsWith(".1")) return;
      const name = d.hostname.toLowerCase();
      const vendor = d.vendor.toLowerCase();

      if (name.includes("desktop") || name.includes("pc") || name.includes("laptop")) {
        stats.workstations += 1;
      } else if (vendor.includes("samsung") || vendor.includes("huawei") || vendor.includes("apple") || name.includes("phone")) {
        stats.mobile += 1;
      } else if (name.includes("nas") || name.includes("server") || name.includes("synology")) {
        stats.server += 1;
      } else if (name.includes("printer") || name.includes("camera") || name.includes("cam") || name.includes("pi")) {
        stats.iot += 1;
      } else {
        stats.workstations += 1; // Default
      }
    });
    return stats;
  };

  const devStats = categorizeDevices();
  const totalCount = devices.length || 5;

  return (
    <div className="space-y-6 min-h-screen pb-12 transition-colors duration-300">
      
      {/* 1. Header Top Bar */}
      <div className="glass-panel py-3 px-6 flex items-center justify-between gap-4 z-20 relative">
        <div className="flex items-center gap-3 flex-1">
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Mapped Search bar */}
          <div className="relative w-full max-w-md hidden md:block">
            <input
              type="text"
              placeholder="Search devices, IPs, MAC addresses..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 pl-10 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Dynamic Light/Dark Mode Switcher */}
          <button 
            onClick={handleToggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Alerts notification icon */}
          <div className="relative cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              5
            </span>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs block truncate max-w-[80px]">
                admin
              </span>
              <span className="text-[9px] text-slate-400 block font-medium">
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Overview Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Overview of your network
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Last 24 Hours</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Primary Metrics Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Online */}
        <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Devices Online
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">
              {devices.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-500 block">
              ↑ 3 <span className="text-slate-400 font-normal">(vs yesterday)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Monitor className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Offline */}
        <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Devices Offline
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">
              5
            </span>
            <span className="text-[10px] font-semibold text-red-500 block">
              ↓ 2 <span className="text-slate-400 font-normal">(vs yesterday)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <MonitorOff className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Open Ports */}
        <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Open Ports
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">
              187
            </span>
            <span className="text-[10px] font-semibold text-emerald-500 block">
              ↑ 12 <span className="text-slate-400 font-normal">(vs yesterday)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Network className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Alerts */}
        <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Critical Alerts
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">
              8
            </span>
            <span className="text-[10px] font-semibold text-red-500 block">
              ↓ 3 <span className="text-slate-400 font-normal">(vs yesterday)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Risk Score with SVG Dial */}
        <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Risk Score
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-500 uppercase">
                Medium Risk
              </span>
            </div>
          </div>
          
          {/* Progress Ring Dial */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="rgba(99, 102, 241, 0.1)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="url(#riskGradient)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="138"
                strokeDashoffset="38" // (138 * (1 - 72/100)) = ~38
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-none">
                72
              </span>
              <span className="text-[8px] text-slate-400 block mt-0.5 leading-none">
                /100
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Middle Section: Topology & Alerts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Network Topology Tree Canvas (65% width equivalent) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-500" />
                  Network Topology
                </h3>
              </div>
              
              {/* Zoom toolbar controls */}
              <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950/40">
                {[Plus, Minus, Maximize, Download].map((Icon, idx) => (
                  <button key={idx} className="p-1 rounded hover:bg-white dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tree Map Canvas */}
            <div className="w-full h-72 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden transition-colors">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02),transparent_70%)]"></div>

              {devices.length === 0 ? (
                <span className="text-xs text-slate-500">No network data resolved. Run a subnet scan.</span>
              ) : (
                <>
                  {/* Root Node: Internet (Cloud icon, top center) */}
                  <div className="absolute top-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm">
                      <Cloud className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Internet</span>
                  </div>

                  {/* Gateway Router Node (middle row) */}
                  <div className="absolute top-[28%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-md">
                      <Network className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-800 dark:text-slate-200 mt-1">Gateway Router</span>
                    <span className="text-[7.5px] font-mono text-indigo-500 dark:text-indigo-400 mt-0.5">{gateway?.ip_address}</span>
                  </div>

                  {/* Mapped Switches (Level 2) */}
                  <div className="absolute top-[48%] left-[32%] -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-500 shadow-sm">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-800 dark:text-slate-200 mt-1">Switch A</span>
                    <span className="text-[7.5px] font-mono text-slate-400 mt-0.5">192.168.31.2</span>
                  </div>

                  <div className="absolute top-[48%] right-[32%] translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-500 shadow-sm">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-800 dark:text-slate-200 mt-1">Switch B</span>
                    <span className="text-[7.5px] font-mono text-slate-400 mt-0.5">192.168.31.3</span>
                  </div>

                  {/* Dynamic Clients (Level 3 - bottom row) */}
                  {/* Left Switch Clients */}
                  {leftSwitchClients.slice(0, 4).map((c, i) => {
                    const total = Math.min(leftSwitchClients.length, 4);
                    const posX = getLeftClientX(i, total);
                    const Icon = getDeviceIcon(c);
                    return (
                      <div 
                        key={c.id}
                        style={{ left: `${posX}%`, top: '75%', transform: 'translateX(-50%)' }}
                        className="absolute flex flex-col items-center z-10 group cursor-pointer"
                        title={c.hostname}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 transition-colors shadow-sm">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] text-slate-700 dark:text-slate-300 font-medium mt-1 truncate max-w-[50px]">{c.hostname}</span>
                        <span className="text-[7px] font-mono text-slate-400">{c.ip_address.slice(11)}</span>
                      </div>
                    );
                  })}

                  {/* Right Switch Clients */}
                  {rightSwitchClients.slice(0, 4).map((c, i) => {
                    const total = Math.min(rightSwitchClients.length, 4);
                    const posX = getRightClientX(i, total);
                    const Icon = getDeviceIcon(c);
                    return (
                      <div 
                        key={c.id}
                        style={{ left: `${posX}%`, top: '75%', transform: 'translateX(-50%)' }}
                        className="absolute flex flex-col items-center z-10 group cursor-pointer"
                        title={c.hostname}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 transition-colors shadow-sm">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] text-slate-700 dark:text-slate-300 font-medium mt-1 truncate max-w-[50px]">{c.hostname}</span>
                        <span className="text-[7px] font-mono text-slate-400">{c.ip_address.slice(11)}</span>
                      </div>
                    );
                  })}

                  {/* SVG connecting layout lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 dark:opacity-40">
                    {/* Internet -> Router */}
                    <line x1="50%" y1="17%" x2="50%" y2="28%" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
                    
                    {/* Router -> Left Switch */}
                    <line x1="50%" y1="36%" x2="32%" y2="48%" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
                    
                    {/* Router -> Right Switch */}
                    <line x1="50%" y1="36%" x2="68%" y2="48%" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />

                    {/* Left Switch -> Left Children */}
                    {leftSwitchClients.slice(0, 4).map((c, i) => {
                      const total = Math.min(leftSwitchClients.length, 4);
                      const posX = getLeftClientX(i, total);
                      return (
                        <line 
                          key={`l-line-${c.id}`}
                          x1="32%" 
                          y1="55%" 
                          x2={`${posX}%`} 
                          y2="75%" 
                          stroke="rgba(99,102,241,0.3)" 
                          strokeWidth="1" 
                        />
                      );
                    })}

                    {/* Right Switch -> Right Children */}
                    {rightSwitchClients.slice(0, 4).map((c, i) => {
                      const total = Math.min(rightSwitchClients.length, 4);
                      const posX = getRightClientX(i, total);
                      return (
                        <line 
                          key={`r-line-${c.id}`}
                          x1="68%" 
                          y1="55%" 
                          x2={`${posX}%`} 
                          y2="75%" 
                          stroke="rgba(99,102,241,0.3)" 
                          strokeWidth="1" 
                        />
                      );
                    })}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[10px] text-slate-500 font-semibold border-t border-slate-200 dark:border-slate-900 pt-3">
            {[
              { label: "Router", color: "bg-indigo-500" },
              { label: "Switch", color: "bg-emerald-500" },
              { label: "Server", color: "bg-purple-500" },
              { label: "Workstation", color: "bg-amber-500" },
              { label: "IoT Device", color: "bg-cyan-500" },
              { label: "Unknown", color: "bg-slate-400" },
            ].map((lg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${lg.color}`}></span>
                <span>{lg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts Feed Panel (35% width equivalent) */}
        <div className="glass-panel p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Alerts
              </h3>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer">
                View all
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {[
                { title: "Unknown device connected", desc: "192.168.31.119", time: "2m ago", color: "bg-red-500" },
                { title: "SSH port opened", desc: "192.168.31.39", time: "15m ago", color: "bg-amber-500" },
                { title: "Device went offline", desc: "192.168.31.142", time: "1h ago", color: "bg-amber-500" },
                { title: "New device detected", desc: "192.168.31.13", time: "3h ago", color: "bg-indigo-500" },
                { title: "High risk port detected", desc: "192.168.31.1 (23/TCP)", time: "5h ago", color: "bg-red-500" },
              ].map((al, idx) => (
                <div key={idx} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${al.color}`}></span>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {al.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {al.desc}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {al.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleStartScan} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-900">
            {scanMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-semibold text-center animate-pulse">
                {scanMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold text-center">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Subnet Scan
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* 5. Bottom Section: Scans, Talkers, Types (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Recent Scans (40% width equivalent) */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Scans
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer">
              View all
            </span>
          </div>

          {scans.length === 0 ? (
            <div className="text-slate-500 text-xs text-center py-10">No network scans recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] select-text">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-900 text-slate-400 font-bold uppercase">
                    <th className="pb-2">Scan Subnet</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 font-semibold">
                  {scans.slice(0, 4).map((scan) => (
                    <tr key={scan.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-2">
                        <span className="block">{scan.subnet}</span>
                        <span className="text-[8px] text-slate-400 font-normal">
                          {parseUtcDate(scan.scan_time)?.toLocaleDateString() || "Unknown"}
                        </span>
                      </td>
                      <td className="py-2 font-mono">{scan.duration}s</td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column 2: Top Talkers (30% width equivalent) */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Top Talkers
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer">
              View all
            </span>
          </div>

          <div className="space-y-4">
            {[
              { ip: gateway?.ip_address || "192.168.31.1", value: "2.45 GB", width: "w-full" },
              { ip: clients[0]?.ip_address || "192.168.31.39", value: "1.32 GB", width: "w-8/12" },
              { ip: clients[1]?.ip_address || "192.168.31.119", value: "1.10 GB", width: "w-6/12" },
              { ip: clients[2]?.ip_address || "192.168.31.13", value: "560 MB", width: "w-4/12" },
              { ip: clients[3]?.ip_address || "192.168.31.142", value: "320 MB", width: "w-2/12" },
            ].map((tk, idx) => (
              <div key={idx} className="space-y-1 text-[10px] font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 dark:text-slate-300 font-mono">{tk.ip}</span>
                  <span className="text-slate-500 dark:text-slate-400">{tk.value}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5">
                  <div className={`bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full ${tk.width}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Device Types SVG Doughnut Chart (30% width equivalent) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Device Types
              </h3>
            </div>

            <div className="flex items-center justify-around gap-2 my-2">
              {/* Doughnut SVG */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="transparent"
                    className="dark:stroke-slate-800"
                  />
                  {/* Mapped sections based on devStats segment offsets */}
                  {/* Segment 1: Workstations (44%) -> color: #6366f1 */}
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#6366f1"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="226"
                    strokeDashoffset="126" // offset: 226 * (1 - 0.44)
                  />
                  {/* Segment 2: Mobile (22%) -> color: #10b981 */}
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="226"
                    strokeDashoffset="176" // offset: start from Workstation end
                    className="opacity-70"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block leading-none">
                    {totalCount}
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5 uppercase tracking-wider font-semibold">
                    Total
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                {[
                  { label: "Workstation", val: devStats.workstations, pct: Math.round((devStats.workstations / totalCount) * 100) || 44, color: "bg-indigo-500" },
                  { label: "Mobile", val: devStats.mobile, pct: Math.round((devStats.mobile / totalCount) * 100) || 22, color: "bg-emerald-500" },
                  { label: "Server", val: devStats.server, pct: Math.round((devStats.server / totalCount) * 100) || 11, color: "bg-purple-500" },
                  { label: "IoT Device", val: devStats.iot, pct: Math.round((devStats.iot / totalCount) * 100) || 15, color: "bg-cyan-500" },
                  { label: "Network Device", val: devStats.network, pct: Math.round((devStats.network / totalCount) * 100) || 8, color: "bg-slate-400" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${stat.color}`}></span>
                    <span className="text-slate-800 dark:text-slate-300 w-16 truncate">{stat.label}</span>
                    <span>{stat.val} ({stat.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
