import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageDepartments() {
  const [depts, setDepts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showProgModal, setShowProgModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', head: '' });
  const [progForm, setProgForm] = useState({ name: '', duration: 4, deptId: '' });

  const load = async () => {
    const [d, p] = await Promise.all([api.get('/admin/departments'), api.get('/admin/programs')]);
    setDepts(d.data); setPrograms(p.data);
  };
  useEffect(() => { load(); }, []);

  const createDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', deptForm);
      toast.success('Department created');
      setShowDeptModal(false); setDeptForm({ name: '', head: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const createProg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/programs', progForm);
      toast.success('Program created');
      setShowProgModal(false); setProgForm({ name: '', duration: 4, deptId: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteDept = async (id) => {
    if (!confirm('Delete this department?')) return;
    try { await api.delete(`/admin/departments/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Departments & Programs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Departments ({depts.length})</h2>
            <button onClick={() => setShowDeptModal(true)} className="btn-primary text-sm py-1.5 px-3">+ Add</button>
          </div>
          <div className="space-y-3">
            {depts.map(d => (
              <div key={d.deptId} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-500">Head: {d.head || 'N/A'} · {d.programs?.length || 0} programs</p>
                </div>
                <button onClick={() => deleteDept(d.deptId)} className="text-xs text-red-500 hover:text-red-700 ml-2">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Programs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Programs ({programs.length})</h2>
            <button onClick={() => setShowProgModal(true)} className="btn-primary text-sm py-1.5 px-3">+ Add</button>
          </div>
          <div className="space-y-3">
            {programs.map(p => (
              <div key={p.progId} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.department?.name} · {p.duration} years</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Add Department</h2>
            <form onSubmit={createDept} className="space-y-3">
              <input className="input-field" placeholder="Department name" value={deptForm.name} onChange={e => setDeptForm(p => ({...p, name: e.target.value}))} required />
              <input className="input-field" placeholder="Department head (optional)" value={deptForm.head} onChange={e => setDeptForm(p => ({...p, head: e.target.value}))} />
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Create</button><button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showProgModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Add Program</h2>
            <form onSubmit={createProg} className="space-y-3">
              <input className="input-field" placeholder="Program name" value={progForm.name} onChange={e => setProgForm(p => ({...p, name: e.target.value}))} required />
              <input type="number" className="input-field" placeholder="Duration (years)" value={progForm.duration} onChange={e => setProgForm(p => ({...p, duration: e.target.value}))} required />
              <select className="input-field" value={progForm.deptId} onChange={e => setProgForm(p => ({...p, deptId: e.target.value}))} required>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.name}</option>)}
              </select>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Create</button><button type="button" onClick={() => setShowProgModal(false)} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
