import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusBadge = { pending: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red', waived: 'badge-gray' };

export default function FinancialManagement() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    const { data } = await api.get('/finance/all', { params: { status: filter, page, limit } });
    setRecords(data.records);
    setTotal(data.total);
  };
  useEffect(() => { load(); }, [filter, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
        <div className="flex gap-2">
          {['', 'pending', 'paid', 'overdue'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Student', 'Email', 'Type', 'Amount', 'Semester', 'Due Date', 'Status', 'Payment Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.recordId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.student?.user?.username}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.student?.user?.email}</td>
                  <td className="px-4 py-3 capitalize">{r.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium">BDT {Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{r.semester || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.dueDate || '—'}</td>
                  <td className="px-4 py-3"><span className={statusBadge[r.status]}>{r.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{r.paymentDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
          <span>{total} total records</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
