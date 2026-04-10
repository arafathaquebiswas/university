import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.username}!`);
      const map = { admin: '/admin', faculty: '/faculty', student: '/student', accounts_staff: '/accounts', library_staff: '/library' };
      navigate(map[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3c5e] to-[#2d6a9f] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">B</div>
          <h1 className="text-2xl font-bold text-gray-900">BRACU Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Smart University Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="your.email@g.bracu.ac.bd"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New student?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Demo Credentials:</p>
          <p>Admin: <span className="font-mono">admin@bracu.ac.bd / Admin@123</span></p>
          <p>Faculty: <span className="font-mono">ext.dr.hassan_cse@g.bracu.ac.bd / Fac@123</span></p>
          <p>Student: <span className="font-mono">ali.khan_20301001@g.bracu.ac.bd / Stu@123</span></p>
          <p>Accounts: <span className="font-mono">accounts.john@g.bracu.ac.bd / Acc@123</span></p>
        </div>
      </div>
    </div>
  );
}
