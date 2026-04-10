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

  // Merge-delete state: null | { fromId, fromName, programCount }
  const [mergeState, setMergeState] = useState(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [merging, setMerging] = useState(false);

  const load = async () => {
    const [d, p] = await Promise.all([api.get('/admin/departments'), api.get('/admin/programs')]);
    setDepts(d.data);
    setPrograms(p.data);
  };
  useEffect(() => { load(); }, []);

  const createDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', deptForm);
      toast.success('Department created');
      setShowDeptModal(false);
      setDeptForm({ name: '', head: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const createProg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/programs', progForm);
      toast.success('Program created');
      setShowProgModal(false);
      setProgForm({ name: '', duration: 4, deptId: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // ── Delete department ───────────────────────────────────────────────────────
  const handleDeleteClick = (dept) => {
    const count = dept.programs?.length || 0;

    if (count > 0) {
      // Has programs → show merge modal immediately (no API call needed)
      setMergeState({ fromId: dept.deptId, fromName: dept.name, programCount: count });
      setMergeTarget('');
    } else {
      // Empty department → simple confirm
      if (!confirm(`"${dept.name}" has no programs. Delete it permanently?`)) return;
      deleteDeptDirect(dept.deptId, dept.name);
    }
  };

  const deleteDeptDirect = async (id, name) => {
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted');
      load();
    } catch (err) {
      const data = err.response?.data;
      // Stale data edge-case: server says it has programs after all
      if (data?.programsExist) {
        setMergeState({ fromId: id, fromName: name, programCount: data.programCount });
        setMergeTarget('');
        load();
      } else {
        toast.error(data?.error || 'Failed to delete');
      }
    }
  };

  // ── Merge & delete ──────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (!mergeTarget) return toast.error('Please select a target department');
    setMerging(true);
    try {
      await api.post('/admin/departments/merge', {
        fromId: mergeState.fromId,
        toId: mergeTarget,
      });
      toast.success(`Programs moved and "${mergeState.fromName}" deleted`);
      setMergeState(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const otherDepts = depts.filter(d => d.deptId !== mergeState?.fromId);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Departments & Programs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Departments panel ─────────────────────────────────────────────── */}
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
                  <p className="text-xs text-gray-500">
                    Head: {d.head || 'N/A'} ·{' '}
                    <span className={(d.programs?.length || 0) > 0 ? 'text-amber-600 font-medium' : ''}>
                      {d.programs?.length || 0} programs
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteClick(d)}
                  className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
            {depts.length === 0 && <p className="text-sm text-gray-400">No departments yet</p>}
          </div>
        </div>

        {/* ── Programs panel ────────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Programs ({programs.length})</h2>
            <button onClick={() => setShowProgModal(true)} className="btn-primary text-sm py-1.5 px-3">+ Add</button>
          </div>
          <div className="space-y-3">
            {programs.map(p => (
              <div key={p.progId} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.department?.name} · {p.duration} {p.duration === 1 ? 'year' : 'years'}
                </p>
              </div>
            ))}
            {programs.length === 0 && <p className="text-sm text-gray-400">No programs yet</p>}
          </div>
        </div>
      </div>

      {/* ── Add Department Modal ────────────────────────────────────────────── */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Add Department</h2>
            <form onSubmit={createDept} className="space-y-3">
              <input
                className="input-field"
                placeholder="Department name"
                value={deptForm.name}
                onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                className="input-field"
                placeholder="Department head (optional)"
                value={deptForm.head}
                onChange={e => setDeptForm(p => ({ ...p, head: e.target.value }))}
              />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Program Modal ───────────────────────────────────────────────── */}
      {showProgModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Add Program</h2>
            <form onSubmit={createProg} className="space-y-3">
              <input
                className="input-field"
                placeholder="Program name"
                value={progForm.name}
                onChange={e => setProgForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                type="number"
                min="1"
                max="10"
                className="input-field"
                placeholder="Duration (years)"
                value={progForm.duration}
                onChange={e => setProgForm(p => ({ ...p, duration: e.target.value }))}
                required
              />
              <select
                className="input-field"
                value={progForm.deptId}
                onChange={e => setProgForm(p => ({ ...p, deptId: e.target.value }))}
                required
              >
                <option value="">Select Department *</option>
                {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowProgModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Merge & Delete Modal ────────────────────────────────────────────── */}
      {mergeState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">

            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600 text-xl">
                ⚠
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cannot Delete Directly</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-gray-800">"{mergeState.fromName}"</span> has{' '}
                  <span className="font-semibold text-amber-600">
                    {mergeState.programCount} program{mergeState.programCount !== 1 ? 's' : ''}
                  </span>
                  . You must move them to another department first.
                </p>
              </div>
            </div>

            {/* Warning box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-800 leading-relaxed">
              All <strong>{mergeState.programCount} program{mergeState.programCount !== 1 ? 's' : ''}</strong> will
              be reassigned to the selected department, then{' '}
              <strong>"{mergeState.fromName}"</strong> will be permanently deleted.
              This action cannot be undone.
            </div>

            {/* Target selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move programs to:
              </label>
              {otherDepts.length === 0 ? (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
                  No other departments exist. Create another department first before deleting this one.
                </p>
              ) : (
                <select
                  className="input-field"
                  value={mergeTarget}
                  onChange={e => setMergeTarget(e.target.value)}
                >
                  <option value="">Select target department…</option>
                  {otherDepts.map(d => (
                    <option key={d.deptId} value={d.deptId}>
                      {d.name} ({d.programs?.length || 0} existing programs)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleMerge}
                disabled={!mergeTarget || merging || otherDepts.length === 0}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {merging ? 'Moving & Deleting…' : 'Move Programs & Delete'}
              </button>
              <button
                onClick={() => setMergeState(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
