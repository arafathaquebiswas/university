import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCardIcon, ClipboardDocumentListIcon, AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function AccountsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0, overdue: 0 });

  useEffect(() => {
    api.get('/finance/all', { params: { limit: 200 } }).then(r => {
      const records = r.data.records;
      setStats({
        total: r.data.total,
        pending: records.filter(r => r.status === 'pending').length,
        paid: records.filter(r => r.status === 'paid').length,
        overdue: records.filter(r => r.status === 'overdue').length,
      });
    }).catch(() => {});
  }, []);

  const links = [
    { to: '/accounts/finance', label: 'Financial Records', icon: ChartBarIcon },
    { to: '/accounts/invoices', label: 'Generate Invoice', icon: ClipboardDocumentListIcon },
    { to: '/accounts/scholarships', label: 'Scholarships', icon: AcademicCapIcon },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={stats.total} icon={CreditCardIcon} color="blue" />
        <StatCard title="Pending" value={stats.pending} icon={ClipboardDocumentListIcon} color="yellow" />
        <StatCard title="Paid" value={stats.paid} icon={ChartBarIcon} color="green" />
        <StatCard title="Overdue" value={stats.overdue} icon={AcademicCapIcon} color="red" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="card flex flex-col items-center py-8 hover:shadow-md transition-shadow group text-center">
            <Icon className="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
