import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCourses from './pages/admin/ManageCourses';
import Analytics from './pages/admin/Analytics';
import ManageScholarships from './pages/admin/ManageScholarships';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyCourses from './pages/faculty/FacultyCourses';
import MarkAttendance from './pages/faculty/MarkAttendance';
import GradeManagement from './pages/faculty/GradeManagement';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';

import StudentDashboard from './pages/student/StudentDashboard';
import CourseEnrollment from './pages/student/CourseEnrollment';
import MyGrades from './pages/student/MyGrades';
import MyAttendance from './pages/student/MyAttendance';
import PaymentPortal from './pages/student/PaymentPortal';
import Notifications from './pages/student/Notifications';

import AccountsDashboard from './pages/accounts/AccountsDashboard';
import FinancialManagement from './pages/accounts/FinancialManagement';
import GenerateInvoice from './pages/accounts/GenerateInvoice';
import AccountsScholarships from './pages/accounts/AccountsScholarships';

const Wrap = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route path="/admin" element={<Wrap roles={['admin']}><AdminDashboard /></Wrap>} />
          <Route path="/admin/users" element={<Wrap roles={['admin']}><ManageUsers /></Wrap>} />
          <Route path="/admin/departments" element={<Wrap roles={['admin']}><ManageDepartments /></Wrap>} />
          <Route path="/admin/courses" element={<Wrap roles={['admin']}><ManageCourses /></Wrap>} />
          <Route path="/admin/analytics" element={<Wrap roles={['admin']}><Analytics /></Wrap>} />
          <Route path="/admin/scholarships" element={<Wrap roles={['admin']}><ManageScholarships /></Wrap>} />

          {/* Faculty */}
          <Route path="/faculty" element={<Wrap roles={['faculty']}><FacultyDashboard /></Wrap>} />
          <Route path="/faculty/courses" element={<Wrap roles={['faculty']}><FacultyCourses /></Wrap>} />
          <Route path="/faculty/attendance" element={<Wrap roles={['faculty']}><MarkAttendance /></Wrap>} />
          <Route path="/faculty/grades" element={<Wrap roles={['faculty']}><GradeManagement /></Wrap>} />
          <Route path="/faculty/announcements" element={<Wrap roles={['faculty']}><FacultyAnnouncements /></Wrap>} />

          {/* Student */}
          <Route path="/student" element={<Wrap roles={['student']}><StudentDashboard /></Wrap>} />
          <Route path="/student/enroll" element={<Wrap roles={['student']}><CourseEnrollment /></Wrap>} />
          <Route path="/student/grades" element={<Wrap roles={['student']}><MyGrades /></Wrap>} />
          <Route path="/student/attendance" element={<Wrap roles={['student']}><MyAttendance /></Wrap>} />
          <Route path="/student/payments" element={<Wrap roles={['student']}><PaymentPortal /></Wrap>} />
          <Route path="/student/notifications" element={<Wrap roles={['student']}><Notifications /></Wrap>} />

          {/* Accounts */}
          <Route path="/accounts" element={<Wrap roles={['accounts_staff']}><AccountsDashboard /></Wrap>} />
          <Route path="/accounts/finance" element={<Wrap roles={['accounts_staff']}><FinancialManagement /></Wrap>} />
          <Route path="/accounts/invoices" element={<Wrap roles={['accounts_staff']}><GenerateInvoice /></Wrap>} />
          <Route path="/accounts/scholarships" element={<Wrap roles={['accounts_staff']}><AccountsScholarships /></Wrap>} />

          <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen text-xl text-red-600">403 — Unauthorized</div>} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const RoleRedirect = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (!token || !user) return <Navigate to="/login" replace />;
  const { role } = JSON.parse(user);
  const map = { admin: '/admin', faculty: '/faculty', student: '/student', accounts_staff: '/accounts', library_staff: '/library' };
  return <Navigate to={map[role] || '/login'} replace />;
};
