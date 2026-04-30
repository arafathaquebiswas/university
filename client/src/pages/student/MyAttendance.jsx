import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusColors = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', excused: 'badge-blue' };

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ArcGauge = ({ pct }) => {
  const color = pct >= 90 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const r = 36, cx = 44, cy = 44, stroke = 8;
  const circumference = Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <svg width="88" height="52" viewBox="0 0 88 52">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{pct.toFixed(0)}%</text>
    </svg>
  );
};

export default function MyAttendance() {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/my')
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Only average courses that have at least one class recorded
  const coursesWithClasses = data.filter(d => d.totalClasses > 0);
  const overall = coursesWithClasses.length
    ? (coursesWithClasses.reduce((s, d) => s + (d.percentage || 0), 0) / coursesWithClasses.length).toFixed(1)
    : null;

  const warnings = data.filter(d => d.warning);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-sm text-gray-500">{data.length} courses tracked</p>
        </div>
        <div className="card text-center px-5 py-3">
          <p className="text-xs text-gray-500">Overall Avg</p>
          {overall !== null ? (
            <p className={`text-2xl font-black ${parseFloat(overall) >= 75 ? 'text-green-600' : 'text-red-600'}`}>{overall}%</p>
          ) : (
            <p className="text-2xl font-black text-gray-400">—</p>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-700 mb-2">Attendance Warning</p>
          {warnings.map((w, i) => (
            <p key={w.course?.courseId ?? i} className="text-sm text-red-600">
              {w.course?.courseCode} — {w.course?.title}:{' '}
              <strong>{(w.percentage ?? 0).toFixed(1)}%</strong>
              {' '}({w.missed} classes missed) — Below 75% threshold
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((d, idx) => {
          const courseId = d.course?.courseId ?? idx;
          const pct = d.percentage ?? 0;
          const status = d.totalClasses > 0
            ? (d.status ?? { level: 'critical', label: 'No data' })
            : { level: 'none', label: 'No classes yet' };
          return (
            <div key={courseId}
              onClick={() => setSelected(selected === courseId ? null : courseId)}
              className={`card cursor-pointer hover:shadow-md transition-shadow ${d.warning ? 'border-l-4 border-l-red-400' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge-blue">{d.course?.courseCode ?? '—'}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      status.level === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                      status.level === 'good'      ? 'bg-blue-100 text-blue-700' :
                      status.level === 'warning'   ? 'bg-yellow-100 text-yellow-700' :
                      status.level === 'none'      ? 'bg-gray-100 text-gray-500' :
                                                     'bg-red-100 text-red-700'
                    }`}>{status.label}</span>
                  </div>
                  <p className="font-semibold text-gray-800">{d.course?.title ?? 'Unknown course'}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>Total: <strong>{d.totalClasses ?? 0}</strong></span>
                    <span className="text-green-600">Present: <strong>{d.present ?? 0}</strong></span>
                    {(d.late ?? 0) > 0 && (
                      <span className="text-yellow-600">Late: <strong>{d.late}</strong></span>
                    )}
                    <span className="text-red-500">Absent: <strong>{d.absent ?? 0}</strong></span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 90 ? 'bg-emerald-500' :
                      pct >= 75 ? 'bg-blue-500' :
                      pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                  {d.warning && (
                    <p className="text-xs text-red-600 mt-1">
                      Need {Math.ceil((0.75 * d.totalClasses) - d.attended)} more classes to reach 75%
                    </p>
                  )}
                </div>
                {d.totalClasses > 0 && <ArcGauge pct={pct} />}
              </div>

              {selected === courseId && (d.records ?? []).length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Class Record</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {d.records.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{fmtDate(r.date)}</span>
                        <span className={statusColors[r.status] || 'badge-gray'}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="card text-center py-16 text-gray-400">No attendance records yet</div>
      )}
    </div>
  );
}
