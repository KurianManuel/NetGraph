import React, { useState, useEffect } from "react";
import { api } from "../api";
import { 
  Search, 
  ChevronRight, 
  X, 
  Cpu, 
  Network, 
  Activity, 
  Copy, 
  Check, 
  Laptop, 
  Smartphone, 
  Grid, 
  List,
  AlertTriangle
} from "lucide-react";

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const parseUtcDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr.replace(" ", "T")}Z`;
    return new Date(cleanStr);
  };
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (e) {
      console.error("Error loading devices list", e);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeviceClick = async (device: any) => {
    setSelectedDevice(device);
    setLoadingDetails(true);
    try {
      const details = await api.getDeviceDetails(device.id);
      setDeviceDetail(details);
    } catch (e) {
      console.error("Error fetching device details", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const copyToClipboard = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation(); // Prevent card selection click
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to detect randomized MAC addresses
  const isRandomizedMac = (mac: string) => {
    if (!mac || mac === "Unknown") return false;
    // Check if the second hex digit is 2, 6, a, or e (locally administered bits)
    const secondChar = mac.charAt(1).toLowerCase();
    return ["2", "6", "a", "e"].includes(secondChar);
  };

  // Filter devices
  const filteredDevices = devices.filter((dev) => {
    const term = searchTerm.toLowerCase();
    return (
      dev.ip_address.toLowerCase().includes(term) ||
      (dev.mac_address && dev.mac_address.toLowerCase().includes(term)) ||
      dev.hostname.toLowerCase().includes(term) ||
      dev.vendor.toLowerCase().includes(term)
    );
  });

  // Helper to assign device icons
  const getDeviceIcon = (dev: any) => {
    const ip = dev.ip_address;
    const name = dev.hostname.toLowerCase();
    const vendor = dev.vendor.toLowerCase();

    if (ip.endsWith(".1")) return Network; // Gateway
    if (name.includes("desktop") || name.includes("pc") || name.includes("laptop")) return Laptop;
    if (vendor.includes("samsung") || vendor.includes("huawei") || vendor.includes("apple") || name.includes("phone")) return Smartphone;
    return Cpu; // Default
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-160px)]">
      {/* Header, Search & Views */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Device Inventory</h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse discovered assets, physical MAC addresses, and vendor identities.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 pl-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>

          {/* Grid/List selector buttons */}
          <div className="flex items-center border border-slate-800 rounded-xl p-1 bg-slate-900/50">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode Layout */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.length === 0 ? (
            <div className="col-span-full glass-panel py-16 text-center text-slate-500 text-sm">
              No matching network devices found.
            </div>
          ) : (
            filteredDevices.map((dev) => {
              const isGateway = dev.ip_address.endsWith(".1");
              const Icon = getDeviceIcon(dev);
              const hasRandMac = isRandomizedMac(dev.mac_address);

              return (
                <div 
                  key={dev.id}
                  onClick={() => handleDeviceClick(dev)}
                  className="glass-panel p-5 relative overflow-hidden group cursor-pointer flex flex-col justify-between h-56"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full group-hover:scale-110 transition-transform duration-300"></div>
                  
                  {/* Card upper part */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isGateway ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block tracking-tight truncate max-w-[150px]">
                            {dev.hostname}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-semibold uppercase mt-0.5">
                            {isGateway ? "Subnet Gateway" : "LAN Client"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Active indicator */}
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>

                    {/* IP and MAC details */}
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">IP Address</span>
                        <span className="font-semibold">{dev.ip_address}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">MAC Address</span>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[110px]">{dev.mac_address || "Unknown"}</span>
                          {dev.mac_address && (
                            <button
                              onClick={(e) => copyToClipboard(e, dev.mac_address, `mac-${dev.id}`)}
                              className="text-slate-600 hover:text-slate-400 transition-colors"
                            >
                              {copiedId === `mac-${dev.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card bottom footer */}
                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                    <div>
                      {hasRandMac ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium" title="MAC Address is randomized by device for privacy">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Private MAC
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-300">
                          {dev.vendor}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      View details
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table Mode Layout */
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/20">
                  <th className="py-4 px-6">Device / Hostname</th>
                  <th className="py-4 px-6">IP Address</th>
                  <th className="py-4 px-6">MAC Address</th>
                  <th className="py-4 px-6">Vendor</th>
                  <th className="py-4 px-6">Last Active</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                      No matching network devices found.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((dev) => {
                    const isGateway = dev.ip_address.endsWith(".1");
                    const Icon = getDeviceIcon(dev);
                    const hasRandMac = isRandomizedMac(dev.mac_address);
                    
                    return (
                      <tr 
                        key={dev.id} 
                        onClick={() => handleDeviceClick(dev)}
                        className="hover:bg-slate-900/20 cursor-pointer group transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isGateway ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-semibold text-white block text-sm">
                                {dev.hostname}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-sm text-slate-300">
                          {dev.ip_address}
                        </td>
                        <td className="py-4 px-6 font-mono text-sm text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span>{dev.mac_address || "N/A"}</span>
                            {hasRandMac && (
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 py-0.25 rounded" title="Randomized MAC address">LAA</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-300">
                          {hasRandMac ? "Private Wi-Fi Address" : dev.vendor}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-400">
                          {parseUtcDate(dev.last_seen)?.toLocaleString() || "Never"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Side Panel Drawer Overlay */}
      {selectedDevice && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950 border-l border-slate-800/80 shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
              <h3 className="text-xl font-bold text-white">Device Details</h3>
              <button 
                onClick={() => { setSelectedDevice(null); setDeviceDetail(null); }}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Properties list */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  System Info
                </span>
                <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Hostname</span>
                    <span className="text-sm font-semibold text-white block">{selectedDevice.hostname}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">IP Address</span>
                    <span className="text-sm font-semibold text-white block font-mono">{selectedDevice.ip_address}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">MAC Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white block font-mono">
                        {selectedDevice.mac_address || "N/A"}
                      </span>
                      {selectedDevice.mac_address && (
                        <button 
                          onClick={(e) => copyToClipboard(e, selectedDevice.mac_address, "mac-details")}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {copiedId === "mac-details" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Hardware Vendor</span>
                    <span className="text-sm font-semibold text-white block">{selectedDevice.vendor}</span>
                  </div>
                </div>
              </div>

              {/* Privacy Warning for randomized MAC */}
              {isRandomizedMac(selectedDevice.mac_address) && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">MAC Address Randomization Active</span>
                    <span className="text-slate-400 leading-normal block mt-1">
                      This client is utilizing a Private Wi-Fi Address. The hardware vendor is masked for privacy.
                    </span>
                  </div>
                </div>
              )}

              {/* Discovery Details */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Discovery Timeline
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 uppercase block">First Seen</span>
                    <span className="text-xs font-semibold text-slate-300 block mt-1">
                      {parseUtcDate(selectedDevice.first_seen)?.toLocaleDateString() || "Never"}
                    </span>
                  </div>
                  <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 uppercase block">Last Seen</span>
                    <span className="text-xs font-semibold text-slate-300 block mt-1">
                      {parseUtcDate(selectedDevice.last_seen)?.toLocaleDateString() || "Never"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Scan Presence History */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Presence Log
                </span>
                {loadingDetails ? (
                  <div className="flex justify-center py-6">
                    <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                ) : !deviceDetail || deviceDetail.history.length === 0 ? (
                  <div className="text-slate-600 text-xs text-center py-6">
                    No scan logging history available.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                    {deviceDetail.history.map((record: any, idx: number) => {
                      const isOnline = record.state === "online";
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900/20 border border-slate-900"
                        >
                          <span className="text-slate-400 font-mono">
                            {parseUtcDate(record.scan_time)?.toLocaleString() || "Never"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {record.state}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 text-center flex justify-between items-center text-xs text-slate-500">
            <span>Uptime Rating: 100%</span>
            <span>ID Mapping: {selectedDevice.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};
