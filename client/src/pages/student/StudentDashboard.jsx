import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ClipboardDocumentListIcon, ChartBarIcon, ClipboardDocumentCheckIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadMaterial = async (materialId, originalName) => {
    try {
      setDownloadingId(materialId);
      const response = await api.get(`/materials/download/${materialId}`, {
        responseType: 'blob',
      });

      const downloadName = originalName || 'material';
      const blob = new Blob([response.data], {
        type: response.data.type || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    api.get('/auth/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/enrollments/my').then(r => setEnrollments(r.data)).catch(() => {});
    api.get('/notifications/my').then(r => setNotifications(r.data.notifications?.slice(0, 4) || [])).catch(() => {});
    api.get('/finance/my').then(r => setFinancials(r.data)).catch(() => {});
    api.get('/materials/my').then(r => setMaterials(r.data)).catch(() => {});
  }, []);

  const activeCourses = enrollments.filter(e => e.status === 'active').length;
  const pendingDue = financials?.summary?.totalDue || 0;

  const quickLinks = [
    { to: '/student/enroll', label: 'Enrollment', icon: ClipboardDocumentListIcon, color: 'blue' },
    { to: '/student/grades', label: 'My Grades', icon: ChartBarIcon, color: 'green' },
    { to: '/student/quizzes', label: 'Quizzes', icon: AcademicCapIcon, color: 'purple' },
    { to: '/student/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon, color: 'yellow' },
    { to: '/student/payments', label: 'Payments', icon: CreditCardIcon, color: 'red' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h1>
          <p className="text-sm text-gray-500">{profile?.studentProfile?.studentCode} · {profile?.studentProfile?.major?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current CGPA</p>
          <p className="text-3xl font-bold text-blue-600">{profile?.studentProfile?.currentGPA || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Courses" value={activeCourses} icon={ClipboardDocumentListIcon} color="blue" />
        <StatCard title="Total Enrolled" value={enrollments.length} icon={ChartBarIcon} color="green" />
        <StatCard title="Pending Fees" value={`BDT ${Number(pendingDue).toLocaleString()}`} icon={CreditCardIcon} color="red" />
        <StatCard title="Notifications" value={notifications.filter(n => n.status === 'unread').length} icon={ClipboardDocumentCheckIcon} color="yellow" sub="unread" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="card flex flex-col items-center justify-center py-6 hover:shadow-md transition-shadow group text-center">
            <Icon className="w-10 h-10 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Current Courses</h2>
          {enrollments.filter(e => e.status === 'active').length === 0 ? (
            <p className="text-sm text-gray-400">No active enrollments. <Link to="/student/enroll" className="text-blue-600 hover:underline">Enroll now</Link></p>
          ) : (
            <div className="space-y-3">
              {enrollments.filter(e => e.status === 'active').map(e => (
                <div key={e.enrollId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.course?.title}</p>
                    <p className="text-xs text-gray-500">{e.course?.courseCode} · Faculty: {e.course?.faculty?.user?.username || 'N/A'}</p>
                  </div>
                  <span className={`text-sm font-medium ${parseFloat(e.attendancePercentage) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {e.attendancePercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map(n => (
                <li key={n.notificationId} className={`flex items-start gap-3 p-3 rounded-lg ${n.status === 'unread' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.timestamp).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Course Materials</h2>
          {materials.length === 0 ? (
            <p className="text-sm text-gray-400">No materials available</p>
          ) : (
            <div className="space-y-3">
              {materials.slice(0, 5).map(m => (
                <div key={m.materialId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {enrollments.find(e => e.courseId === m.courseId)?.course?.title || `Course ${m.courseId}`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadMaterial(m.materialId, m.originalName)}
                    disabled={downloadingId === m.materialId}
                    className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {downloadingId === m.materialId ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              ))}
              {materials.length > 5 && (
                <p className="text-xs text-gray-500 text-center">And {materials.length - 5} more...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
