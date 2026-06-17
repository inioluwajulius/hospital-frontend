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
  Star
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Doctors = ({ showNotification } = {}) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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

  const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency', 'Surgery', 'Pediatrics', 'psychiatry'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDoctors?.();
        const responseData = res?.data;
        const data = responseData?.data || responseData || [];
        // Ensure it's an array
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
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
      if (showNotification) {
        showNotification('Doctor profile created successfully!', 'success');
      }

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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading medical staff...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medical Staff Directory</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage doctors, specialists, and medical professionals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Doctors</h3>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Stethoscope size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10">{doctors.length}</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available</h3>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10">{doctors.filter(d => d.availability === 'Available').length}</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Departments</h3>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Badge size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10">{new Set(doctors.map(d => d.department)).size}</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Specializations</h3>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Award size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10">{new Set(doctors.map(d => d.specialization)).size}</p>
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Profile Created</h3>
                    <p className="text-slate-500 mt-2">Doctor profile has been added to the system.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Add Medical Staff</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Register new doctor or specialist</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Full Name</label>
                        <input 
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Dr. John Smith"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email</label>
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="doctor@hospital.com"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Phone</label>
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">License Number</label>
                        <input 
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          placeholder="MD-12345"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Specialization</label>
                        <select 
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Department</label>
                        <select 
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Years of Experience</label>
                        <input 
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="10"
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Availability</label>
                        <select 
                          name="availability"
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white border"
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
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="grow py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black mb-5 text-slate-900 uppercase tracking-widest">Filter by Department</h3>
            <div className="space-y-2">
              {['All', ...departments].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-2xl transition-all font-bold text-sm border",
                    departmentFilter === dept 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none" 
              placeholder="Search by name, specialization..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredDoctors.slice(0, 12).map((doctor, idx) => (
                <motion.div 
                  layout
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 hover:border-primary/30 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-black group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                      {doctor.name?.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      doctor.availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                      doctor.availability === 'On Leave' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                      'bg-blue-50 text-blue-600 border-blue-200/50'
                    )}>
                      {doctor.availability}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 mb-1 text-xl">{doctor.name}</h4>
                  <p className="text-sm text-primary font-bold mb-5 bg-primary/5 inline-block px-2 py-1 rounded-lg">{doctor.specialization}</p>

                  <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                      <Badge size={16} className="text-slate-400" />
                      {doctor.department}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                      <Clock size={16} className="text-slate-400" />
                      {doctor.yearsOfExperience || 0} years experience
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium truncate">
                      <Mail size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                    {doctor.phone && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                        <Phone size={16} className="text-slate-400" />
                        {doctor.phone}
                      </div>
                    )}
                  </div>

                  <button className="w-full py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95 shadow-sm">
                    View Profile
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;