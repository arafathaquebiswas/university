import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public Pages
import Home from './pages/Home/Home';
import Announcements from './pages/Announcements/Announcements';
import About from './pages/About/About';
import Academics from './pages/Academics/Academics';
import Admission from './pages/Admission/Admission';
import Research from './pages/Research/Research';
import StudentLife from './pages/StudentLife/StudentLife';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCourses from './pages/admin/ManageCourses';
import Analytics from './pages/admin/Analytics';
import ManageScholarships from './pages/admin/ManageScholarships';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyCourses from './pages/faculty/FacultyCourses';
import MarkAttendance from './pages/faculty/MarkAttendance';
import GradeManagement from './pages/faculty/GradeManagement';
import QuizManagement from './pages/faculty/QuizManagement';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseEnrollment from './pages/student/CourseEnrollment';
import MyGrades from './pages/student/MyGrades';
import QuizPortal from './pages/student/QuizPortal';
import MyAttendance from './pages/student/MyAttendance';
import PaymentPortal from './pages/student/PaymentPortal';
import Notifications from './pages/student/Notifications';
import WhatIfSimulator from './pages/student/WhatIfSimulator';
import CourseAnnouncements from './pages/student/CourseAnnouncements';

// Accounts Pages
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import FinancialManagement from './pages/accounts/FinancialManagement';
import GenerateInvoice from './pages/accounts/GenerateInvoice';
import AccountsScholarships from './pages/accounts/AccountsScholarships';

/**
 * Higher-order component to wrap protected routes with 
 * Role Guard and the Main Dashboard Layout
 */
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
          {/* ==========================================
              PUBLIC ROUTES (No Login Required)
              ========================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/research" element={<Research />} />
          <Route path="/student-life" element={<StudentLife/>} />
          <Route path="/announcements" element={<Announcements />} />

          {/* ==========================================
              AUTHENTICATION ROUTES
              ========================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ==========================================
              ADMIN ROUTES
              ========================================== */}
          <Route path="/admin" element={<Wrap roles={['admin']}><AdminDashboard /></Wrap>} />
          <Route path="/admin/users" element={<Wrap roles={['admin']}><ManageUsers /></Wrap>} />
          <Route path="/admin/departments" element={<Wrap roles={['admin']}><ManageDepartments /></Wrap>} />
          <Route path="/admin/courses" element={<Wrap roles={['admin']}><ManageCourses /></Wrap>} />
          <Route path="/admin/analytics" element={<Wrap roles={['admin']}><Analytics /></Wrap>} />
          <Route path="/admin/scholarships" element={<Wrap roles={['admin']}><ManageScholarships /></Wrap>} />
          <Route path="/admin/announcements" element={<Wrap roles={['admin']}><ManageAnnouncements /></Wrap>} />

          {/* ==========================================
              FACULTY ROUTES
              ========================================== */}
          <Route path="/faculty" element={<Wrap roles={['faculty']}><FacultyDashboard /></Wrap>} />
          <Route path="/faculty/courses" element={<Wrap roles={['faculty']}><FacultyCourses /></Wrap>} />
          <Route path="/faculty/quizzes" element={<Wrap roles={['faculty']}><QuizManagement /></Wrap>} />
          <Route path="/faculty/attendance" element={<Wrap roles={['faculty']}><MarkAttendance /></Wrap>} />
          <Route path="/faculty/grades" element={<Wrap roles={['faculty']}><GradeManagement /></Wrap>} />
          <Route path="/faculty/announcements" element={<Wrap roles={['faculty']}><FacultyAnnouncements /></Wrap>} />

          {/* ==========================================
              STUDENT ROUTES
              ========================================== */}
          <Route path="/student" element={<Wrap roles={['student']}><StudentDashboard /></Wrap>} />
          <Route path="/student/enroll" element={<Wrap roles={['student']}><CourseEnrollment /></Wrap>} />
          <Route path="/student/grades" element={<Wrap roles={['student']}><MyGrades /></Wrap>} />
          <Route path="/student/quizzes" element={<Wrap roles={['student']}><QuizPortal /></Wrap>} />
          <Route path="/student/whatif" element={<Wrap roles={['student']}><WhatIfSimulator /></Wrap>} />
          <Route path="/student/attendance" element={<Wrap roles={['student']}><MyAttendance /></Wrap>} />
          <Route path="/student/payments" element={<Wrap roles={['student']}><PaymentPortal /></Wrap>} />
          <Route path="/student/notifications" element={<Wrap roles={['student']}><Notifications /></Wrap>} />
          <Route path="/student/announcements" element={<Wrap roles={['student']}><CourseAnnouncements /></Wrap>} />

          {/* ==========================================
              ACCOUNTS ROUTES
              ========================================== */}
          <Route path="/accounts" element={<Wrap roles={['accounts_staff']}><AccountsDashboard /></Wrap>} />
          <Route path="/accounts/finance" element={<Wrap roles={['accounts_staff']}><FinancialManagement /></Wrap>} />
          <Route path="/accounts/invoices" element={<Wrap roles={['accounts_staff']}><GenerateInvoice /></Wrap>} />
          <Route path="/accounts/scholarships" element={<Wrap roles={['accounts_staff']}><AccountsScholarships /></Wrap>} />

          {/* ==========================================
              UTILITY ROUTES
              ========================================== */}
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen text-xl text-red-600">403 — Unauthorized Access</div>} />
          
          {/* Catch-all: Redirect unknown paths to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Logic to redirect users to their specific dashboard based on stored role
 */
const RoleRedirect = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) return <Navigate to="/login" replace />;
  
  try {
    const { role } = JSON.parse(user);
    const map = { 
      admin: '/admin', 
      faculty: '/faculty', 
      student: '/student', 
      accounts_staff: '/accounts', 
      library_staff: '/library' 
    };
    return <Navigate to={map[role] || '/login'} replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};