import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ courseCode: '', title: '', description: '', credits: 3, progId: '', facultyId: '', semester: '', maxCapacity: 40 });

  const load = async () => {
    const [c, p, u] = await Promise.all([
      api.get('/courses'),
      api.get('/admin/programs'),
      api.get('/users', { params: { role: 'faculty', limit: 100 } }),
    ]);
    setCourses(c.data); setPrograms(p.data);
    setFaculty(u.data.users);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', form);
      toast.success('Course created');
      setShowModal(false);
      setForm({ courseCode: '', title: '', description: '', credits: 3, progId: '', facultyId: '', semester: '', maxCapacity: 40 });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Deactivate this course?')) return;
    try { await api.delete(`/courses/${id}`); toast.success('Course deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-sm text-gray-500">{courses.length} courses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Course</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.courseId} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <span className="badge-blue">{c.courseCode}</span>
              <button onClick={() => deleteCourse(c.courseId)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <h3 className="font-semibold text-gray-800 mt-2">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>{c.credits} credits</span>
              <span>·</span>
              <span>{c.semester || 'N/A'}</span>
              <span>·</span>
              <span>Max: {c.maxCapacity}</span>
            </div>
            {c.faculty?.user && (
              <p className="text-xs text-blue-600 mt-2">Faculty: {c.faculty.user.username}</p>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Create Course</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Course Code</label>
                  <input className="input-field mt-1" placeholder="CSE301" value={form.courseCode} onChange={e => setForm(p=>({...p,courseCode:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Credits</label>
                  <input type="number" className="input-field mt-1" value={form.credits} onChange={e => setForm(p=>({...p,credits:e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Title *</label>
                <input className="input-field mt-1" placeholder="Course title" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea className="input-field mt-1" rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Program</label>
                  <select className="input-field mt-1" value={form.progId} onChange={e => setForm(p=>({...p,progId:e.target.value}))}>
                    <option value="">Select</option>
                    {programs.map(p => <option key={p.progId} value={p.progId}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Faculty</label>
                  <select className="input-field mt-1" value={form.facultyId} onChange={e => setForm(p=>({...p,facultyId:e.target.value}))}>
                    <option value="">Select</option>
                    {faculty.map(f => <option key={f.userId} value={f.facultyProfile?.facultyId}>{f.username}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Semester</label>
                  <input className="input-field mt-1" placeholder="Spring 2025" value={form.semester} onChange={e => setForm(p=>({...p,semester:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Max Capacity</label>
                  <input type="number" className="input-field mt-1" value={form.maxCapacity} onChange={e => setForm(p=>({...p,maxCapacity:e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
