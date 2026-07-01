import React, { useState, useEffect, useMemo } from 'react';
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
import toast from 'react-hot-toast';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
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
    doctorName: 'Dr. Julius Ini',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [presData, patientData] = await Promise.all([
          api.getPrescriptions?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setPrescriptions(presData?.data?.data || presData?.data || []);
        setPatients(patientData?.data?.data || patientData?.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientId') {
      const patient = patients.find(p => p.id === value || p._id === value);
      setFormData(prev => ({ 
        ...prev, 
        patientId: value, 
        patientName: patient ? (patient.userId?.name || patient.name) : '' 
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
      const payload = {
        patientId: formData.patientId,
        medications: [{
          name: formData.medicationName,
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          instructions: formData.instructions
        }],
        notes: ''
      };

      await api.createPrescription(payload);
      setSuccess(true);
      
      const updatedPresData = await api.getPrescriptions();
      setPrescriptions(updatedPresData?.data?.data || updatedPresData?.data || []);

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
          doctorName: 'Dr. Julius Ini',
          status: 'Active'
        });
      }, 2000);
    } catch (err) {
      console.error('Error creating prescription:', err);
      toast.error('Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processedPrescriptions = useMemo(() => {
    return prescriptions.map(pres => {
      const med = pres.medications && pres.medications[0] ? pres.medications[0] : {};
      return {
        ...pres,
        patientName: pres.patientId?.userId?.name || pres.patientId?.name || 'Unknown Patient',
        doctorName: pres.doctorId?.name || 'Dr. Julius Ini',
        medicationName: med.name || 'N/A',
        dosage: med.dosage || 'N/A',
        frequency: med.frequency || 'N/A',
        duration: med.duration || 'N/A',
        instructions: med.instructions || ''
      };
    });
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return processedPrescriptions.filter(prescription => {
      const matchesSearch = 
        prescription.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.medicationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || prescription.status === statusFilter || (prescription.status === undefined && statusFilter === 'Active');

      return matchesSearch && matchesStatus;
    });
  }, [processedPrescriptions, searchQuery, statusFilter]);

  const handlePrintPrescription = (prescription) => {
    toast.success(`Preparing prescription for ${prescription.patientName || 'Patient'}`);
  };

  const handleRefillRequest = (prescription) => {
    toast.success('Refill request sent to pharmacy.');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prescription Management</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Loading prescriptions...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
        <div className="mt-8 space-y-4">
          <SkeletonCard count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Pill size={28} />
            </div>
            Prescriptions
          </h1>
          <p className="text-slate-500 font-medium">Track medications, manage refills, and issue new prescriptions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus size={18} />
          New Prescription
        </button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-blue-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-blue-100">
              <Pill size={28} className="text-blue-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{prescriptions.length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Prescriptions</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-emerald-100">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{prescriptions.filter(p => p.status === 'Active' || p.status === undefined).length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Active</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-red-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-red-100">
              <AlertCircle size={28} className="text-red-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{prescriptions.filter(p => p.status === 'Expired').length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Expired</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-amber-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-amber-100">
              <Clock size={28} className="text-amber-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{prescriptions.filter(p => p.status === 'Pending Refill').length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Pending Refill</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" 
              placeholder="Search by medication, patient, or doctor..." 
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
                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-all border",
                  statusFilter === status
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Pill}
              title="No Prescriptions Found"
              description={searchQuery ? "No prescriptions match your search criteria." : "There are no prescriptions available."}
              action={!searchQuery ? () => setIsModalOpen(true) : undefined}
              actionLabel="Create Prescription"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((pres, idx) => (
              <motion.div 
                key={pres.id || pres._id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 group"
              >
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                      <Pill size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                        <h4 className="font-extrabold text-slate-900 text-lg">{pres.medicationName}</h4>
                        <span className={cn(
                          "w-fit px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                          (pres.status === 'Active' || pres.status === undefined) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          pres.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                        )}>
                          {pres.status || 'Active'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-xs font-bold text-slate-500">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Dosage</span>
                          <span className="text-slate-700">{pres.dosage}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Frequency</span>
                          <span className="text-slate-700">{pres.frequency}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Patient</span>
                          <span className="text-slate-700 flex items-center gap-1.5"><User size={12}/> {pres.patientName}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Physician</span>
                          <span className="text-slate-700 flex items-center gap-1.5"><Stethoscope size={12}/> {pres.doctorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button 
                    onClick={() => handlePrintPrescription(pres)}
                    className="flex-1 lg:flex-none p-3 lg:px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    <span className="lg:hidden text-sm">Print</span>
                  </button>
                  {(pres.status === 'Active' || pres.status === undefined) && (
                    <button 
                      onClick={() => handleRefillRequest(pres)}
                      className="flex-1 lg:flex-none p-3 lg:px-4 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Copy size={18} />
                      <span className="lg:hidden text-sm">Refill</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Prescription Created!</h3>
                    <p className="text-slate-500 mt-2 font-medium">The medication prescription has been successfully recorded.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Issue Prescription</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Record medication for a patient</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-50/50">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Patient
                          {formErrors.patientId && <span className="text-red-500 normal-case tracking-normal font-bold">{formErrors.patientId}</span>}
                        </label>
                        <select 
                          name="patientId"
                          value={formData.patientId}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none appearance-none shadow-sm",
                            formErrors.patientId ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                        >
                          <option value="">Select Patient</option>
                          {patients.map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>{p.userId?.name || p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Medication Name
                          {formErrors.medicationName && <span className="text-red-500 normal-case tracking-normal font-bold">{formErrors.medicationName}</span>}
                        </label>
                        <input 
                          type="text"
                          name="medicationName"
                          value={formData.medicationName}
                          onChange={handleInputChange}
                          placeholder="e.g., Amoxicillin 500mg"
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            formErrors.medicationName ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            Dosage
                            {formErrors.dosage && <span className="text-red-500 normal-case tracking-normal font-bold">{formErrors.dosage}</span>}
                          </label>
                          <input 
                            type="text"
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleInputChange}
                            placeholder="e.g., 2 tablets"
                            className={cn(
                              "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                              formErrors.dosage ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Frequency</label>
                          <select 
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                          >
                            <option value="Once Daily">Once Daily</option>
                            <option value="Twice Daily">Twice Daily</option>
                            <option value="Three Times Daily">Three Times Daily</option>
                            <option value="Four Times Daily">Four Times Daily</option>
                            <option value="As Needed">As Needed</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Duration
                          {formErrors.duration && <span className="text-red-500 normal-case tracking-normal font-bold">{formErrors.duration}</span>}
                        </label>
                        <input 
                          type="text"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          placeholder="e.g., 7 days, 2 weeks"
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            formErrors.duration ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Instructions & Notes</label>
                        <textarea 
                          name="instructions"
                          value={formData.instructions}
                          onChange={handleInputChange}
                          placeholder="e.g., Take with food, avoid dairy..."
                          rows="3"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-primary text-white font-extrabold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </>
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
      </AnimatePresence>
    </div>
  );
};

export default Prescriptions;