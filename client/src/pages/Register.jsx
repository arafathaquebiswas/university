import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const getEmailHint = (email) => {
    if (/^ext\.[a-zA-Z.]+_(cse|eee|mic|bio)@g\.bracu\.ac\.bd$/i.test(email)) return { role: 'faculty', label: 'Faculty' };
    if (/^[a-zA-Z][a-zA-Z.]+_\d+@g\.bracu\.ac\.bd$/i.test(email)) return { role: 'student', label: 'Student' };
    if (/^accounts\.[a-zA-Z.]+@g\.bracu\.ac\.bd$/i.test(email)) return { role: 'accounts_staff', label: 'Accounts Staff' };
    if (/^library\.[a-zA-Z.]+@g\.bracu\.ac\.bd$/i.test(email)) return { role: 'library_staff', label: 'Library Staff' };
    return null;
  };

  const hint = getEmailHint(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register({ username: form.username, email: form.email, password: form.password });
      toast.success('Account created successfully!');
      const map = { faculty: '/faculty', student: '/student', accounts_staff: '/accounts', library_staff: '/library' };
      navigate(map[user.role] || '/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3c5e] to-[#2d6a9f] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">B</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Use your official BRACU email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" className="input-field" placeholder="e.g. ali_khan" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
            <input type="email" className="input-field" placeholder="ali.khan_20301001@g.bracu.ac.bd"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            {form.email && hint && (
              <p className="text-xs text-green-600 mt-1">✓ Detected role: <strong>{hint.label}</strong></p>
            )}
            {form.email && !hint && (
              <p className="text-xs text-red-500 mt-1">✗ Email format not recognized. Use official BRACU email.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input-field" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" className="input-field" placeholder="Repeat password"
              value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <button type="submit" disabled={loading || !hint} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Valid email formats:</p>
          <p>Student: <span className="font-mono">name_studentid@g.bracu.ac.bd</span></p>
          <p>Faculty: <span className="font-mono">ext.name_dept@g.bracu.ac.bd</span></p>
          <p>Accounts: <span className="font-mono">accounts.name@g.bracu.ac.bd</span></p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
