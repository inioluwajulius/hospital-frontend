import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, FileText, Download, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { useCurrency } from '../../contexts/CurrencyContext';

const PatientBilling = ({ showNotification } = {}) => {
  const { formatAmount } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.getInvoices?.() || Promise.resolve({ data: [] });
        setInvoices(res?.data?.data || res?.data || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    if (showNotification) {
      showNotification('Online payments coming soon. Please visit the billing counter for now.', 'info');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    if (showNotification) {
      showNotification('Invoice download will be available soon.', 'info');
    }
  };

  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'pending').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-bold">Loading your bills...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Invoices & Billing</h1>
          <p className="text-slate-500 mt-1 font-medium">View and pay your hospital bills.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Due</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{formatAmount(pendingAmount)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{formatAmount(totalPaid)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoices</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{invoices.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-slate-900">Recent Bills</h3>
        <div className="divide-y divide-slate-50">
          {invoices.length > 0 ? invoices.map((invoice) => (
            <div key={invoice._id || invoice.id} className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{invoice.description || 'Medical Consultation'}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1">
                  <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                  {invoice.dueDate && <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="flex flex-row items-center justify-between sm:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0">
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-slate-900">{formatAmount(invoice.amount)}</p>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    (invoice.status === 'Paid' || invoice.status === 'paid') ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {invoice.status || 'Pending'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {(invoice.status === 'Pending' || invoice.status === 'pending') && (
                    <button 
                      onClick={() => handlePayment(invoice)}
                      className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} /> Pay Now
                    </button>
                  )}
                  <button 
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="px-4 py-2 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Receipt
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-10 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl">
              No invoices found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBilling;