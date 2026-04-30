import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/announcements')
      .then(r => setAnnouncements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-blue-900 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-2">Announcements</h1>
        <p className="text-blue-200 text-lg">Stay up to date with the latest university news and notices</p>
      </div>

      <main className="max-w-4xl mx-auto py-12 px-4">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No announcements at this time.</div>
        ) : (
          <div className="space-y-6">
            {announcements.map(a => (
              <div key={a.announcementId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="text-xl font-bold text-blue-900">{a.title}</h2>
                  <span className="text-xs text-gray-400 whitespace-nowrap pt-1">{fmt(a.createdAt)}</span>
                </div>
                {a.creator && (
                  <p className="text-xs text-gray-500 mt-1">
                    Posted by {a.creator.username}
                  </p>
                )}
                <p className="text-gray-700 mt-4 leading-relaxed whitespace-pre-line">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
