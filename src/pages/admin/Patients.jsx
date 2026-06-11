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
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePatientTab, setActivePatientTab] = useState('all');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilters, setStatusFilters] = useState(['Active']);
  
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
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
    setSubmitError('');
    
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
      
      const updatedPatients = await api.getPatients();
      setPatients(updatedPatients?.data || updatedPatients);

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
      setSubmitError('Failed to register patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await api.getPatients();
        setPatients(data?.data || data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id?.includes(searchQuery);
    
    const matchesGender = genderFilter === 'All' || patient.gender === genderFilter;
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(patient.status);
    
    const matchesTab = 
      activePatientTab === 'all' || 
      (activePatientTab === 'admitted' && patient.status === 'Active') ||
      (activePatientTab === 'outpatients' && patient.status === 'Inactive');

    return matchesSearch && matchesGender && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-8">{/* This changed from max-w-7xl mx-auto to full width capable */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage patient records, demographics, and medical history</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-100 hover:bg-slate-200 text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Download size={18} />
            Export
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <UserPlus size={18} />
            Register Patient
          </motion.button>
        </div>
      </div>

      {/* Loading State */}
      {loading && <SkeletonCard count={5} />}

      {/* Empty State */}
      {!loading && filteredPatients.length === 0 && (
        <EmptyState
          icon={Users}
          title="No Patients Found"
          description={searchQuery || Object.values(statusFilters).length > 0 
            ? "No patients match your search criteria. Try adjusting the filters."
            : "Start by registering your first patient"}
          action={!searchQuery && Object.values(statusFilters).length === 0 ? () => setIsRegisterModalOpen(true) : undefined}
          actionLabel="Register Patient"
        />
      )}

      {/* Patient List */}
      {!loading && filteredPatients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4"
        >
          {filteredPatients.map((patient, idx) => (
            <motion.div
              key={patient.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {patient.name || 'Unnamed Patient'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">ID: {patient.id}</p>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-slate-600 truncate">{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-slate-600">{patient.phone}</span>
                  </div>
                )}
                {patient.age && (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity size={16} className="text-slate-400" />
                    <span className="text-slate-600">{patient.age} years</span>
                  </div>
                )}
                {patient.bloodGroup && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets size={16} className="text-red-400" />
                    <span className="text-slate-600 font-semibold">{patient.bloodGroup}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    patient.status === 'Active' 
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {patient.status || 'Active'}
                  </span>
                </div>
                <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  View Profile
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              {registrationSuccess ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Registration Successful</h3>
                    <p className="text-slate-500 mt-2">Patient record has been committed to the secure database.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Register New Patient</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Enter clinical and demographic details</p>
                    </div>
                    <button 
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                            errors.name ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
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
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                            errors.email ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
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
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                            errors.phone ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
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
                              "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                              errors.age ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
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
                              "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                              errors.gender ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
                            )}
                          >
                            <option value="">Select Gender</option>
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
                          className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white"
                        >
                          <option value="">Select Blood Group</option>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Address</label>
                        <input 
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none",
                            errors.address ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Directory Filters</h3>
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
                        g === genderFilter ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status</label>
                <div className="space-y-3">
                  {['Active', 'Inactive'].map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" 
                        checked={statusFilters.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilters(prev => [...prev, status]);
                          } else {
                            setStatusFilters(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
            <button 
              onClick={() => setActivePatientTab('all')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activePatientTab === 'all' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              All Patients
            </button>
            <button 
              onClick={() => setActivePatientTab('admitted')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activePatientTab === 'admitted' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Admitted
            </button>
            <button 
              onClick={() => setActivePatientTab('outpatients')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activePatientTab === 'outpatients' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Outpatients
            </button>
          </div>

          <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Search by name, ID, phone, or email..." 
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
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age / Gender</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Group</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatients.slice(0, 10).map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
                            {patient.name?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{patient.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">ID: {patient.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700">{patient.age} yrs</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{patient.gender}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                          <Droplets size={10} />
                          {patient.bloodGroup}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-600">{patient.phone}</div>
                        <div className="text-xs text-slate-400">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          patient.status === 'Active' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-300 hover:text-primary transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Patients;