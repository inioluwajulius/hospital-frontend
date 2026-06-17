import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const HospitalsList = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      // Ensure we have a valid token before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const res = await api.get('/superadmin/hospitals');
      if (res.data?.success) {
        setHospitals(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Hospitals</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all tenant hospitals on the platform.</p>
        </div>
        <button
          onClick={() => navigate('/superadmin/hospitals/new')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Register New Hospital
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Domain/Slug</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Email</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading hospitals...</td>
                </tr>
              ) : hospitals.length > 0 ? (
                hospitals.map((hospital) => (
                  <tr key={hospital._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{hospital.name}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{hospital.customDomain || hospital.subdomain || hospital.slug}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{hospital.superAdmin?.email || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        hospital.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {hospital.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600 capitalize">{hospital.subscriptionTier}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-emerald-600 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No hospitals registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalsList;
