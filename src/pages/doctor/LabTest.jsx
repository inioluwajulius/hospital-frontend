import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MoreVertical, 
  Loader2,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  BarChart3
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LabTest = ({ showNotification }) => {
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('latest');
  const [categoryFilters, setCategoryFilters] = useState(['Blood']);
  const [statusFilter, setStatusFilter] = useState('All');

  const handleExport = () => {
    if (showNotification) {
      showNotification('Exporting laboratory report...', 'info');
      setTimeout(() => {
        showNotification('Report exported successfully!', 'success');
      }, 2000);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    testName: '',
    category: 'Blood',
    requestedBy: 'Dr. Julius Ini',
    priority: 'Normal'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsData, patientsData] = await Promise.all([
          api.getLabTests?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setTests(testsData || []);
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
      const selectedPatient = patients.find(p => p.id === value);
      setFormData(prev => ({ 
        ...prev, 
        patientId: value, 
        patientName: selectedPatient ? selectedPatient.name : '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.testName) return;

    setIsSubmitting(true);
    try {
      await api.createLabTest?.(formData);
      setSuccess(true);
      if (showNotification) {
        showNotification('Lab test request created successfully!', 'success');
      }
      
      const updatedTests = await api.getLabTests?.() || [];
      setTests(updatedTests);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          testName: '',
          category: 'Blood',
          requestedBy: 'Dr. Julius Ini',
          priority: 'Normal'
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to create lab test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = 
      test.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(test.category);
    const matchesStatus = statusFilter === 'All' || test.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading laboratory data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lab Results & Diagnostic Tests</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage pathology workflows, review parameters, and catalog clinical diagnostics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <Download size={18} />
            Export Report
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Create New Test
          </button>
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Lab Test Created</h3>
                    <p className="text-slate-500 mt-2">The test request has been added to the laboratory queue.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Request Lab Test</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Order new diagnostics for a patient</p>
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
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Patient</label>
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

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Test Name</label>
                        <input 
                          type="text"
                          name="testName"
                          value={formData.testName}
                          onChange={handleInputChange}
                          placeholder="e.g. Complete Blood Count"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                          <select 
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          >
                            <option value="Blood">Blood</option>
                            <option value="Urine">Urine</option>
                            <option value="Biochemistry">Biochemistry</option>
                            <option value="Microbiology">Microbiology</option>
                            <option value="Imaging">Imaging</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Priority</label>
                          <select 
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          >
                            <option value="Normal">Normal</option>
                            <option value="Urgent">Urgent</option>
                            <option value="STAT">STAT</option>
                          </select>
                        </div>
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
                        className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <FlaskConical size={20} />
                            Create Request
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Filters</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Category</label>
                <div className="space-y-3">
                  {['Blood', 'Urine', 'Biochemistry', 'Microbiology', 'Imaging'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" 
                        checked={categoryFilters.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryFilters(prev => [...prev, cat]);
                          } else {
                            setCategoryFilters(prev => prev.filter(c => c !== cat));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'In-Progress', 'Completed'].map((status) => (
                    <span 
                      key={status} 
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border",
                        status === statusFilter ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
                      )}
                    >
                      {status}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Lab Capacity</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Utilization</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-3/4"></div>
            </div>
            <p className="text-xs mt-2 text-slate-500 font-medium">75% of machines active</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
            <button 
              onClick={() => setActiveTab('latest')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'latest' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Latest Results
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'pending' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Pending Review
            </button>
          </div>

          <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Search by test name, patient, or ID..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                  <Filter size={18} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredTests.slice(0, 10).map((test) => (
                <div 
                  key={test.id} 
                  className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center gap-8"
                >
                  <div className="w-24 text-center shrink-0">
                    <div className="text-sm font-extrabold text-slate-900">{test.date || 'Pending'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{test.category}</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900">{test.testName}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span>{test.patientName}</span>
                      <span>ID: {test.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      test.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : 
                      test.status === 'In-Progress' ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {test.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LabTest;