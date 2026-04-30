import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusBadge = { pending: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red', waived: 'badge-gray' };

export default function PaymentPortal() {
  const [data, setData] = useState({ records: [], summary: {} });
  const [scholarships, setScholarships] = useState([]);
  const [paying, setPaying] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = async () => {
    const [f, s] = await Promise.all([api.get('/finance/my'), api.get('/finance/scholarships')]);
    setData(f.data); setScholarships(s.data);
  };
  useEffect(() => { load(); }, []);

  const handleDummyPay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    try {
      const txRef = `DEMO-${Date.now()}`;
      await api.post('/finance/pay', { recordId: paying.recordId, transactionRef: txRef });
      toast.success('Payment successful!');
      setPaying(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
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
          { label: 'Overdue Items', value: data.summary.overdue || 0, color: 'text-orange-600' },
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
                    {(r.status === 'pending' || r.status === 'overdue') && (
                      <button onClick={() => setPaying(r)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Pay Now
                      </button>
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

      {/* Dummy Payment Modal */}
      {paying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Secure Payment</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Demo Mode</span>
            </div>

            {/* Amount */}
            <div className="bg-blue-50 rounded-xl p-4 mb-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{paying.description}</p>
              <p className="text-3xl font-bold text-blue-700">BDT {Number(paying.amount).toLocaleString()}</p>
            </div>

            {/* Fake card fields */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Card Number</label>
                <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed flex items-center justify-between">
                  <span>4242 4242 4242 4242</span>
                  <span className="text-blue-500 font-bold text-xs">VISA</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expiry</label>
                  <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">12 / 28</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                  <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">• • •</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cardholder Name</label>
                <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">DEMO USER</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleDummyPay} disabled={processing}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing…
                  </>
                ) : `Pay BDT ${Number(paying.amount).toLocaleString()}`}
              </button>
              <button onClick={() => setPaying(null)} disabled={processing}
                className="btn-secondary flex-1">Cancel</button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              This is a simulated payment — no real transaction occurs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
