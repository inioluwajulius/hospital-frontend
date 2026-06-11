import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Download,
  MoreVertical,
  Loader2,
  FileText,
  BarChart3,
  Eye,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Radiology = ({ showNotification } = {}) => {
  const [exams, setExams] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [modalityFilters, setModalityFilters] = useState(['MRI']);
  const [priorityFilter, setPriorityFilter] = useState('All');

  const handleScheduleScan = () => {
    if (showNotification) {
      showNotification('Opening radiology scheduling system...', 'info');
      setTimeout(() => {
        showNotification('Scheduling module loaded.', 'success');
      }, 1000);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    type: '',
    modality: 'MRI',
    priority: 'Routine',
    radiologist: 'Dr. Elena Vance'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsData, patientsData] = await Promise.all([
          api.getRadiologyExams?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setExams(examsData || []);
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
    if (!formData.patientId || !formData.type) return;

    setIsSubmitting(true);
    try {
      await api.createRadiologyExam?.(formData);
      setSuccess(true);
      if (showNotification) {
        showNotification('Radiology exam requested successfully!', 'success');
      }
      
      const updatedExams = await api.getRadiologyExams?.() || [];
      setExams(updatedExams);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          type: '',
          modality: 'MRI',
          priority: 'Routine',
          radiologist: 'Dr. Elena Vance'
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to create imaging order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModality = modalityFilters.length === 0 || modalityFilters.includes(exam.modality);
    const matchesPriority = priorityFilter === 'All' || exam.priority === priorityFilter;

    return matchesSearch && matchesModality && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading radiology data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Radiology & Diagnostic Imaging</h1>
          <p className="text-slate-500 mt-1 font-medium">Coordinate imaging modalities, review scans, and generate radiological reports.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleScheduleScan}
            className="bg-slate-100 text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <Calendar size={18} />
            Schedule Scan
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Imaging Order
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
                    <h3 className="text-2xl font-bold text-slate-900">Imaging Order Created</h3>
                    <p className="text-slate-500 mt-2">The request has been sent to the radiology department.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">New Imaging Order</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Request diagnostic imaging for a patient</p>
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
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Exam Type</label>
                        <input 
                          type="text"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          placeholder="e.g. Chest X-Ray, Brain MRI"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Modality</label>
                          <select 
                            name="modality"
                            value={formData.modality}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          >
                            <option value="MRI">MRI</option>
                            <option value="CT Scan">CT Scan</option>
                            <option value="X-Ray">X-Ray</option>
                            <option value="Ultrasound">Ultrasound</option>
                            <option value="PET Scan">PET Scan</option>
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
                            <option value="Routine">Routine</option>
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
                            <Activity size={20} />
                            Create Order
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
            <h3 className="text-lg font-bold mb-4 text-slate-900">Imaging Filters</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Modality</label>
                <div className="space-y-3">
                  {['MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'PET Scan'].map((mod) => (
                    <label key={mod} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" 
                        checked={modalityFilters.includes(mod)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setModalityFilters(prev => [...prev, mod]);
                          } else {
                            setModalityFilters(prev => prev.filter(m => m !== mod));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{mod}</span>
                    </label>
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
                <h4 className="text-sm font-bold text-slate-900">Imaging Capacity</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Machine Availability</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-2/3"></div>
            </div>
            <p className="text-xs mt-2 text-slate-500 font-medium">4 of 6 machines in use</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
            <button 
              onClick={() => setActiveTab('active')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'active' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Active Exams
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'archive' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Imaging Archive
            </button>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Search by exam type or patient..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                <Filter size={18} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredExams.slice(0, 10).map((exam) => (
                <div 
                  key={exam.id} 
                  className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center gap-8"
                >
                  <div className="w-24 text-center shrink-0">
                    <div className="text-sm font-extrabold text-slate-900">{exam.date || 'Pending'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{exam.modality}</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900">{exam.type}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span>{exam.patientName}</span>
                      <span>Priority: {exam.priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all">
                      <Eye size={18} />
                    </button>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      exam.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : 
                      exam.status === 'In-Progress' ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {exam.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Radiology;
