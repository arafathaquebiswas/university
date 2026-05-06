import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusBadge = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  overdue: 'badge-red',
  waived: 'badge-gray',
};

export default function FinancialManagement() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('');
  const [page, setPage] = useState(1);

  const limit = 20;

  const load = async () => {
    try {
      const { data } = await api.get('/finance/all', {
        params: { status: filter, semester, page, limit },
      });

      let rows = data.records || [];

      if (search.trim()) {
        const q = search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.student?.user?.username?.toLowerCase().includes(q) ||
            r.student?.user?.email?.toLowerCase().includes(q) ||
            String(r.studentId || '').includes(q)
        );
      }

      setRecords(rows);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load records');
    }
  };

  useEffect(() => {
    load();
  }, [filter, semester, page]);

  const markAsPaid = async (recordId) => {
    const transactionRef = window.prompt(
      'Enter transaction reference',
      'MANUAL-ACCOUNTS'
    );

    if (transactionRef === null) return;

    try {
      await api.put(`/finance/records/${recordId}/mark-paid`, {
        transactionRef,
      });

      toast.success('Marked as paid');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const generateReceipt = (r) => {
    const doc = new jsPDF();

    const receiptNo = `RCPT-${r.recordId}`;
    const issueDate = new Date().toISOString().slice(0, 10);
    const paymentDate = r.paymentDate
      ? String(r.paymentDate).slice(0, 10)
      : issueDate;

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('BRACU Portal', 20, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Accounts Office', 20, 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('MONEY RECEIPT', 135, 22);

    doc.setTextColor(0, 0, 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${receiptNo}`, 135, 50);
    doc.text(`Issue Date: ${issueDate}`, 135, 57);
    doc.text(`Payment Date: ${paymentDate}`, 135, 64);
    doc.text(`Transaction Ref: ${r.transactionRef || 'N/A'}`, 135, 71);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Received From', 20, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Student: ${r.student?.user?.username || 'N/A'}`, 20, 60);
    doc.text(`Email: ${r.student?.user?.email || 'N/A'}`, 20, 67);
    doc.text(`Student ID: ${r.studentId || 'N/A'}`, 20, 74);
    doc.text(`Semester: ${r.semester || 'N/A'}`, 20, 81);

    doc.setFillColor(243, 244, 246);
    doc.rect(20, 100, 170, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, 108);
    doc.text('Type', 115, 108);
    doc.text('Amount', 160, 108);

    doc.setFont('helvetica', 'normal');
    doc.text(r.description || r.type || 'Payment', 25, 124);
    doc.text(String(r.type || '').replace('_', ' '), 115, 124);
    doc.text(`BDT ${Number(r.amount || 0).toLocaleString()}`, 160, 124);

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 134, 190, 134);

    doc.setFillColor(220, 252, 231);
    doc.rect(20, 150, 65, 18, 'F');

    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('STATUS: PAID', 30, 162);

    doc.setTextColor(0, 0, 0);

    doc.setFillColor(239, 246, 255);
    doc.rect(125, 148, 65, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Amount Paid', 132, 159);

    doc.setFontSize(16);
    doc.text(`BDT ${Number(r.amount || 0).toLocaleString()}`, 132, 170);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Payment Note:', 20, 205);
    doc.text(
      'This receipt confirms that the above payment has been received and recorded.',
      20,
      213
    );

    doc.line(20, 245, 80, 245);
    doc.line(130, 245, 190, 245);

    doc.setFontSize(9);
    doc.text('Accounts Officer', 32, 253);
    doc.text('Authorized Signature', 142, 253);

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 270, 190, 270);

    doc.setTextColor(100, 100, 100);
    doc.text('This money receipt was generated electronically by BRACU Portal.', 20, 278);
    doc.text('Thank you for your payment.', 20, 284);

    doc.save(`money-receipt-${r.recordId}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>

        <div className="flex gap-2">
          {['', 'pending', 'paid', 'overdue'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input-field"
            placeholder="Search student, email, or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="input-field"
            placeholder="Semester e.g. Spring 2026"
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setPage(1);
            }}
          />

          <button type="button" onClick={load} className="btn-primary">
            Search
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  'Student',
                  'Email',
                  'Type',
                  'Amount',
                  'Semester',
                  'Due Date',
                  'Status',
                  'Payment Date',
                  'Actions',
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.recordId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {r.student?.user?.username || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.student?.user?.email || '—'}
                  </td>

                  <td className="px-4 py-3 capitalize">
                    {String(r.type || '').replace('_', ' ')}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    BDT {Number(r.amount || 0).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {r.semester || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {r.dueDate ? String(r.dueDate).slice(0, 10) : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <span className={statusBadge[r.status] || 'badge-gray'}>
                      {r.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {r.paymentDate ? String(r.paymentDate).slice(0, 10) : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => markAsPaid(r.recordId)}
                          className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      )}

                      {r.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => generateReceipt(r)}
                          className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        >
                          Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No financial records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
          <span>{total} total records</span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="px-3 py-1">Page {page}</span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}