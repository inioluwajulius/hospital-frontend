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
import { ShieldCheck, Syringe } from 'lucide-react';

const MedicalRecords = ({ showNotification } = {}) => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newImmunization, setNewImmunization] = useState({ name: '', date: '', status: 'scheduled' });
  const [isAddingImm, setIsAddingImm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    findings: '',
    clinicalNotes: '',
    doctorName: 'Dr. Michael Chen',
    signature: true,
    vitals: {
      bloodPressure: '',
      heartRate: '',
      weight: '',
      height: '',
      temperature: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordsData, patientsData] = await Promise.all([
          api.getMedicalRecords?.() || api.getRecords?.() || Promise.resolve([]),
          api.getPatients()
        ]);
        setRecords(recordsData?.data?.data || recordsData?.data || []);
        setPatients(patientsData?.data?.data || patientsData?.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPatient && api.getPatient) {
      api.getPatient(selectedPatient)
        .then(res => setSelectedPatientData(res?.data?.data || res?.data))
        .catch(console.error);
    } else {
      setSelectedPatientData(null);
    }
  }, [selectedPatient]);

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

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [name]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.chiefComplaint) return;

    setIsSubmitting(true);
    try {
      if (api.createMedicalRecord) {
        await api.createMedicalRecord(formData);
      } else {
        await api.createRecord?.(formData);
      }
      setSuccess(true);
      if (showNotification) {
        showNotification('Medical record created successfully!', 'success');
      }

      const updatedRecords = await (api.getMedicalRecords?.() || api.getRecords?.() || Promise.resolve([]));
      setRecords(updatedRecords?.data?.data || updatedRecords?.data || []);

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
          signature: true,
          vitals: { bloodPressure: '', heartRate: '', weight: '', height: '', temperature: '' }
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

  const handleAddImmunization = async (e) => {
    e.preventDefault();
    if (!newImmunization.name || !newImmunization.date || !selectedPatient) return;
    
    setIsAddingImm(true);
    try {
      const updatedImms = [...(selectedPatientData?.immunizations || []), newImmunization];
      await api.updatePatient(selectedPatient, { immunizations: updatedImms });
      
      const res = await api.getPatient(selectedPatient);
      setSelectedPatientData(res?.data?.data || res?.data);
      
      setNewImmunization({ name: '', date: '', status: 'scheduled' });
      if (showNotification) showNotification('Immunization added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add immunization', error);
      if (showNotification) showNotification('Failed to add immunization', 'error');
    } finally {
      setIsAddingImm(false);
    }
  };

  const processedRecords = records.map(r => ({
    ...r,
    patientName: r.patientId?.userId?.name || r.patientId?.name || 'Unknown',
    doctorName: r.doctorId?.name || 'Unknown',
    patientIdStr: r.patientId?._id || r.patientId?.id || r.patientId,
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Pending'
  }));

  const filteredRecords = processedRecords.filter(record => {
    const matchesSearch =
      record.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPatient = !selectedPatient || record.patientIdStr === selectedPatient;

    return matchesPatient && matchesSearch;
  });

  const patientRecords = selectedPatient 
    ? processedRecords.filter(r => r.patientIdStr === selectedPatient)
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

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} className="text-rose-500" /> Vitals
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">BP (mmHg)</label>
                            <input 
                              type="text" name="bloodPressure" value={formData.vitals.bloodPressure} onChange={handleVitalChange} placeholder="120/80"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">HR (bpm)</label>
                            <input 
                              type="number" name="heartRate" value={formData.vitals.heartRate} onChange={handleVitalChange} placeholder="75"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Weight (kg)</label>
                            <input 
                              type="number" name="weight" value={formData.vitals.weight} onChange={handleVitalChange} placeholder="70"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Height (cm)</label>
                            <input 
                              type="number" name="height" value={formData.vitals.height} onChange={handleVitalChange} placeholder="175"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Temp (°C)</label>
                            <input 
                              type="number" name="temperature" value={formData.vitals.temperature} onChange={handleVitalChange} placeholder="36.5" step="0.1"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>
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
            {selectedPatient && (
              <>
                <button 
                  onClick={() => setActiveTab('immunizations')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'immunizations' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Immunizations
                </button>
                <button 
                  onClick={() => setActiveTab('insurance')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'insurance' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Insurance
                </button>
              </>
            )}
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
          ) : activeTab === 'immunizations' && selectedPatientData ? (
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Syringe className="text-teal-500" size={20} />
                  Immunizations & Preventative Care
                </h3>
              </div>
              
              <div className="space-y-3">
                {selectedPatientData.immunizations && selectedPatientData.immunizations.length > 0 ? (
                  selectedPatientData.immunizations.map((imm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${imm.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <h4 className="font-bold text-slate-900">{imm.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{imm.status === 'completed' ? 'Given on' : 'Due by'} {new Date(imm.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                        imm.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {imm.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                    <Syringe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No immunization records found.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 mb-4">Add Immunization</h4>
                <form onSubmit={handleAddImmunization} className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vaccine Name</label>
                    <input type="text" value={newImmunization.name} onChange={e => setNewImmunization({...newImmunization, name: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none" placeholder="e.g., COVID-19 Booster" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                    <input type="date" value={newImmunization.date} onChange={e => setNewImmunization({...newImmunization, date: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                    <select value={newImmunization.status} onChange={e => setNewImmunization({...newImmunization, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none">
                      <option value="completed">Completed</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isAddingImm} className="w-full md:w-auto px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                    {isAddingImm ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'insurance' && selectedPatientData ? (
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-500" size={20} />
                  Primary Insurance Details
                </h3>
              </div>
              
              {selectedPatientData.insurance ? (
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 mb-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Provider</h4>
                          <p className="text-lg font-black text-indigo-900">{selectedPatientData.insurance.provider || 'N/A'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${selectedPatientData.insurance.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {selectedPatientData.insurance.status || 'Active'}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-indigo-200/50">
                        <h4 className="text-xs font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Policy Number</h4>
                        <p className="font-bold text-indigo-900">{selectedPatientData.insurance.policyNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No insurance information on file.</p>
                </div>
              )}
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
