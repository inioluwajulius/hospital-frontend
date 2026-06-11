import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Download,
  TrendingUp,
  Eye,
  CheckCircle2,
  X,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Billing = ({ showNotification } = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const billingSummaryData = [
    { day: 'Mon', revenue: 12500, pending: 3200 },
    { day: 'Tue', revenue: 15300, pending: 4100 },
    { day: 'Wed', revenue: 18900, pending: 2800 },
    { day: 'Thu', revenue: 14200, pending: 3900 },
    { day: 'Fri', revenue: 22100, pending: 5200 },
    { day: 'Sat', revenue: 16800, pending: 2100 },
    { day: 'Sun', revenue: 11200, pending: 1900 }
  ];

  const paymentMethodData = [
    { method: 'Cash', amount: 45000 },
    { method: 'Card', amount: 62000 },
    { method: 'Insurance', amount: 38000 },
    { method: 'Bank Transfer', amount: 28000 }
  ];

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    amount: '',
    description: '',
    dueDate: '',
    paymentMethod: 'Pending'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesData, patientsData] = await Promise.all([
          api.getInvoices?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setInvoices(invoicesData || []);
        setPatients(patientsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientId') {
      const patient = patients.find(p => p.id === value);
      setFormData(prev => ({ 
        ...prev, 
        patientId: value, 
        patientName: patient ? patient.name : '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.amount) return;

    setIsSubmitting(true);
    try {
      await api.createInvoice?.(formData);
      setSuccess(true);
      if (showNotification) {
        showNotification('Invoice created successfully!', 'success');
      }

      const updatedInvoices = await api.getInvoices?.() || [];
      setInvoices(updatedInvoices);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          amount: '',
          description: '',
          dueDate: '',
          paymentMethod: 'Pending'
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    if (showNotification) {
      showNotification(`Processing payment for invoice ${invoice.id}...`, 'info');
      setTimeout(() => {
        showNotification('Payment processed successfully!', 'success');
      }, 1500);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    if (showNotification) {
      showNotification(`Downloading invoice ${invoice.id}...`, 'info');
      setTimeout(() => {
        showNotification('Invoice downloaded!', 'success');
      }, 1000);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingAmount = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Revenue Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Track invoices, manage payments, and monitor revenue analytics.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold text-slate-900">${totalRevenue.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <TrendingUp size={14} />
              +12% from last month
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paid Invoices</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold text-slate-900">{paidInvoices}</p>
            <p className="text-xs text-slate-500 font-medium">Settled transactions</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Amount</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold text-slate-900">${pendingAmount.toFixed(2)}</p>
            <p className="text-xs text-slate-500 font-medium">Outstanding payments</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invoices</h3>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <FileText size={18} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold text-slate-900">{invoices.length}</p>
            <p className="text-xs text-slate-500 font-medium">All-time records</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Invoice Created</h3>
                    <p className="text-slate-500 mt-2">The billing record has been saved successfully.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Create Invoice</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Generate billing record for patient</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Patient</label>
                        <select 
                          name="patientId"
                          value={formData.patientId}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        >
                          <option value="">Select Patient</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Amount ($)</label>
                          <input 
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Due Date</label>
                          <input 
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                        <textarea 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="e.g. Consultation + Lab Tests"
                          rows="3"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-2 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard size={20} />
                            Create Invoice
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-900">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={billingSummaryData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-900">Invoices</h3>
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {['All', 'Paid', 'Pending', 'Overdue'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      statusFilter === status 
                        ? "bg-primary text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Search invoices..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredInvoices.slice(0, 8).map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="py-4 flex items-center gap-4 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{invoice.id}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span>{invoice.patientName}</span>
                      <span>{invoice.dueDate || 'No due date'}</span>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <p className="font-bold text-slate-900">${parseFloat(invoice.amount).toFixed(2)}</p>
                  </div>

                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    invoice.status === 'Paid' ? "bg-emerald-100 text-emerald-600" : 
                    invoice.status === 'Pending' ? "bg-amber-100 text-amber-600" :
                    "bg-red-100 text-red-600"
                  )}>
                    {invoice.status || 'Pending'}
                  </span>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                    >
                      <Download size={16} />
                    </button>
                    {invoice.status !== 'Paid' && (
                      <button 
                        onClick={() => handlePayment(invoice)}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-900">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="method" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <Download size={16} />
                Export Report
              </button>
              <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <Calendar size={16} />
                Schedule Payment
              </button>
              <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                Send Reminders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;