import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Globe, Save } from 'lucide-react';
import { api } from '../../services/api';

const CreateHospital = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    subscriptionTier: 'free',
    hospitalAdminName: '',
    hospitalAdminEmail: '',
    hospitalAdminPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name if slug is empty or currently matches the slugified name
      ...(name === 'name' && (!prev.slug || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
        ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
        : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/superadmin/hospitals', formData);
      if (res.data?.success) {
        navigate('/superadmin/hospitals');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/superadmin/hospitals')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-semibold text-sm"
      >
        <ArrowLeft size={16} /> Back to Hospitals
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register New Hospital</h1>
        <p className="text-slate-500 text-sm mt-1">Create a new tenant workspace and provision their initial admin account.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hospital Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-emerald-600" />
            <h3>Hospital Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hospital Name *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                placeholder="e.g. Apollo General Hospital"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">URL Slug *</label>
              <input 
                type="text" 
                name="slug"
                required
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                placeholder="apollo-general"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Subdomain (Optional)</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  placeholder="apollo"
                />
                <span className="px-4 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm font-medium">
                  .yourhospitalapp.com
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Subscription Tier</label>
              <select 
                name="subscriptionTier"
                value={formData.subscriptionTier}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="free">Free Starter</option>
                <option value="pro">Pro (Modular Features)</option>
                <option value="enterprise">Enterprise (Custom White-Label)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Initial Admin Account */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <User size={18} className="text-emerald-600" />
            <h3>Initial Hospital Admin Account</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Admin Full Name *</label>
              <input 
                type="text" 
                name="hospitalAdminName"
                required
                value={formData.hospitalAdminName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Admin Email *</label>
              <input 
                type="email" 
                name="hospitalAdminEmail"
                required
                value={formData.hospitalAdminEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                placeholder="admin@apollo.com"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-slate-700">Temporary Password *</label>
            <input 
              type="password" 
              name="hospitalAdminPassword"
              required
              value={formData.hospitalAdminPassword}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-1">Admin will be forced to change this upon first login.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save size={18} />
                Create Hospital & Admin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHospital;
