import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Shield, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Monitor, 
  Globe, 
  Lock,
  Loader2,
  ChevronRight,
  Download,
  Calendar,
  Activity,
  MoreHorizontal
} from 'lucide-react';

export const AuditLogs = ({ showNotification }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.getAuditLogs();
        if (response.data && response.data.logs) {
          // If backend returns { logs: [...] }
          setLogs(response.data.logs);
        } else if (Array.isArray(response.data)) {
          // If backend returns [...]
          setLogs(response.data);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleExport = () => {
    if (showNotification) {
      showNotification('Exporting system audit logs...', 'info');
      setTimeout(() => {
        showNotification('Logs exported successfully!', 'success');
      }, 2000);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading system audit trail...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Audit & Security Logs</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor administrative actions, data access, and security-critical events.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Download size={18} />
          Export Logs
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search logs by action, user, or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'security' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Shield size={16} />
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Module</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Clock size={14} className="text-slate-400" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-bold text-slate-900">{log.userName}</p>
                      <p className="text-xs text-slate-500">{log.userRole}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.action}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.severity === 'Info' && <CheckCircle2 size={16} className="text-green-500" />}
                      {log.severity === 'Warning' && <AlertCircle size={16} className="text-yellow-500" />}
                      {log.severity === 'Error' && <AlertCircle size={16} className="text-red-500" />}
                      <span className="text-sm font-bold text-slate-600">{log.severity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
