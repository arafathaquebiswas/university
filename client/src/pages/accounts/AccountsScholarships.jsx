import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AccountsScholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/finance/scholarships').then(r => setScholarships(r.data)).catch(() => {});
    api.get('/finance/all', { params: { limit: 50 } }).then(r => {
      setRecords(r.data.records.filter(r => r.type === 'scholarship'));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Scholarship Management</h1>

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

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Scholarship Disbursements ({records.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Student', 'Scholarship', 'Amount', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.recordId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.student?.user?.username}</td>
                  <td className="px-4 py-3 text-gray-600">{r.scholarship?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-green-600">BDT {Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{r.paymentDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
