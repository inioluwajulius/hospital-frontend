import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  FlaskConical, 
  Search,
  Activity,
  Calendar,
  Microscope,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LabResults = () => {
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchLabResults();
  }, []);

  const fetchLabResults = async () => {
    try {
      setLoading(true);
      const response = await api.getLabTests();
      if (response.data?.success) {
        setLabResults(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = labResults.filter(test => 
    test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.testCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'in_progress': return <Activity size={16} className="text-blue-500" />;
      case 'ordered': return <Clock size={16} className="text-slate-400" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ordered': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FlaskConical className="text-indigo-600" size={28} />
            Laboratory Results
          </h1>
          <p className="text-slate-500 font-medium mt-1">View your lab tests and diagnostic results</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((test) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={test._id}
                onClick={() => setSelectedResult(test)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedResult?._id === test._id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-500/20' 
                    : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      selectedResult?._id === test._id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      <Microscope size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{test.testName}</h3>
                      <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{test.testCategory}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar size={14} />
                    {new Date(test.collectionDate || test.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>
                    {getStatusIcon(test.status)}
                    {test.status.replace('_', ' ')}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <FlaskConical size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Results Found</h3>
              <p className="text-slate-500 text-sm mt-1">There are no lab results matching your search.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedResult ? (
              <motion.div
                key={selectedResult._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border mb-4 ${getStatusColor(selectedResult.status)}`}>
                        {getStatusIcon(selectedResult.status)}
                        {selectedResult.status.replace('_', ' ')}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedResult.testName}</h2>
                      <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          Ordered: {new Date(selectedResult.createdAt).toLocaleDateString()}
                        </div>
                        {selectedResult.collectionDate && (
                          <div className="flex items-center gap-2">
                            <Activity size={16} />
                            Collected: {new Date(selectedResult.collectionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {selectedResult.status === 'completed' && selectedResult.results && selectedResult.results.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={20} className="text-indigo-600" />
                        Test Parameters
                      </h3>
                      
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-4">Parameter</th>
                              <th className="p-4">Result</th>
                              <th className="p-4">Reference Range</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedResult.results.map((item, idx) => (
                              <tr key={idx} className={item.status === 'abnormal' || item.status === 'critical' ? 'bg-rose-50/30' : ''}>
                                <td className="p-4 font-bold text-slate-800">{item.parameter}</td>
                                <td className="p-4">
                                  <span className={`font-black ${
                                    item.status === 'abnormal' ? 'text-amber-600' :
                                    item.status === 'critical' ? 'text-rose-600' :
                                    'text-slate-700'
                                  }`}>
                                    {item.value} {item.unit}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500 font-medium">{item.referenceRange}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    item.status === 'abnormal' ? 'bg-amber-100 text-amber-700' :
                                    item.status === 'critical' ? 'bg-rose-100 text-rose-700' :
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {selectedResult.notes && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-6">
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <AlertCircle size={14} />
                            Notes
                          </h4>
                          <p className="text-sm text-amber-900/80 font-medium leading-relaxed">
                            {selectedResult.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Clock size={24} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Results Pending</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                        This test is currently {selectedResult.status.replace('_', ' ')}. The results will appear here once the laboratory has completed the analysis.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                <Microscope size={64} className="text-slate-300 mb-6" />
                <h3 className="text-xl font-bold text-slate-900">Select a Lab Report</h3>
                <p className="text-slate-500 font-medium mt-2">Choose a test from the list to view its details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LabResults;
