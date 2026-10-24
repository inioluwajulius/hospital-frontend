import React, { useEffect, useMemo, useState } from 'react';
import { Pill, Plus, PackageCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import { PageHeader, PrimaryButton, SecondaryButton, SearchInput, Panel, Modal, Field, TextInput, Select, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { listOf, patientName, errorText, formatDate } from './staffUtils';

const LOW_STOCK = 10;
const EMPTY_DRUG = { name: '', category: '', manufacturer: '', price: '', stock: '', expiryDate: '' };

const PharmacyDesk = () => {
  const { formatAmount } = useCurrency();
  const [tab, setTab] = useState('prescriptions');
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockEdits, setStockEdits] = useState({});

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDrug, setNewDrug] = useState(EMPTY_DRUG);
  const [dispenseFor, setDispenseFor] = useState(null);
  const [dispense, setDispense] = useState({ drugId: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [drugRes, presRes] = await Promise.all([api.getDrugs(), api.getPrescriptions()]);
      setDrugs(listOf(drugRes));
      setPrescriptions(listOf(presRes));
    } catch (error) {
      toast.error(errorText(error, 'Could not load pharmacy data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const q = search.trim().toLowerCase();
  const visibleDrugs = useMemo(
    () => drugs.filter((d) => !q || [d.name, d.category, d.manufacturer].some((v) => String(v || '').toLowerCase().includes(q))),
    [drugs, q]
  );
  const pendingPrescriptions = useMemo(
    () => prescriptions
      .filter((p) => p.status !== 'dispensed')
      .filter((p) => !q || [patientName(p.patientId), p.doctorId?.name, ...(p.medications || []).map((m) => m.name)].some((v) => String(v || '').toLowerCase().includes(q))),
    [prescriptions, q]
  );

  const handleAddDrug = async (e) => {
    e.preventDefault();
    if (!newDrug.name.trim() || newDrug.price === '') {
      toast.error('Name and price are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.createDrug({
        ...newDrug,
        price: Number(newDrug.price),
        stock: Number(newDrug.stock || 0),
        expiryDate: newDrug.expiryDate || undefined,
      });
      toast.success('Drug added to inventory');
      setIsAddOpen(false);
      setNewDrug(EMPTY_DRUG);
      setDrugs(listOf(await api.getDrugs()));
    } catch (error) {
      toast.error(errorText(error, 'Could not add drug'));
    } finally {
      setSubmitting(false);
    }
  };

  const saveStock = async (drug) => {
    const stock = Number(stockEdits[drug._id]);
    try {
      const res = await api.updateDrugStock(drug._id, stock);
      setDrugs((prev) => prev.map((d) => (d._id === drug._id ? res.data.drug : d)));
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[drug._id];
        return next;
      });
      toast.success(`${drug.name} stock updated`);
    } catch (error) {
      toast.error(errorText(error, 'Could not update stock'));
    }
  };

  const openDispense = (prescription) => {
    // Pre-select the inventory item matching the first prescribed medication, if any
    const firstMed = prescription.medications?.[0]?.name?.toLowerCase();
    const match = drugs.find((d) => firstMed && d.name.toLowerCase().includes(firstMed));
    setDispense({ drugId: match?._id || '', quantity: 1 });
    setDispenseFor(prescription);
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!dispense.drugId) {
      toast.error('Choose the drug to dispense');
      return;
    }
    try {
      setSubmitting(true);
      await api.dispenseDrug({
        patientId: dispenseFor.patientId?._id,
        prescriptionId: dispenseFor._id,
        drugId: dispense.drugId,
        quantity: Number(dispense.quantity),
      });
      toast.success('Dispensed');
      setDispenseFor(null);
      loadData();
    } catch (error) {
      toast.error(errorText(error, 'Could not dispense'));
    } finally {
      setSubmitting(false);
    }
  };

  const setDrugField = (e) => setNewDrug((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const selectedDrug = drugs.find((d) => d._id === dispense.drugId);

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={Pill}
        title="Pharmacy"
        description="Dispense prescriptions and manage your hospital's drug inventory."
        action={tab === 'inventory' && (
          <PrimaryButton onClick={() => setIsAddOpen(true)}><Plus size={18} /> Add Drug</PrimaryButton>
        )}
      />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder={tab === 'inventory' ? 'Search drugs...' : 'Search by patient, doctor or medication...'} />
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 self-start">
            {[['prescriptions', `To dispense (${pendingPrescriptions.length})`], ['inventory', 'Inventory']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingBlock text="Loading pharmacy..." />
        ) : tab === 'prescriptions' ? (
          pendingPrescriptions.length === 0 ? (
            <EmptyRow>No prescriptions waiting to be dispensed.</EmptyRow>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingPrescriptions.map((p) => (
                <div key={p._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{patientName(p.patientId)}</p>
                    <ul className="text-sm text-slate-600 mt-1 space-y-0.5">
                      {(p.medications || []).map((m, i) => (
                        <li key={i}>{m.name} — {[m.dosage, m.frequency, m.duration].filter(Boolean).join(', ')}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-400 mt-1">Prescribed {formatDate(p.createdAt)} by {p.doctorId?.name || 'unknown doctor'}</p>
                  </div>
                  <PrimaryButton onClick={() => openDispense(p)} className="px-4 py-2.5 rounded-xl"><PackageCheck size={16} /> Dispense</PrimaryButton>
                </div>
              ))}
            </div>
          )
        ) : visibleDrugs.length === 0 ? (
          <EmptyRow>No drugs in inventory yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visibleDrugs.map((d) => {
              const editing = stockEdits[d._id] !== undefined;
              const expired = d.expiryDate && new Date(d.expiryDate) < new Date();
              return (
                <div key={d._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      {d.name}
                      {d.stock === 0 ? <StatusBadge tone="red">Out of stock</StatusBadge> : d.stock < LOW_STOCK && <StatusBadge tone="amber">Low stock</StatusBadge>}
                      {expired && <StatusBadge tone="red">Expired</StatusBadge>}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {[d.category, d.manufacturer].filter(Boolean).join(' · ') || 'Uncategorised'} · {formatAmount(d.price)} · expires {formatDate(d.expiryDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="number"
                      min="0"
                      aria-label={`Stock for ${d.name}`}
                      className="w-24"
                      value={editing ? stockEdits[d._id] : d.stock}
                      onChange={(e) => setStockEdits((prev) => ({ ...prev, [d._id]: e.target.value }))}
                    />
                    {editing && (
                      <SecondaryButton onClick={() => saveStock(d)}><Save size={16} /> Save</SecondaryButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Modal open={isAddOpen} title="Add drug" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleAddDrug} className="space-y-4">
          <Field label="Name"><TextInput name="name" value={newDrug.name} onChange={setDrugField} required /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category"><TextInput name="category" value={newDrug.category} onChange={setDrugField} /></Field>
            <Field label="Manufacturer"><TextInput name="manufacturer" value={newDrug.manufacturer} onChange={setDrugField} /></Field>
            <Field label="Unit price"><TextInput name="price" type="number" min="0" step="0.01" value={newDrug.price} onChange={setDrugField} required /></Field>
            <Field label="Opening stock"><TextInput name="stock" type="number" min="0" value={newDrug.stock} onChange={setDrugField} /></Field>
          </div>
          <Field label="Expiry date"><TextInput name="expiryDate" type="date" value={newDrug.expiryDate} onChange={setDrugField} /></Field>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setIsAddOpen(false)} submitting={submitting} label="Add drug" />
          </div>
        </form>
      </Modal>

      <Modal open={!!dispenseFor} title="Dispense prescription" onClose={() => setDispenseFor(null)}>
        <form onSubmit={handleDispense} className="space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 text-sm">
            <p className="font-bold text-slate-900 mb-1">{patientName(dispenseFor?.patientId)}</p>
            {(dispenseFor?.medications || []).map((m, i) => (
              <p key={i} className="text-slate-600">{m.name} — {[m.dosage, m.frequency, m.duration].filter(Boolean).join(', ')}</p>
            ))}
          </div>
          <Field label="Drug from inventory">
            <Select value={dispense.drugId} onChange={(e) => setDispense((prev) => ({ ...prev, drugId: e.target.value }))} placeholder="Select drug"
              options={drugs.filter((d) => d.stock > 0).map((d) => ({ value: d._id, label: `${d.name} (${d.stock} in stock)` }))} />
          </Field>
          <Field label="Quantity">
            <TextInput type="number" min="1" max={selectedDrug?.stock} value={dispense.quantity}
              onChange={(e) => setDispense((prev) => ({ ...prev, quantity: e.target.value }))} />
          </Field>
          <p className="text-xs text-slate-500">Dispensing reduces stock and marks this prescription as dispensed.</p>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setDispenseFor(null)} submitting={submitting} label="Dispense" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PharmacyDesk;
