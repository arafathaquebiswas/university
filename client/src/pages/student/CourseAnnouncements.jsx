import { useEffect, useState } from 'react';
import api from '../../api/axios';

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function CourseAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements/my-courses')
      .then(r => setAnnouncements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = announcements.reduce((acc, a) => {
    const key = a.courseId;
    if (!acc[key]) acc[key] = { course: a.course, items: [] };
    acc[key].items.push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Course Announcements</h1>
        <p className="text-sm text-gray-500">Announcements from your enrolled courses</p>
      </div>

      {loading ? (
        <div className="card text-center text-gray-400 py-16">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center text-gray-400 py-16">No announcements from your courses yet</div>
      ) : Object.values(grouped).map(({ course, items }) => (
        <div key={course?.courseId} className="space-y-3">
          <div className="flex items-center gap-3 pb-1 border-b border-gray-200">
            <span className="badge-blue">{course?.courseCode}</span>
            <h2 className="text-base font-semibold text-gray-800">{course?.title}</h2>
          </div>
          {items.map(a => (
            <div key={a.announcementId} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(a.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Posted by {a.creator?.username}</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{a.content}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
