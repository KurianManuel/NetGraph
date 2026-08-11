import React, { useState, useEffect } from "react";
import { api } from "../api";
import { 
  Search, 
  Terminal, 
  Info, 
  X 
} from "lucide-react";

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDetails, setSelectedDetails] = useState<string | null>(null);

  const parseUtcDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr.replace(" ", "T")}Z`;
    return new Date(cleanStr);
  };

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error("Error fetching audit logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const username = log.username ? log.username.toLowerCase() : "system";
    const details = log.details ? log.details.toLowerCase() : "";
    return (
      log.action.toLowerCase().includes(term) ||
      username.includes(term) ||
      log.ip_address.toLowerCase().includes(term) ||
      details.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-3">
            System Audit Trail
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Immutable log tracking of administrative events, sweeps, and logins.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/20">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Client IP</th>
                <th className="py-4 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-900/60 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No logs found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let badgeColor = "text-slate-400 bg-slate-900";
                  if (log.action === "login") badgeColor = "text-emerald-400 bg-emerald-500/10";
                  else if (log.action === "setup") badgeColor = "text-blue-400 bg-blue-500/10";
                  else if (log.action === "scan_triggered") badgeColor = "text-indigo-400 bg-indigo-500/10";
                  else if (log.action === "scan_completed") badgeColor = "text-purple-400 bg-purple-500/10";
                  else if (log.action === "scan_failed" || log.action === "login_failed") badgeColor = "text-red-400 bg-red-500/10";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {parseUtcDate(log.created_at)?.toLocaleString() || "Never"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-300">
                        {log.username || "System"}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {log.ip_address}
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate">
                        {log.details ? (
                          <button
                            onClick={() => setSelectedDetails(log.details)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 focus:outline-none"
                          >
                            <Info className="w-3.5 h-3.5" />
                            View Metadata
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-lg w-full p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-900 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Log Event Metadata
              </h3>
              <button 
                onClick={() => setSelectedDetails(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-900 text-xs font-mono text-indigo-300 p-4 rounded-xl overflow-x-auto max-h-64">
              {JSON.stringify(JSON.parse(selectedDetails), null, 2)}
            </pre>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDetails(null)}
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
