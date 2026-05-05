import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, BookOpenIcon, ClipboardDocumentCheckIcon, ChartBarIcon, BellIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [facultyId, setFacultyId] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      setFacultyId(fid);
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data)).catch(() => {});
    }).catch(() => {});
    api.get('/announcements/global').then(r => setAnnouncements(r.data.slice(0, 4))).catch(() => {});
  }, []);

  const totalStudents = courses.reduce((s, c) => s + (c.enrollments?.length || 0), 0);

  const quickActions = [
    { to: '/faculty/courses', label: 'My Courses', icon: BookOpenIcon },
    { to: '/faculty/quizzes', label: 'Quizzes', icon: AcademicCapIcon },
    { to: '/faculty/attendance', label: 'Mark Attendance', icon: ClipboardDocumentCheckIcon },
    { to: '/faculty/grades', label: 'Submit Grades', icon: ChartBarIcon },
    { to: '/faculty/announcements', label: 'Announcements', icon: BellIcon },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h1>
        <p className="text-gray-500 text-sm">Faculty Dashboard — Spring 2025</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={courses.length} icon={BookOpenIcon} color="blue" />
        <StatCard title="Students" value={totalStudents} icon={ChartBarIcon} color="green" />
        <StatCard title="Announcements" value={announcements.length} icon={BellIcon} color="yellow" />
        {/* <StatCard title="Pending Grades" value="—" icon={ClipboardDocumentCheckIcon} color="red" sub="Submit grades for completed courses" />  */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className="card flex flex-col items-center justify-center py-6 hover:shadow-md transition-shadow group text-center">
            <Icon className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">My Courses</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-400">No courses assigned</p>
          ) : (
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.courseCode} · {c.semester}</p>
                  </div>
                  <span className="badge-blue">{c.credits} cr</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Announcements</h2>
          {announcements.length === 0 ? <p className="text-sm text-gray-400">None yet</p> : (
            <ul className="space-y-3">
              {announcements.map(a => (
                <li key={a.announcementId} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
