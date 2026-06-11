import React, { useState, useEffect } from 'react';
import { 
  Pill,
  Search, 
  Plus, 
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Download,
  MoreVertical,
  Clock,
  User,
  Stethoscope,
  Copy,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const Prescriptions = ({ showNotification } = {}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    medicationName: '',
    dosage: '',
    frequency: 'Twice Daily',
    duration: '',
    instructions: '',
    doctorName: 'Dr. Michael Chen',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presData, patientData] = await Promise.all([
          api.getPrescriptions?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setPrescriptions(presData?.data || presData || []);
        setPatients(patientData?.data || patientData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load prescriptions');
        setPrescriptions([]);
        setPatients([]);
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
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.patientId) newErrors.patientId = 'Patient is required';
    if (!formData.medicationName) newErrors.medicationName = 'Medication name is required';
    if (!formData.dosage) newErrors.dosage = 'Dosage is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPrescription(formData);
      setSuccess(true);
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          medicationName: '',
          dosage: '',
          frequency: 'Twice Daily',
          duration: '',
          instructions: '',
          doctorName: 'Dr. Michael Chen',
          status: 'Active'
        });
      }, 2000);
    } catch (err) {
      console.error('Error creating prescription:', err);
      setFormErrors({ submit: 'Failed to create prescription. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medicationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePrintPrescription = (prescription) => {
    // Print prescription - in real app would generate PDF
    console.log('Printing prescription:', prescription);
  };

  const handleRefillRequest = (prescription) => {
    // Request refill
    console.log('Requesting refill for:', prescription);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prescription Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Track medications, manage refills, and print prescriptions</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={18} />
          New Prescription
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Prescriptions</h3>
            <Pill className="text-primary" size={20} />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{prescriptions.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active</h3>
            <CheckCircle2 className="text-emerald-600" size={20} />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{prescriptions.filter(p => p.status === 'Active').length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expired</h3>
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{prescriptions.filter(p => p.status === 'Expired').length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Refill</h3>
            <Clock className="text-amber-600" size={20} />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{prescriptions.filter(p => p.status === 'Pending Refill').length}</p>
        </div>
      </div>

      {/* Modal - Always available */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Prescription Created</h3>
                    <p className="text-slate-500 mt-2">Medication prescription has been recorded.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Create Prescription</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Issue medication prescription to patient</p>
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

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Medication Name</label>
                        <input 
                          type="text"
                          name="medicationName"
                          value={formData.medicationName}
                          onChange={handleInputChange}
                          placeholder="e.g., Amoxicillin"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Dosage</label>
                          <input 
                            type="text"
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleInputChange}
                            placeholder="e.g., 500mg"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Frequency</label>
                          <select 
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          >
                            <option value="Once Daily">Once Daily</option>
                            <option value="Twice Daily">Twice Daily</option>
                            <option value="Three Times Daily">Three Times Daily</option>
                            <option value="Four Times Daily">Four Times Daily</option>
                            <option value="As Needed">As Needed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Duration</label>
                        <input 
                          type="text"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          placeholder="e.g., 10 days, 2 weeks"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Instructions</label>
                        <textarea 
                          name="instructions"
                          value={formData.instructions}
                          onChange={handleInputChange}
                          placeholder="e.g., Take with food, avoid dairy products..."
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
                            <Pill size={20} />
                            Issue Prescription
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

      {/* Loading State */}
      {loading && <SkeletonCard count={5} />}

      {/* Empty State */}
      {!loading && filteredPrescriptions.length === 0 && (
        <EmptyState
          icon={Pill}
          title="No Prescriptions Found"
          description={searchQuery ? "No prescriptions match your search" : "No prescriptions yet"}
          action={!searchQuery ? () => setIsModalOpen(true) : undefined}
          actionLabel="Create Prescription"
        />
      )}

      {/* Prescriptions List */}
      {!loading && filteredPrescriptions.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none" 
              placeholder="Search by medication, patient..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Active', 'Expired', 'Pending Refill'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="divide-y divide-slate-50">
            {filteredPrescriptions.slice(0, 12).map((pres, idx) => (
              <motion.div 
                key={pres.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Pill size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1 text-lg">{pres.medicationName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600 font-medium">
                        <div>
                          <span className="text-slate-400">Dosage:</span> {pres.dosage}
                        </div>
                        <div>
                          <span className="text-slate-400">Frequency:</span> {pres.frequency}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {pres.patientName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Stethoscope size={14} />
                          {pres.doctorName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    pres.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                    pres.status === 'Expired' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  )}>
                    {pres.status}
                  </span>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePrintPrescription(pres)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                      title="Print prescription"
                    >
                      <Download size={18} />
                    </button>
                    {pres.status === 'Active' && (
                      <button 
                        onClick={() => handleRefillRequest(pres)}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                        title="Request refill"
                      >
                        <Copy size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;