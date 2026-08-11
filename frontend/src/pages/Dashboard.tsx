import React, { useState, useEffect, useRef } from "react";
import { api, ApiError } from "../api";
import { 
  Play, 
  Layers, 
  RefreshCw, 
  Clock, 
  Terminal as TermIcon, 
  Network, 
  Cpu, 
  Laptop, 
  Smartphone,
  CheckCircle,
  AlertCircle
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
  return Cpu;
};

interface DashboardProps {
  user: { id: number; username: string; role: string };
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [subnet, setSubnet] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const logTimerRef = useRef<any[]>([]);

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
    // Default logs on mount
    setConsoleLogs([
      "System initialized. Standing by for discovery triggers...",
      "Interface configured: 192.168.31.39 / Subnet: 192.168.31.0/24"
    ]);
  }, []);

  const addConsoleLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Poll scan state when scan is running in background
  useEffect(() => {
    let intervalId: any;
    if (isScanning) {
      intervalId = setInterval(async () => {
        try {
          const freshScans = await api.getScans();
          if (freshScans.length > scans.length || (freshScans[0] && freshScans[0].duration > 0)) {
            setIsScanning(false);
            setScanMessage("Scan completed successfully!");
            addConsoleLog(`[SUCCESS] Scan execution complete. Discovered ${devices.length} network assets.`);
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
  }, [isScanning, scans, devices]);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setScanMessage(null);
    setIsScanning(true);
    setConsoleLogs([]);

    // Clear old logs timers
    logTimerRef.current.forEach(clearTimeout);
    logTimerRef.current = [];

    // Trigger backend scan
    try {
      await api.triggerScan(subnet);
      setScanMessage("Subnet scan successfully queued in the background...");
      
      // Seed simulated live terminal logs to represent progress
      const logsTimeline = [
        { delay: 100, msg: "Configuring background task context..." },
        { delay: 1200, msg: "Locating gateway interface (192.168.31.1)..." },
        { delay: 2500, msg: "Resolving subnet network block..." },
        { delay: 4200, msg: "Sweeping network block using multi-threaded ICMP Echo requests..." },
        { delay: 9000, msg: "Reading system ARP table cache..." },
        { delay: 12000, msg: "Parsing active hardware MAC address records..." },
        { delay: 15000, msg: "Resolving vendor OUI database definitions..." },
        { delay: 18000, msg: "Querying reverse DNS hostnames..." },
        { delay: 20500, msg: "Finalizing asset mapping transaction records..." },
      ];

      logsTimeline.forEach((item) => {
        const timer = setTimeout(() => {
          addConsoleLog(item.msg);
        }, item.delay);
        logTimerRef.current.push(timer);
      });

    } catch (err) {
      setIsScanning(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Could not contact server to initiate scan.");
      }
    }
  };

  useEffect(() => {
    return () => {
      logTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  const lastScan = scans[0];
  const lastScanTime = parseUtcDate(lastScan?.scan_time);
  const lastScanTimeStr = lastScanTime 
    ? lastScanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    : "Never";

  return (
    <div className="space-y-8 cyber-grid min-h-screen pb-12">
      {/* Glow Bubbles */}
      <div className="glow-bubble top-10 left-10 w-96 h-96 bg-indigo-500/10"></div>
      <div className="glow-bubble bottom-10 right-10 w-96 h-96 bg-purple-500/5"></div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              NetGraph Dashboard
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visual intelligence console for local subnet monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-300 text-glow-emerald border-glow-emerald">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Gateway Active • {lastScan?.subnet || "192.168.31.0/24"}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { title: "Active Devices", value: devices.length, icon: Network, color: "from-indigo-500 to-cyan-500", glow: "indigo" },
          { title: "Target Subnet", value: lastScan?.subnet || "192.168.31.0/24", icon: Layers, color: "from-purple-500 to-pink-500", glow: "purple", isSmall: true },
          { title: "Last Scan Time", value: lastScanTimeStr, icon: Clock, color: "from-emerald-500 to-teal-500", glow: "emerald" },
          { title: "Duration", value: lastScan ? `${lastScan.duration}s` : "N/A", icon: RefreshCw, color: "from-amber-500 to-orange-500", glow: "amber", spin: isScanning }
        ].map((m, idx) => (
          <div key={idx} className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-r ${m.color} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300`}></div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {m.title}
              </span>
              <span className={`${m.isSmall ? 'text-lg font-bold' : 'text-3xl font-extrabold'} text-slate-900 dark:text-white mt-2 block tracking-tight`}>
                {m.value}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors`}>
              <m.icon className={`w-6 h-6 ${m.spin ? 'animate-spin' : ''}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main interactive panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left: Scan control and Radar */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scan triggers */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-500 dark:text-indigo-400 fill-current" />
                  Trigger Network Discovery
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
                  Initiate a fast, concurrent IP scan. Leave blank to auto-detect your local Wi-Fi interface variables.
                </p>
                
                {scanMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {scanMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}
              </div>

              <form onSubmit={handleStartScan} className="space-y-4">
                <input
                  type="text"
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  placeholder="e.g., 192.168.31.0/24 (optional)"
                  disabled={isScanning}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Performing Scan...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Scan Subnet
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Visual Radar Pane */}
            <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden h-72">
              <div className="absolute inset-0 bg-slate-100/30 dark:bg-slate-950/20"></div>
              
              {/* Radar rings */}
              <div className="relative w-48 h-48 border border-indigo-500/15 rounded-full flex items-center justify-center">
                <div className="w-36 h-36 border border-indigo-500/20 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 border border-indigo-500/30 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 border border-indigo-500/40 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full text-glow-indigo"></div>
                    </div>
                  </div>
                </div>

                {/* Radar Sweep Line */}
                {isScanning && (
                  <div className="absolute inset-0 rounded-full overflow-hidden animate-radar-spin">
                    <div className="w-1/2 h-1/2 bg-gradient-to-tr from-transparent to-indigo-500/30 border-r border-indigo-400 origin-bottom-right absolute bottom-1/2 right-1/2"></div>
                  </div>
                )}

                {/* Glowing mock nodes flashing on sweep */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-80"></div>
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse opacity-60"></div>
                <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-purple-400 animate-pulse opacity-50"></div>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-4 relative z-10">
                {isScanning ? "Active Sonar Sweep..." : "Sonar Sweep Standing By"}
              </span>
            </div>
          </div>

          {/* Interactive Topology Graph Map Mockup */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Subnet Topology
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
              Interactive structural map of nodes resolving gateway hierarchy.
            </p>

            <div className="w-full h-80 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_70%)]"></div>

              {devices.length === 0 ? (
                <div className="text-slate-500 text-sm font-medium z-10">
                  No topology resolved yet. Run a network sweep.
                </div>
              ) : (() => {
                const gateway = devices.find(d => d.ip_address.endsWith(".1")) || devices[0];
                const clients = devices.filter(d => d.id !== gateway?.id);
                
                const getClientPosition = (index: number, total: number) => {
                  if (total === 0) return { x: 50, y: 50 };
                  const angle = (2 * Math.PI * index) / total;
                  const rx = 36; 
                  const ry = 30; 
                  return {
                    x: 50 + rx * Math.cos(angle),
                    y: 50 + ry * Math.sin(angle)
                  };
                };

                return (
                  <>
                    {/* Gateway (Center) */}
                    <div className="relative z-10 flex flex-col items-center group">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Network className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-white mt-2">JioFiber Gateway</span>
                      <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 mt-0.5 bg-indigo-500/10 px-1.5 py-0.25 rounded">{gateway?.ip_address}</span>
                    </div>

                    {/* Dynamic Floating clients around center */}
                    {clients.map((c, i) => {
                      const pos = getClientPosition(i, clients.length);
                      const Icon = getDeviceIcon(c);
                      return (
                        <div 
                          key={c.id} 
                          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                          className="absolute flex flex-col items-center group cursor-pointer z-10"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:border-indigo-500 transition-all duration-300">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-slate-800 dark:text-slate-300 font-medium mt-1.5 group-hover:text-indigo-600 dark:group-hover:text-white truncate max-w-[90px]">
                            {c.hostname}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">{c.ip_address}</span>
                        </div>
                      );
                    })}

                    {/* SVG connection lines connecting clients to gateway */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                      {clients.map((c, i) => {
                        const pos = getClientPosition(i, clients.length);
                        return (
                          <line 
                            key={c.id}
                            x1="50%" 
                            y1="50%" 
                            x2={`${pos.x}%`} 
                            y2={`${pos.y}%`} 
                            stroke="rgba(99,102,241,0.25)" 
                            strokeWidth="1.5" 
                            strokeDasharray="5" 
                          />
                        );
                      })}
                    </svg>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Pane: Live Console and Recent Scans */}
        <div className="space-y-8">
          {/* Live Terminal logs console */}
          <div className="glass-panel p-6 flex flex-col justify-between h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TermIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  Discovery Console
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse text-glow-indigo"></span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                Rolling scanner output log.
              </p>

              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-indigo-300/80 space-y-2 select-text">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-600">&gt;</span> {log}
                  </div>
                ))}
                {isScanning && (
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <span className="text-slate-600">&gt;</span> Running scanner sweep
                    <span className="animate-pulse">...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-4 pt-4 border-t border-slate-200 dark:border-slate-900">
              <span>Host IP: 192.168.31.39</span>
              <span>TTY: local</span>
            </div>
          </div>

          {/* Quick list of past scans */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Scan History</h3>
            {scans.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8">
                No network scans executed yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-900 overflow-hidden text-xs">
                {scans.slice(0, 4).map((scan) => (
                  <div key={scan.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-white block">
                        {scan.subnet}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {parseUtcDate(scan.scan_time)?.toLocaleString() || "Never"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-700 dark:text-slate-300 block font-mono">
                        {scan.duration}s
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {scan.scan_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
