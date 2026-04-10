import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'faculty', 'student', 'accounts_staff', 'library_staff'];
const roleBadge = { admin: 'badge-red', faculty: 'badge-blue', student: 'badge-green', accounts_staff: 'badge-yellow', library_staff: 'badge-gray' };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'student' });

  const fetchUsers = async (role = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { role, limit: 50 } });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(filter); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      toast.success('User created!');
      setShowCreate(false);
      setForm({ username: '', email: '', password: '', role: 'student' });
      fetchUsers(filter);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.userId}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers(filter);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-sm text-gray-500">{users.length} users found</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">+ New User</button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...ROLES].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${filter === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Username', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : users.map(u => (
                <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={roleBadge[u.role]}>{u.role.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs font-medium px-2 py-1 rounded ${u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['username','Username','text'],['email','Email','email'],['password','Password','password']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t} className="input-field" value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} required />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
