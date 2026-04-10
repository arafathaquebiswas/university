import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function FacultyAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', courseId: '', isGlobal: false });
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
  useEffect(() => {
    load();
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', form);
      toast.success('Announcement posted!');
      setShowForm(false);
      setForm({ title: '', content: '', courseId: '', isGlobal: false });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Post Announcement</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input-field" placeholder="Title" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
            <textarea className="input-field" rows={4} placeholder="Content" value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} required />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Course (optional)</label>
                <select className="input-field" value={form.courseId} onChange={e => setForm(p=>({...p,courseId:e.target.value}))}>
                  <option value="">All students</option>
                  {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseCode} — {c.title}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isGlobal} onChange={e => setForm(p=>({...p,isGlobal:e.target.checked}))} className="rounded" />
                  Post globally
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Post</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">No announcements</div>
        ) : announcements.map(a => (
          <div key={a.announcementId} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  By {a.creator?.username} · {new Date(a.createdAt).toLocaleDateString()}
                  {a.isGlobal && <span className="ml-2 badge-blue">Global</span>}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-3">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
