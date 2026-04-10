import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { UsersIcon, BookOpenIcon, AcademicCapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-20 text-gray-400">Loading analytics…</div>;

  const { overview, departments } = data;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={overview.totalStudents} icon={AcademicCapIcon} color="blue" />
        <StatCard title="Faculty" value={overview.totalFaculty} icon={UsersIcon} color="green" />
        <StatCard title="Active Courses" value={overview.totalCourses} icon={BookOpenIcon} color="purple" />
        <StatCard title="Enrollments" value={overview.activeEnrollments} icon={ClipboardDocumentListIcon} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Students by Department</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={departments} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="studentCount" fill="#3b82f6" radius={[4,4,0,0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={departments} dataKey="studentCount" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                {departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Student/Faculty Ratio', value: overview.totalFaculty ? (overview.totalStudents / overview.totalFaculty).toFixed(1) + ':1' : 'N/A', color: 'text-blue-600' },
          { label: 'Avg Enrollment/Course', value: overview.totalCourses ? (overview.activeEnrollments / overview.totalCourses).toFixed(1) : 'N/A', color: 'text-green-600' },
          { label: 'Total Departments', value: departments.length, color: 'text-purple-600' },
          { label: 'Courses per Faculty', value: overview.totalFaculty ? (overview.totalCourses / overview.totalFaculty).toFixed(1) : 'N/A', color: 'text-yellow-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
