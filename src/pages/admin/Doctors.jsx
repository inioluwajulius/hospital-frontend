import React, { useState, useEffect } from 'react';
import { 
  Users,
  Search, 
  Plus, 
  Phone,
  Mail,
  Badge,
  Stethoscope,
  Award,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  MapPin,
  Star,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Cardiology',
    department: 'Cardiology',
    licenseNumber: '',
    experience: '',
    availability: 'Available'
  });

  const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency', 'Surgery', 'Pediatrics', 'Psychiatry'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.getDoctors?.();
        const responseData = res?.data;
        const data = responseData?.data || responseData || [];
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error(error.response?.data?.message || 'Failed to load medical staff directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      await api.createDoctor?.(formData);
      setSuccess(true);
      toast.success('Doctor profile created successfully!');

      const updatedRes = await api.getDoctors?.();
      const responseData = updatedRes?.data;
      const updatedDoctors = responseData?.data || responseData || [];
      setDoctors(Array.isArray(updatedDoctors) ? updatedDoctors : []);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          specialization: 'Cardiology',
          department: 'Cardiology',
          licenseNumber: '',
          experience: '',
          availability: 'Available'
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to create doctor profile:', error);
      toast.error('Failed to create doctor profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = 
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = departmentFilter === 'All' || doc.department === departmentFilter;
    
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medical Staff Directory</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Loading medical staff...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
        <div className="grid grid-cols-12 gap-8">
           <div className="col-span-3 space-y-4"><SkeletonCard count={1} /></div>
           <div className="col-span-9 space-y-4"><SkeletonCard count={4} /></div>
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
              <Users size={28} />
            </div>
            Medical Staff Directory
          </h1>
          <p className="text-slate-500 font-medium">Manage doctors, specialists, and medical professionals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add Doctor
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-emerald-100">
              <Stethoscope size={28} className="text-emerald-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{doctors.length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Doctors</p>
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
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{doctors.filter(d => d.availability === 'Available').length}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Available</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-blue-500"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-blue-100">
              <Badge size={28} className="text-blue-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{new Set(doctors.map(d => d.department)).size}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Departments</p>
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
              <Award size={28} className="text-amber-500" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{new Set(doctors.map(d => d.specialization)).size}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Specializations</p>
          </div>
        </motion.div>
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Profile Created</h3>
                    <p className="text-slate-500 mt-2 font-medium">Doctor profile has been added to the system.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Add Medical Staff</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Register new doctor or specialist</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Full Name</label>
                        <input 
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Dr. John Smith"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Email</label>
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="doctor@hospital.com"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Phone</label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">License Number</label>
                        <input 
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          placeholder="MD-12345"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Specialization</label>
                        <select 
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Department</label>
                        <select 
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Years of Experience</label>
                        <input 
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="10"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Availability</label>
                        <select 
                          name="availability"
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Part-time">Part-time</option>
                        </select>
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
                            <Users size={20} />
                            Add to Staff
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

      {/* Slide-over panel for doctor details */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
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
                <h3 className="text-xl font-extrabold text-slate-900">Doctor Profile</h3>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4 border-white shadow-lg">
                    {selectedDoctor.name?.charAt(0) || 'D'}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{selectedDoctor.name}</h2>
                  <p className="text-primary font-bold">{selectedDoctor.specialization}</p>
                  <div className="mt-4 flex justify-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      selectedDoctor.availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                      selectedDoctor.availability === 'On Leave' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                      'bg-blue-50 text-blue-600 border-blue-200/50'
                    )}>
                      {selectedDoctor.availability || 'Available'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Mail size={16} /></div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                        <p className="text-sm font-bold text-slate-700">{selectedDoctor.email}</p>
                      </div>
                    </div>
                    {selectedDoctor.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Phone size={16} /></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                          <p className="text-sm font-bold text-slate-700">{selectedDoctor.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Professional Details</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Department</p>
                        <p className="text-sm font-bold text-slate-700">{selectedDoctor.department}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Experience</p>
                        <p className="text-sm font-bold text-slate-700">{selectedDoctor.yearsOfExperience || selectedDoctor.experience || 0} years</p>
                      </div>
                    </div>
                    {selectedDoctor.licenseNumber && (
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">License Number</p>
                        <p className="text-sm font-bold text-slate-700">{selectedDoctor.licenseNumber}</p>
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-extrabold mb-5 text-slate-900 uppercase tracking-widest">Filter by Department</h3>
            <div className="space-y-2">
              {['All', ...departments].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-2xl transition-all font-bold text-sm border",
                    departmentFilter === dept 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-slate-50 text-slate-600 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 shadow-sm rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              placeholder="Search by name, specialization, or email..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredDoctors.length === 0 ? (
                <div className="col-span-full py-16 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4">
                    <Users size={40} />
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2">No Doctors Found</h4>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">
                    {doctors.length === 0 
                      ? "There are no doctors registered in the system yet." 
                      : "No doctors match your current filters and search query."}
                  </p>
                </div>
              ) : (
                filteredDoctors.slice(0, 12).map((doctor, idx) => (
                  <motion.div 
                    layout
                    key={doctor.id || doctor._id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-black group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                        {doctor.name?.charAt(0) || 'D'}
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        doctor.availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                        doctor.availability === 'On Leave' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                        'bg-blue-50 text-blue-600 border-blue-200/50'
                      )}>
                        {doctor.availability || 'Available'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 mb-1 text-xl line-clamp-1">{doctor.name}</h4>
                    <p className="text-xs text-primary font-bold mb-5 bg-primary/5 inline-block px-2.5 py-1 rounded-lg w-fit">{doctor.specialization || doctor.department}</p>

                    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl flex-1">
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                        <Badge size={16} className="text-slate-400" />
                        {doctor.department}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                        <Clock size={16} className="text-slate-400" />
                        {doctor.yearsOfExperience || doctor.experience || 0} years exp
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                        <Mail size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedDoctor(doctor)}
                      className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-extrabold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 active:scale-95 shadow-sm mt-auto"
                    >
                      View Profile
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;