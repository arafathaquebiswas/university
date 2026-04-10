import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageScholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', criteria: '', amount: '', minGPA: '' });

  const load = () => api.get('/finance/scholarships').then(r => setScholarships(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/scholarships', form);
      toast.success('Scholarship created');
      setShowModal(false); setForm({ name: '', criteria: '', amount: '', minGPA: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Scholarships</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Scholarship</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {scholarships.map(s => (
          <div key={s.scholarshipId} className="card border-l-4 border-l-yellow-400">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-800">{s.name}</h3>
              <span className={s.isActive ? 'badge-green' : 'badge-gray'}>{s.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{s.criteria}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="font-bold text-green-600">BDT {Number(s.amount).toLocaleString()}</span>
              {s.minGPA && <span className="text-gray-500">Min GPA: {s.minGPA}</span>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Create Scholarship</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
              <textarea className="input-field" rows={2} placeholder="Eligibility criteria" value={form.criteria} onChange={e => setForm(p=>({...p,criteria:e.target.value}))} />
              <input type="number" className="input-field" placeholder="Amount (BDT)" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} required />
              <input type="number" step="0.01" className="input-field" placeholder="Minimum GPA (optional)" value={form.minGPA} onChange={e => setForm(p=>({...p,minGPA:e.target.value}))} />
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Create</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
