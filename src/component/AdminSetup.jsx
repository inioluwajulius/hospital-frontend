import { useState } from 'react';
import { Mail, Lock, Loader2, ShieldCheck, ChevronRight, User, Phone, Key } from 'lucide-react';

export const AdminSetup = ({ onRegister, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    adminKey: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.adminKey) {
      setError('Please fill in all required fields including the Admin Security Key');
      return;
    }

    // Mock validation for admin key
    if (formData.adminKey !== 'HOSPITAL-ADMIN-2024') {
      setError('Invalid Admin Security Key. Please contact system owner.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onRegister(formData);
    } catch (err) {
      setError(err.message || 'Admin setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl shadow-xl shadow-teal-600/20 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Hospital Admin</h1>
          <p className="text-slate-400 font-medium mt-2">System Administrator Configuration</p>
        </div>

        <div className="bg-white rounded-4xl shadow-2xl overflow-hidden border border-white/10">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Admin Setup</h2>
              <p className="text-sm text-slate-500 mt-1">Configure your administrative credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white focus:border-teal-600/10"
                      placeholder="Admin Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white focus:border-teal-600/10"
                      placeholder="admin@hospital.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Security Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      name="adminKey"
                      value={formData.adminKey}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white focus:border-teal-600/10"
                      placeholder="Enter system security key"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1 italic">Required for initial system bootstrapping</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white focus:border-teal-600/10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white focus:border-teal-600/10"
                      placeholder="Admin password"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="grow py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Initialize Admin Account
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            &copy; 2024 Hospital Admin Panel. Restricted Access.
          </p>
        </div>
      </div>
    </div>
  );
};
