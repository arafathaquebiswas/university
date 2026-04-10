import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const typeIcon = { grade: '📊', attendance: '📋', payment: '💳', announcement: '📢', enrollment: '📚', system: '⚙️' };

export default function Notifications() {
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });

  const load = () => api.get('/notifications/my').then(r => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    load();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    toast.success('All marked as read');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">{data.unreadCount} unread</p>
        </div>
        {data.unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">Mark all read</button>
        )}
      </div>

      <div className="space-y-3">
        {data.notifications.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">No notifications</div>
        ) : data.notifications.map(n => (
          <div key={n.notificationId}
            onClick={() => n.status === 'unread' && markRead(n.notificationId)}
            className={`card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow ${n.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="text-2xl flex-shrink-0">{typeIcon[n.type] || '🔔'}</div>
            <div className="flex-1">
              <p className={`text-sm ${n.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleString()}</span>
                <span className={n.status === 'unread' ? 'badge-blue' : 'badge-gray'}>{n.type}</span>
              </div>
            </div>
            {n.status === 'unread' && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
