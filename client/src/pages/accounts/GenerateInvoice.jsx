import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function GenerateInvoice() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: '', amount: '', type: 'tuition', semester: 'Spring 2026', dueDate: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { role: 'student', limit: 100 } }).then(r => setStudents(r.data.users)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/finance/invoices', form);
      toast.success('Invoice generated and student notified!');
      setForm({ studentId: '', amount: '', type: 'tuition', semester: 'Spring 2025', dueDate: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Generate Invoice</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select className="input-field" value={form.studentId} onChange={e => setForm(p=>({...p,studentId:e.target.value}))} required>
              <option value="">Select student</option>
              {students.map(s => <option key={s.userId} value={s.studentProfile?.studentId}>{s.username} — {s.email}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className="input-field" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                {['tuition', 'library_fee', 'lab_fee', 'fine'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT) *</label>
              <input type="number" className="input-field" placeholder="85000" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input className="input-field" placeholder="Spring 2025" value={form.semester} onChange={e => setForm(p=>({...p,semester:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input className="input-field" placeholder="e.g. Spring 2025 tuition fee" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Generating…' : 'Generate Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
