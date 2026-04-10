import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, BookOpenIcon, AcademicCapIcon, ClipboardDocumentListIcon, BuildingOfficeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setAnalytics(r.data)).catch(() => {});
    api.get('/announcements/global').then(r => setAnnouncements(r.data.slice(0, 3))).catch(() => {});
  }, []);

  const quickLinks = [
    { to: '/admin/users', label: 'Manage Users', icon: UsersIcon, color: 'blue' },
    { to: '/admin/departments', label: 'Departments', icon: BuildingOfficeIcon, color: 'green' },
    { to: '/admin/courses', label: 'Courses', icon: BookOpenIcon, color: 'purple' },
    { to: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon, color: 'yellow' },
    { to: '/admin/scholarships', label: 'Scholarships', icon: AcademicCapIcon, color: 'red' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Administrator Dashboard — BRACU Portal</p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard title="Total Students"     value={analytics.overview.totalStudents}     icon={AcademicCapIcon}            color="blue"   />
          <StatCard title="Faculty Members"    value={analytics.overview.totalFaculty}      icon={UsersIcon}                  color="green"  />
          <StatCard title="Active Courses"     value={analytics.overview.totalCourses}      icon={BookOpenIcon}               color="purple" />
          <StatCard title="Enrollments"        value={analytics.overview.activeEnrollments} icon={ClipboardDocumentListIcon}  color="yellow" />
          <StatCard title="Departments"        value={analytics.overview.totalDepartments}  icon={BuildingOfficeIcon}         color="red"    />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-xl transition-all duration-200 group">
                <Icon className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map(a => (
                <li key={a.announcementId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {analytics?.departments && analytics.departments.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Overview</h2>
          <div className="space-y-3">
            {analytics.departments.map(d => {
              const maxStudents = Math.max(...analytics.departments.map(x => x.studentCount), 1);
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-64 truncate" title={d.name}>{d.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((d.studentCount / maxStudents) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-24 text-right">
                    {d.programCount} prog · {d.studentCount} stu
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
