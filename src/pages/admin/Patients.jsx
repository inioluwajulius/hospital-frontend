import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  ExternalLink,
  Mail,
  Phone,
  Loader2,
  Users,
  UserPlus,
  Activity,
  Calendar,
  ChevronRight,
  Heart,
  Droplets,
  MapPin,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Syringe,
  Save
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePatientTab, setActivePatientTab] = useState('all');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilters, setStatusFilters] = useState(['Active']);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  
  const [isEditingInsurance, setIsEditingInsurance] = useState(false);
  const [insuranceData, setInsuranceData] = useState({ provider: '', policyNumber: '', status: 'Active' });
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);
  
  const [isAddingImm, setIsAddingImm] = useState(false);
  const [newImmunization, setNewImmunization] = useState({ name: '', date: '', status: 'scheduled' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = 'Full name is required';
        else if (value.length < 3) error = 'Name must be at least 3 characters';
        break;
      case 'email':
        if (!value) error = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!/^\+?[\d\s-]{10,}$/.test(value)) error = 'Invalid phone format';
        break;
      case 'age':
        if (!value) error = 'Age is required';
        else if (isNaN(Number(value)) || Number(value) <= 0) error = 'Age must be a positive number';
        break;
      case 'gender':
        if (!value) error = 'Gender selection is required';
        break;
      case 'address':
        if (!value) error = 'Residential address is required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPatient({
        ...formData,
        age: Number(formData.age)
      });
      setRegistrationSuccess(true);
      toast.success('Patient registered successfully!');
      
      const updatedRes = await api.getPatients();
      const responseData = updatedRes?.data;
      const patientsList = responseData?.data || responseData || [];
      const formattedPatients = Array.isArray(patientsList) ? patientsList.map(p => ({
          ...p,
          id: p._id || p.id,
          name: p.userId?.name || p.name,
          email: p.userId?.email || p.email,
      })) : [];
      setPatients(formattedPatients);

      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegistrationSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          age: '',
          gender: '',
          bloodGroup: '',
          address: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.getPatients();
        const responseData = res?.data;
        const patientsList = responseData?.data || responseData || [];
        const formattedPatients = Array.isArray(patientsList) ? patientsList.map(p => ({
            ...p,
            id: p._id || p.id,
            name: p.userId?.name || p.name,
            email: p.userId?.email || p.email,
        })) : [];
        setPatients(formattedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to load patient directory.');
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      api.getPatient(selectedPatient.id)
        .then(res => {
          const data = res?.data?.data || res?.data;
          setSelectedPatientDetails(data);
          if (data?.insurance) {
            setInsuranceData(data.insurance);
          }
        })
        .catch(err => {
          console.error('Failed to fetch patient details', err);
          setSelectedPatientDetails(selectedPatient); // fallback
        });
    } else {
      setSelectedPatientDetails(null);
      setIsEditingInsurance(false);
      setIsAddingImm(false);
    }
  }, [selectedPatient]);

  const handleUpdateInsurance = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsUpdatingRecord(true);
    try {
      await api.updatePatient(selectedPatient.id, { insurance: insuranceData });
      const res = await api.getPatient(selectedPatient.id);
      setSelectedPatientDetails(res?.data?.data || res?.data);
      setIsEditingInsurance(false);
      toast.success('Insurance updated successfully!');
    } catch (error) {
      console.error('Failed to update insurance', error);
      toast.error('Failed to update insurance');
    } finally {
      setIsUpdatingRecord(false);
    }
  };

  const handleAddImmunization = async (e) => {
    e.preventDefault();
    if (!newImmunization.name || !newImmunization.date || !selectedPatient) return;
    
    setIsUpdatingRecord(true);
    try {
      const updatedImms = [...(selectedPatientDetails?.immunizations || []), newImmunization];
      await api.updatePatient(selectedPatient.id, { immunizations: updatedImms });
      
      const res = await api.getPatient(selectedPatient.id);
      setSelectedPatientDetails(res?.data?.data || res?.data);
      
      setNewImmunization({ name: '', date: '', status: 'scheduled' });
      setIsAddingImm(false);
      toast.success('Immunization added successfully!');
    } catch (error) {
      console.error('Failed to add immunization', error);
      toast.error('Failed to add immunization');
    } finally {
      setIsUpdatingRecord(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id?.includes(searchQuery);
    
    const matchesGender = genderFilter === 'All' || patient.gender === genderFilter;
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(patient.status || 'Active');
    
    const matchesTab = 
      activePatientTab === 'all' || 
      (activePatientTab === 'admitted' && (patient.status === 'Active' || !patient.status)) ||
      (activePatientTab === 'outpatients' && patient.status === 'Inactive');

    return matchesSearch && matchesGender && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Users size={28} />
            </div>
            Patient Directory
          </h1>
          <p className="text-slate-500 font-medium">Manage patient records, demographics, and medical history</p>
        </div>
        <div className="flex gap-3 flex-wrap w-full md:w-auto">
          <button 
            onClick={() => toast.success('Export started')}
            className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 transition-all active:scale-95"
          >
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            Register Patient
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-12 gap-8">
           <div className="col-span-3 space-y-4"><SkeletonCard count={1} /></div>
           <div className="col-span-9 space-y-4"><SkeletonCard count={5} /></div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="grid grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-extrabold mb-5 text-slate-900 uppercase tracking-widest">Directory Filters</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Gender</label>
                  <div className="flex gap-2">
                    {['All', 'Male', 'Female'].map((g) => (
                      <button 
                        key={g} 
                        onClick={() => setGenderFilter(g)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                          g === genderFilter ? "bg-primary text-white border-primary shadow-sm" : "bg-slate-50 text-slate-500 border-transparent hover:bg-white hover:border-slate-200"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status</label>
                  <div className="space-y-3">
                    {['Active', 'Inactive'].map((status) => (
                      <label key={status} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary focus:ring-offset-0" 
                          checked={statusFilters.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters(prev => [...prev, status]);
                            } else {
                              setStatusFilters(prev => prev.filter(s => s !== status));
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-8">
            <div className="bg-white border border-slate-100 p-1.5 rounded-2xl inline-flex gap-1 shadow-sm">
              <button 
                onClick={() => setActivePatientTab('all')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activePatientTab === 'all' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                All Patients
              </button>
              <button 
                onClick={() => setActivePatientTab('admitted')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activePatientTab === 'admitted' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Admitted
              </button>
              <button 
                onClick={() => setActivePatientTab('outpatients')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activePatientTab === 'outpatients' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Outpatients
              </button>
            </div>

            <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-700" 
                    placeholder="Search by name, ID, phone, or email..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {filteredPatients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Patients Found"
                  description={searchQuery || Object.values(statusFilters).length > 0 
                    ? "No patients match your search criteria. Try adjusting the filters."
                    : "Start by registering your first patient"}
                  action={!searchQuery && Object.values(statusFilters).length === 0 ? () => setIsRegisterModalOpen(true) : undefined}
                  actionLabel="Register Patient"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Patient</th>
                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Age / Gender</th>
                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Blood Group</th>
                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                        <th className="px-6 py-4 border-b border-slate-100"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20 group-hover:scale-105 transition-transform">
                                {patient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                              </div>
                              <div>
                                <div className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">{patient.name || 'Unnamed'}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {patient.id?.substring(0,8) || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700">{patient.age || '--'} yrs</div>
                            <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">{patient.gender || '--'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {patient.bloodGroup ? (
                              <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg w-fit border border-red-100">
                                <Droplets size={12} />
                                {patient.bloodGroup}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-600">{patient.phone || '--'}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{patient.email || '--'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              patient.status === 'Active' || !patient.status ? "bg-emerald-50 text-emerald-600 border-emerald-200/50" : "bg-slate-50 text-slate-500 border-slate-200"
                            )}>
                              {patient.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedPatient(patient)}
                              className="text-slate-400 hover:text-primary p-2 hover:bg-primary/5 rounded-xl transition-all"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredPatients.length > 0 && (
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPatients.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(filteredPatients.length / itemsPerPage)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsRegisterModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {registrationSuccess ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Registration Successful</h3>
                    <p className="text-slate-500 mt-2 font-medium">Patient record has been committed to the secure database.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Register New Patient</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Enter clinical and demographic details</p>
                    </div>
                    <button 
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Full Name
                          {errors.name && <span className="text-red-500 normal-case tracking-normal font-medium">{errors.name}</span>}
                        </label>
                        <input 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            errors.name ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                          placeholder="e.g. John Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Email Address
                          {errors.email && <span className="text-red-500 normal-case tracking-normal font-medium">{errors.email}</span>}
                        </label>
                        <input 
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            errors.email ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                          placeholder="john@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Phone Number
                          {errors.phone && <span className="text-red-500 normal-case tracking-normal font-medium">{errors.phone}</span>}
                        </label>
                        <input 
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            errors.phone ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            Age
                            {errors.age && <span className="text-red-500 normal-case tracking-normal font-medium text-xs">{errors.age}</span>}
                          </label>
                          <input 
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                              errors.age ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            )}
                            placeholder="e.g. 45"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            Gender
                            {errors.gender && <span className="text-red-500 normal-case tracking-normal font-medium text-xs">{errors.gender}</span>}
                          </label>
                          <select 
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm appearance-none",
                              errors.gender ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            )}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Blood Group</label>
                        <select 
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                        >
                          <option value="">Select</option>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Address
                          {errors.address && <span className="text-red-500 normal-case tracking-normal font-medium text-xs">{errors.address}</span>}
                        </label>
                        <input 
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none shadow-sm",
                            errors.address ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                          placeholder="Residential address"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsRegisterModalOpen(false)} 
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
                            <UserPlus size={20} />
                            Register Patient
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

      {/* Slide-over panel for patient details */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-extrabold text-slate-900">Patient Profile</h3>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4 border-white shadow-lg">
                    {selectedPatient.name?.charAt(0) || 'P'}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{selectedPatient.name}</h2>
                  <p className="text-slate-500 font-bold font-mono text-xs mt-1">ID: {selectedPatient.id}</p>
                  <div className="mt-4 flex justify-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      selectedPatient.status === 'Active' || !selectedPatient.status ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                      {selectedPatient.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <Activity className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</p>
                    <p className="text-sm font-bold text-slate-700">{selectedPatient.age || '--'} yrs</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                    <p className="text-sm font-bold text-slate-700">{selectedPatient.gender || '--'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <Droplets className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood</p>
                    <p className="text-sm font-bold text-slate-700">{selectedPatient.bloodGroup || '--'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                    {selectedPatient.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100"><Mail size={16} /></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                          <p className="text-sm font-bold text-slate-700">{selectedPatient.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100"><Phone size={16} /></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                          <p className="text-sm font-bold text-slate-700">{selectedPatient.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.address && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100"><MapPin size={16} /></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Address</p>
                          <p className="text-sm font-bold text-slate-700">{selectedPatient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Insurance</h4>
                    <button 
                      onClick={() => setIsEditingInsurance(!isEditingInsurance)}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      {isEditingInsurance ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  
                  {isEditingInsurance ? (
                    <form onSubmit={handleUpdateInsurance} className="bg-indigo-50/50 p-4 rounded-2xl space-y-3 border border-indigo-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-900/60 uppercase">Provider</label>
                        <input type="text" value={insuranceData.provider} onChange={e => setInsuranceData({...insuranceData, provider: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-indigo-900" placeholder="Insurance Provider" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-900/60 uppercase">Policy Number</label>
                        <input type="text" value={insuranceData.policyNumber} onChange={e => setInsuranceData({...insuranceData, policyNumber: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-indigo-900" placeholder="Policy Number" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-900/60 uppercase">Status</label>
                        <select value={insuranceData.status} onChange={e => setInsuranceData({...insuranceData, status: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-indigo-900">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <button type="submit" disabled={isUpdatingRecord} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-70 mt-2">
                        {isUpdatingRecord ? 'Saving...' : 'Save Insurance'}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      {selectedPatientDetails?.insurance ? (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                            <ShieldCheck size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-wider mb-0.5">Provider</h5>
                                <p className="text-sm font-black text-indigo-900">{selectedPatientDetails.insurance.provider || 'N/A'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedPatientDetails.insurance.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {selectedPatientDetails.insurance.status || 'Active'}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-indigo-200/50">
                              <h5 className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-wider mb-0.5">Policy Number</h5>
                              <p className="text-xs font-bold text-indigo-900">{selectedPatientDetails.insurance.policyNumber || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <ShieldCheck className="w-8 h-8 text-indigo-200 mx-auto mb-2" />
                          <p className="text-xs text-indigo-900/60 font-medium">No insurance on file</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immunizations</h4>
                    <button 
                      onClick={() => setIsAddingImm(!isAddingImm)}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      {isAddingImm ? 'Cancel' : 'Add New'}
                    </button>
                  </div>
                  
                  {isAddingImm && (
                    <form onSubmit={handleAddImmunization} className="bg-teal-50/50 p-4 rounded-2xl space-y-3 border border-teal-100 mb-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-teal-900/60 uppercase">Vaccine Name</label>
                        <input type="text" value={newImmunization.name} onChange={e => setNewImmunization({...newImmunization, name: e.target.value})} required className="w-full bg-white border border-teal-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-teal-900" placeholder="e.g., COVID-19 Booster" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-teal-900/60 uppercase">Date</label>
                        <input type="date" value={newImmunization.date} onChange={e => setNewImmunization({...newImmunization, date: e.target.value})} required className="w-full bg-white border border-teal-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-teal-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-teal-900/60 uppercase">Status</label>
                        <select value={newImmunization.status} onChange={e => setNewImmunization({...newImmunization, status: e.target.value})} className="w-full bg-white border border-teal-200 rounded-lg p-2 text-sm focus:ring-primary/20 outline-none text-teal-900">
                          <option value="completed">Completed</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>
                      <button type="submit" disabled={isUpdatingRecord} className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-all disabled:opacity-70 mt-2">
                        {isUpdatingRecord ? 'Adding...' : 'Add Immunization'}
                      </button>
                    </form>
                  )}
                  
                  <div className="space-y-2">
                    {selectedPatientDetails?.immunizations && selectedPatientDetails.immunizations.length > 0 ? (
                      selectedPatientDetails.immunizations.map((imm, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${imm.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-900">{imm.name}</h5>
                              <p className="text-[10px] text-slate-500 font-medium">{new Date(imm.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            imm.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {imm.status}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <Syringe className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">No immunizations recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => {
                    toast.success('Edit functionality coming soon');
                  }}
                  className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Patients;