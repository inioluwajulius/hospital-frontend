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
    
    // New fields
    hospitalType: 'General',
    taxId: '',
    registrationNumber: '',
    maxUsers: 50,
    
    contact: { phone: '', email: '', website: '' },
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    branding: { primaryColor: '#10b981', secondaryColor: '#0891b2' },
    settings: { currency: 'USD', timeZone: 'UTC' },
    features: {
      appointments: true,
      billing: true,
      pharmacy: true,
      radiology: true,
      laboratory: true,
      medicalRecords: true,
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button 
        onClick={() => navigate('/superadmin/hospitals')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-semibold text-sm"
      >
        <ArrowLeft size={16} /> Back to Hospitals
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register New Hospital</h1>
        <p className="text-slate-500 text-sm mt-1">Provision a new tenant workspace and configure their modules.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-emerald-600" />
            <h3>Core Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hospital Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. Apollo General Hospital" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hospital Type</label>
              <select name="hospitalType" value={formData.hospitalType} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="General">General Hospital</option>
                <option value="Specialized Clinic">Specialized Clinic</option>
                <option value="Dental">Dental Clinic</option>
                <option value="Maternity">Maternity</option>
                <option value="Eye Center">Eye Center</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Registration Number (Optional)</label>
              <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. REG-12345" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tax ID (Optional)</label>
              <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. TAX-98765" />
            </div>
          </div>
        </div>

        {/* Technical Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <Globe size={18} className="text-emerald-600" />
            <h3>Technical Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">URL Slug *</label>
              <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="apollo-general" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Subdomain (Optional)</label>
              <div className="flex items-center">
                <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="apollo" />
                <span className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm font-medium">.yourhospitalapp.com</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Subscription Tier</label>
              <select name="subscriptionTier" value={formData.subscriptionTier} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="free">Free Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Max Users Limit</label>
              <input type="number" name="maxUsers" value={formData.maxUsers} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <h3 className="text-emerald-600">Contact & Location</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Phone</label>
              <input type="text" name="contact.phone" value={formData.contact.phone} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Support Email</label>
              <input type="email" name="contact.email" value={formData.contact.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Website</label>
              <input type="url" name="contact.website" value={formData.contact.website} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Street Address</label>
              <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">City</label>
              <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">State / Province</label>
              <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Country</label>
              <input type="text" name="address.country" value={formData.address.country} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Modules & Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <h3 className="text-emerald-600">Modules & Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Enabled Features</h4>
              <div className="space-y-2">
                {Object.keys(formData.features).map((feature) => (
                  <label key={feature} className="flex items-center gap-2 text-sm text-slate-600 capitalize cursor-pointer">
                    <input 
                      type="checkbox" 
                      name={`features.${feature}`} 
                      checked={formData.features[feature]} 
                      onChange={handleChange}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {feature.replace(/([A-Z])/g, ' $1')} Module
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Base Currency</label>
                <select name="settings.currency" value={formData.settings.currency} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="branding.primaryColor" value={formData.branding.primaryColor} onChange={handleChange} className="h-10 w-10 rounded border border-slate-200 p-1" />
                    <span className="text-xs text-slate-500 uppercase">{formData.branding.primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="branding.secondaryColor" value={formData.branding.secondaryColor} onChange={handleChange} className="h-10 w-10 rounded border border-slate-200 p-1" />
                    <span className="text-xs text-slate-500 uppercase">{formData.branding.secondaryColor}</span>
                  </div>
                </div>
              </div>
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
              <input type="text" name="hospitalAdminName" required value={formData.hospitalAdminName} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Admin Email *</label>
              <input type="email" name="hospitalAdminEmail" required value={formData.hospitalAdminEmail} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="admin@apollo.com" />
            </div>
            <div className="space-y-1.5 md:col-span-2 max-w-md">
              <label className="text-sm font-semibold text-slate-700">Temporary Password *</label>
              <input type="password" name="hospitalAdminPassword" required value={formData.hospitalAdminPassword} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="••••••••" />
              <p className="text-xs text-slate-500 mt-1">Admin will be forced to change this upon first login.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
            {loading ? 'Provisioning Workspace...' : <><Save size={18} /> Provision Hospital</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHospital;
