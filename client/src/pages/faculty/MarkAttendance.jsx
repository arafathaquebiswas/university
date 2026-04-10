import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function MarkAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const loadStudents = async (courseId) => {
    setSelectedCourse(courseId);
    const { data } = await api.get(`/enrollments/course/${courseId}`);
    setStudents(data);
    const init = {};
    data.forEach(e => { init[e.studentId] = 'present'; });
    setAttendance(init);
  };

  const handleSubmit = async () => {
    if (!selectedCourse) { toast.error('Select a course'); return; }
    setSubmitting(true);
    try {
      const records = students.map(e => ({ studentId: e.studentId, status: attendance[e.studentId] || 'present' }));
      await api.post('/attendance', { courseId: parseInt(selectedCourse), date, records });
      toast.success('Attendance saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSubmitting(false); }
  };

  const statusColors = { present: 'bg-green-100 text-green-800', absent: 'bg-red-100 text-red-800', late: 'bg-yellow-100 text-yellow-800', excused: 'bg-blue-100 text-blue-800' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select className="input-field" value={selectedCourse} onChange={e => loadStudents(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseCode} — {c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Students ({students.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => { const a = {}; students.forEach(s => a[s.studentId] = 'present'); setAttendance(a); }}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">All Present</button>
              <button onClick={() => { const a = {}; students.forEach(s => a[s.studentId] = 'absent'); setAttendance(a); }}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">All Absent</button>
            </div>
          </div>

          <div className="space-y-2">
            {students.map(e => (
              <div key={e.enrollId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.student?.user?.username}</p>
                  <p className="text-xs text-gray-500">{e.student?.user?.email}</p>
                </div>
                <div className="flex gap-2">
                  {['present', 'absent', 'late', 'excused'].map(s => (
                    <button key={s} onClick={() => setAttendance(p => ({ ...p, [e.studentId]: s }))}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${attendance[e.studentId] === s ? statusColors[s] : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-400'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-4 w-full py-2.5">
            {submitting ? 'Saving…' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
