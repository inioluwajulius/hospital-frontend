import React, { useState, useEffect } from 'react';
import { Pill, Search, Filter, Package, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

const PatientPharmacy = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState([]);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await api.getDrugs?.() || Promise.resolve({ data: [] });
        setInventory(res?.data?.data || res?.data || []);
      } catch (error) {
        console.error('Error fetching drugs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrugs();
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(item.category);

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading pharmacy inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hospital Pharmacy</h1>
        <p className="text-slate-500 mt-1 font-medium">Check medication availability and prices.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Filters</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Category</label>
                <div className="space-y-3">
                  {['Tablet', 'Syrup', 'Injection', 'Ointment', 'Inhaler'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" 
                        checked={categoryFilters.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryFilters(prev => [...prev, cat]);
                          } else {
                            setCategoryFilters(prev => prev.filter(c => c !== cat));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Search medications..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medication</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInventory.length > 0 ? filteredInventory.slice(0, 10).map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700">{item.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          (item.status === 'Stable' || item.stock > 0) ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {(item.status === 'Stable' || item.stock > 0) ? 'Available' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-500 font-medium">
                        No medications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPharmacy;
