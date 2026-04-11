import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, BookOpenIcon, ClipboardDocumentListIcon, ChartBarIcon,
  CreditCardIcon, BellIcon, UsersIcon, AcademicCapIcon, BuildingOfficeIcon,
  ClipboardDocumentCheckIcon, ArrowRightOnRectangleIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline';

const navConfig = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: HomeIcon },
    { to: '/admin/users', label: 'Manage Users', icon: UsersIcon },
    { to: '/admin/departments', label: 'Departments', icon: BuildingOfficeIcon },
    { to: '/admin/courses', label: 'Courses', icon: BookOpenIcon },
    { to: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { to: '/admin/scholarships', label: 'Scholarships', icon: AcademicCapIcon },
    { to: '/admin/announcements', label: 'Announcements', icon: BellIcon },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard', icon: HomeIcon },
    { to: '/faculty/courses', label: 'My Courses', icon: BookOpenIcon },
    { to: '/faculty/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
    { to: '/faculty/grades', label: 'Grades', icon: ChartBarIcon },
    { to: '/faculty/announcements', label: 'Announcements', icon: BellIcon },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: HomeIcon },
    { to: '/student/enroll', label: 'Enrollment', icon: ClipboardDocumentListIcon },
    { to: '/student/grades', label: 'My Grades', icon: ChartBarIcon },
    { to: '/student/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
    { to: '/student/payments', label: 'Payments', icon: CreditCardIcon },
    { to: '/student/notifications', label: 'Notifications', icon: BellIcon },
  ],
  accounts_staff: [
    { to: '/accounts', label: 'Dashboard', icon: HomeIcon },
    { to: '/accounts/finance', label: 'Financial Records', icon: CreditCardIcon },
    { to: '/accounts/invoices', label: 'Generate Invoice', icon: ClipboardDocumentListIcon },
    { to: '/accounts/scholarships', label: 'Scholarships', icon: AcademicCapIcon },
  ],
  library_staff: [
    { to: '/library', label: 'Dashboard', icon: HomeIcon },
  ],
};

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleLabel = {
    admin: 'Administrator', faculty: 'Faculty Member',
    student: 'Student', accounts_staff: 'Accounts Staff', library_staff: 'Library Staff',
  };

  return (
    <aside className="w-64 min-h-screen bg-[#1a3c5e] text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center font-bold text-lg">
            B
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">BRACU Portal</p>
            <p className="text-xs text-blue-300">{roleLabel[user?.role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-blue-700'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-blue-700 space-y-2">
        <div className="text-xs text-blue-300 truncate">{user?.email}</div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
        >
          <GlobeAltIcon className="w-4 h-4" />
          Visit Website
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
