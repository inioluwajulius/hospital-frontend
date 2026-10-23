import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import { PageHeader, PrimaryButton, SecondaryButton, SearchInput, Panel, Modal, Field, TextInput, Select, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { listOf, patientName, errorText, formatDate } from './staffUtils';

const STATUS_TONES = { unpaid: 'amber', paid: 'green', cancelled: 'slate' };
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Card' },
  { value: 'transfer', label: 'Bank transfer' },
];
const emptyItem = () => ({ description: '', amount: '' });

const BillingDesk = () => {
  const { formatAmount } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('unpaid');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [payFor, setPayFor] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setInvoices(listOf(await api.getInvoices()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load invoices'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    api.getPatients().then((res) => setPatients(listOf(res))).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((i) => tab === 'all' || i.status === tab)
      .filter((i) => !q || [patientName(i.patientId), i.patientId?.patientCardNumber, ...(i.items || []).map((it) => it.description)].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [invoices, tab, search]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status === 'unpaid').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0),
    [invoices]
  );

  const itemsTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const updateItem = (index, field, value) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const openCreate = () => {
    setPatientId('');
    setItems([emptyItem()]);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanItems = items.filter((it) => it.description.trim() || it.amount !== '');
    if (!patientId || cleanItems.length === 0) {
      toast.error('Choose a patient and add at least one item');
      return;
    }
    if (cleanItems.some((it) => !it.description.trim() || !(Number(it.amount) >= 0) || it.amount === '')) {
      toast.error('Each item needs a description and an amount');
      return;
    }
    try {
      setSubmitting(true);
      await api.createInvoice({ patientId, items: cleanItems.map((it) => ({ description: it.description.trim(), amount: Number(it.amount) })) });
      toast.success('Invoice created');
      setIsCreateOpen(false);
      loadInvoices();
    } catch (error) {
      toast.error(errorText(error, 'Could not create invoice'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.payInvoice(payFor._id, { paymentMethod });
      setInvoices((prev) => prev.map((i) => (i._id === payFor._id ? { ...i, status: 'paid', paymentMethod } : i)));
      toast.success('Payment recorded');
      setPayFor(null);
    } catch (error) {
      toast.error(errorText(error, 'Could not record payment'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={CreditCard}
        title="Billing"
        description={`Outstanding: ${formatAmount(outstanding)}`}
        action={<PrimaryButton onClick={openCreate}><Plus size={18} /> New Invoice</PrimaryButton>}
      />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by patient, card number or item..." />
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 self-start">
            {['unpaid', 'paid', 'all'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <LoadingBlock text="Loading invoices..." />
        ) : visible.length === 0 ? (
          <EmptyRow>No invoices to show.</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map((inv) => (
              <div key={inv._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{patientName(inv.patientId)} <span className="text-xs text-slate-400 font-medium">{inv.patientId?.patientCardNumber}</span></p>
                  <p className="text-xs text-slate-500 font-medium">
                    {(inv.items || []).map((it) => it.description).filter(Boolean).join(', ') || 'No items'} · issued {formatDate(inv.createdAt)}
                  </p>
                </div>
                <div className="text-lg font-extrabold text-slate-900">{formatAmount(inv.totalAmount)}</div>
                <StatusBadge tone={STATUS_TONES[inv.status] || 'slate'}>{inv.status}</StatusBadge>
                {inv.status === 'unpaid' && (
                  <SecondaryButton onClick={() => { setPaymentMethod('cash'); setPayFor(inv); }}><CheckCircle2 size={16} /> Mark paid</SecondaryButton>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={isCreateOpen} title="New invoice" onClose={() => setIsCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Patient">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Select patient"
              options={patients.map((p) => ({ value: p._id, label: `${patientName(p)} (${p.patientCardNumber})` }))} />
          </Field>
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Items</span>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <TextInput placeholder="Description" value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                <TextInput placeholder="Amount" type="number" min="0" step="0.01" className="w-32" value={it.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="p-3 text-slate-400 hover:text-red-500" aria-label="Remove item">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])} className="text-sm font-bold text-primary">+ Add item</button>
          </div>
          <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-4">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <span className="text-xl font-extrabold text-slate-900">{formatAmount(itemsTotal)}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setIsCreateOpen(false)} submitting={submitting} label="Create invoice" />
          </div>
        </form>
      </Modal>

      <Modal open={!!payFor} title="Record payment" onClose={() => setPayFor(null)}>
        <form onSubmit={handlePay} className="space-y-4">
          <p className="text-sm text-slate-600">
            {patientName(payFor?.patientId)} — <span className="font-extrabold text-slate-900">{formatAmount(payFor?.totalAmount)}</span>
          </p>
          <Field label="Payment method">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={PAYMENT_METHODS} />
          </Field>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setPayFor(null)} submitting={submitting} label="Mark as paid" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingDesk;
