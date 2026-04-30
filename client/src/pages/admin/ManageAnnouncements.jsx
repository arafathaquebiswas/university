import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', isGlobal: true });
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      load();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', { ...form, courseId: null });
      toast.success('Announcement posted!');
      setForm({ title: '', content: '', isGlobal: true });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Post university-wide notices</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Post Announcement</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <input
                className="input-field"
                placeholder="Announcement title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Write the announcement..."
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isGlobal}
                onChange={e => setForm(p => ({ ...p, isGlobal: e.target.checked }))}
                className="rounded"
              />
              Post globally (visible to all users)
            </label>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Post</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="card text-center text-gray-400 py-16">No announcements yet</div>
        ) : announcements.map(a => (
          <div key={a.announcementId} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  {a.isGlobal && <span className="badge-blue text-xs">Global</span>}
                  {a.courseId && <span className="badge-yellow text-xs">Course-specific</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  By {a.creator?.username} ({a.creator?.role}) · {fmt(a.createdAt)}
                </p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{a.content}</p>
              </div>
              <button
                onClick={() => handleDelete(a.announcementId)}
                className="flex-shrink-0 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
