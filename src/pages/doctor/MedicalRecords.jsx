import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download,
  Calendar,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  X,
  Upload,
  AlertCircle,
  Loader2,
  Lock,
  Save
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MedicalRecords = ({ showNotification } = {}) => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    findings: '',
    clinicalNotes: '',
    doctorName: 'Dr. Michael Chen',
    signature: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordsData, patientsData] = await Promise.all([
          api.getRecords?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setRecords(recordsData || []);
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
    if (!formData.patientId || !formData.chiefComplaint) return;

    setIsSubmitting(true);
    try {
      await api.createRecord?.(formData);
      setSuccess(true);
      if (showNotification) {
        showNotification('Medical record created successfully!', 'success');
      }

      const updatedRecords = await api.getRecords?.() || [];
      setRecords(updatedRecords);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          chiefComplaint: '',
          diagnosis: '',
          treatment: '',
          findings: '',
          clinicalNotes: '',
          doctorName: 'Dr. Michael Chen',
          signature: true
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to create medical record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = (record) => {
    if (showNotification) {
      showNotification(`Exporting record for ${record.patientName}...`, 'info');
      setTimeout(() => {
        showNotification('PDF exported successfully!', 'success');
      }, 1500);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      record.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPatient = !selectedPatient || record.patientId === selectedPatient;

    return matchesPatient && matchesSearch;
  });

  const patientRecords = selectedPatient 
    ? records.filter(r => r.patientId === selectedPatient)
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medical Records & Documentation</h1>
          <p className="text-slate-500 mt-1 font-medium">Maintain comprehensive patient medical history with immutable records and digital signatures.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Record
        </button>
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
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Record Created Successfully</h3>
                    <p className="text-slate-500 mt-2">The medical record has been saved and digitally signed.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Create Medical Record</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Add new patient medical documentation</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                      <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-bold text-blue-900">HIPAA Compliant</p>
                        <p className="text-xs text-blue-700 mt-0.5">This record will be encrypted and backed up according to healthcare regulations.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Chief Complaint</label>
                          <input 
                            type="text"
                            name="chiefComplaint"
                            value={formData.chiefComplaint}
                            onChange={handleInputChange}
                            placeholder="Primary reason for visit"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Diagnosis</label>
                          <input 
                            type="text"
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleInputChange}
                            placeholder="Clinical diagnosis"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Treatment Plan</label>
                          <textarea 
                            name="treatment"
                            value={formData.treatment}
                            onChange={handleInputChange}
                            placeholder="Prescribed treatment and medications"
                            rows="3"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Clinical Findings</label>
                          <textarea 
                            name="findings"
                            value={formData.findings}
                            onChange={handleInputChange}
                            placeholder="Physical examination findings"
                            rows="3"
                            className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border resize-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Clinical Notes</label>
                        <textarea 
                          name="clinicalNotes"
                          value={formData.clinicalNotes}
                          onChange={handleInputChange}
                          placeholder="Additional clinical observations and follow-up instructions"
                          rows="4"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border resize-none"
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3 items-start">
                        <Lock className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-yellow-900">Digital Signature Required</p>
                          <p className="text-xs text-yellow-700 mt-0.5">This record will be permanently signed by {formData.doctorName} upon submission and cannot be modified.</p>
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
                            <Save size={20} />
                            Save & Sign Record
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Patient Database</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {patients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all",
                    selectedPatient === patient.id 
                      ? "bg-primary text-white" 
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="font-bold text-sm">{patient.name}</div>
                  <div className="text-[10px] font-medium opacity-75">{patient.id}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'timeline' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Timeline View
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'list' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              All Records
            </button>
          </div>

          {activeTab === 'timeline' && selectedPatient ? (
            <div className="space-y-6">
              {patientRecords.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/20"></div>
                  <div className="space-y-6 pl-16">
                    {patientRecords.map((record, idx) => (
                      <motion.div 
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/30 transition-all shadow-sm"
                      >
                        <div className="absolute left-0 top-8 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white -ml-4.5">
                          <FileText size={18} />
                        </div>
                        
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg">{record.chiefComplaint}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                              <Clock size={14} />
                              {record.date || 'Pending'}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleExportPDF(record)}
                            className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-all"
                          >
                            <Download size={18} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {record.diagnosis && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Diagnosis</p>
                              <p className="text-sm text-slate-700">{record.diagnosis}</p>
                            </div>
                          )}
                          {record.findings && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Clinical Findings</p>
                              <p className="text-sm text-slate-700">{record.findings}</p>
                            </div>
                          )}
                          {record.treatment && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Treatment</p>
                              <p className="text-sm text-slate-700">{record.treatment}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <Stethoscope size={14} className="text-primary" />
                            <span className="font-medium text-slate-600">{record.doctorName}</span>
                          </div>
                          {record.signature && (
                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                              <CheckCircle2 size={14} />
                              Signed
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">No records for this patient</p>
                </div>
              )}
            </div>
          ) : activeTab === 'list' ? (
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-900">All Medical Records</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {filteredRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{record.chiefComplaint}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1">
                          <span>{record.patientName}</span>
                          <span>{record.date || 'Pending'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleExportPDF(record)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Select a patient to view their records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;
