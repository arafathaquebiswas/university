import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusBadge = { pending: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red', waived: 'badge-gray' };

export default function PaymentPortal() {
  const [data, setData] = useState({ records: [], summary: {} });
  const [scholarships, setScholarships] = useState([]);
  const [paying, setPaying] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [applying, setApplying] = useState(false);

  const load = async () => {
    const [f, s] = await Promise.all([api.get('/finance/my'), api.get('/finance/scholarships')]);
    setData(f.data); setScholarships(s.data);
  };
  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (!txRef.trim()) { toast.error('Enter transaction reference'); return; }
    try {
      await api.post('/finance/pay', { recordId: paying.recordId, transactionRef: txRef });
      toast.success('Payment recorded!');
      setPaying(null); setTxRef(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const applyScholarship = async (scholarshipId) => {
    setApplying(true);
    try {
      await api.post('/finance/scholarship/apply', { scholarshipId });
      toast.success('Scholarship applied!');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setApplying(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment Portal</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Due', value: `BDT ${Number(data.summary.totalDue || 0).toLocaleString()}`, color: 'text-red-600' },
          { label: 'Total Paid', value: `BDT ${Number(data.summary.totalPaid || 0).toLocaleString()}`, color: 'text-green-600' },
          { label: 'Overdue', value: data.summary.overdue || 0, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Financial Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Description', 'Type', 'Amount', 'Semester', 'Due Date', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.records.map(r => (
                <tr key={r.recordId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.description || r.type}</td>
                  <td className="px-4 py-3 capitalize">{r.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium">BDT {Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{r.semester || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.dueDate || '—'}</td>
                  <td className="px-4 py-3"><span className={statusBadge[r.status]}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <button onClick={() => setPaying(r)} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Pay Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scholarships */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Available Scholarships</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scholarships.map(s => (
            <div key={s.scholarshipId} className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.criteria}</p>
                  {s.minGPA && <p className="text-xs text-yellow-700 mt-1">Min GPA required: {s.minGPA}</p>}
                </div>
                <p className="font-bold text-green-600 text-sm ml-2 flex-shrink-0">BDT {Number(s.amount).toLocaleString()}</p>
              </div>
              <button onClick={() => applyScholarship(s.scholarshipId)} disabled={applying}
                className="mt-3 text-xs px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Modal */}
      {paying && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Confirm Payment</h2>
            <p className="text-sm text-gray-600 mb-1">{paying.description}</p>
            <p className="text-xl font-bold text-blue-600 mb-4">BDT {Number(paying.amount).toLocaleString()}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
            <input className="input-field mb-4" placeholder="e.g. TXN123456789" value={txRef} onChange={e => setTxRef(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={handlePay} className="btn-primary flex-1">Confirm</button>
              <button onClick={() => { setPaying(null); setTxRef(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
