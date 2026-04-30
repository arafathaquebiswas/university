import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function FacultyAnnouncements() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const loadAnnouncements = (courseId) => {
    if (selected === courseId) { setSelected(null); setAnnouncements([]); setShowForm(false); return; }
    setSelected(courseId);
    setShowForm(false);
    setForm({ title: '', content: '' });
    api.get(`/announcements?courseId=${courseId}`).then(r => setAnnouncements(r.data)).catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', { ...form, courseId: selected, isGlobal: false });
      toast.success('Announcement posted!');
      setForm({ title: '', content: '' });
      setShowForm(false);
      api.get(`/announcements?courseId=${selected}`).then(r => setAnnouncements(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Deleted');
      setAnnouncements(prev => prev.filter(a => a.announcementId !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const selectedCourse = courses.find(c => c.courseId === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Course Announcements</h1>
        <p className="text-sm text-gray-500">Select a course to manage its announcements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <div
            key={c.courseId}
            onClick={() => loadAnnouncements(c.courseId)}
            className={`card cursor-pointer hover:shadow-md transition-all ${selected === c.courseId ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <span className="badge-blue">{c.courseCode}</span>
              <span className="text-xs text-gray-400">{c.semester}</span>
            </div>
            <h3 className="font-semibold text-gray-800 mt-2">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{c.credits} credits</p>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-gray-400 col-span-3">No courses assigned yet</p>
        )}
      </div>

      {selected && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedCourse?.courseCode} — {selectedCourse?.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Visible only to students enrolled in this course</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : '+ New Announcement'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
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
                  placeholder="Write your announcement..."
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Post</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3 border-t pt-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No announcements for this course yet</p>
            ) : announcements.map(a => (
              <div key={a.announcementId} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    By {a.creator?.username} · {fmt(a.createdAt)}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
