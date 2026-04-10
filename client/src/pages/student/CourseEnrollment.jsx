import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CourseEnrollment() {
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [semester, setSemester] = useState('Spring 2026');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [c, e] = await Promise.all([api.get('/courses'), api.get('/enrollments/my')]);
    setCourses(c.data);
    setMyEnrollments(e.data);
  };
  useEffect(() => { load(); }, []);

  const enrolledIds = new Set(myEnrollments.filter(e => e.status === 'active').map(e => e.courseId));

  const handleEnroll = async (courseId) => {
    setLoading(true);
    try {
      await api.post('/enrollments', { courseId, semester });
      toast.success('Enrolled successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    } finally { setLoading(false); }
  };

  const handleDrop = async (enrollId) => {
    if (!confirm('Drop this course?')) return;
    try {
      await api.delete(`/enrollments/${enrollId}`);
      toast.success('Course dropped');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Course Enrollment</h1>
        <select className="input-field w-48" value={semester} onChange={e => setSemester(e.target.value)}>
          {['Spring 2026', 'Summer 2026', 'Fall 2026', 'Spring 2027'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Current enrollments */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">My Enrollments ({myEnrollments.filter(e => e.status === 'active').length})</h2>
        {myEnrollments.filter(e => e.status === 'active').length === 0 ? (
          <p className="text-sm text-gray-400">No active enrollments</p>
        ) : (
          <div className="space-y-2">
            {myEnrollments.filter(e => e.status === 'active').map(e => (
              <div key={e.enrollId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.course?.title}</p>
                  <p className="text-xs text-gray-500">{e.course?.courseCode} · {e.semester} · {e.course?.credits} credits</p>
                </div>
                <button onClick={() => handleDrop(e.enrollId)} className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50">
                  Drop
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available courses */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => {
            const enrolled = enrolledIds.has(c.courseId);
            return (
              <div key={c.courseId} className={`card ${enrolled ? 'opacity-70' : 'hover:shadow-md'} transition-shadow`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="badge-blue">{c.courseCode}</span>
                  <span className="text-xs text-gray-400">{c.credits} credits</span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-1">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-3 text-xs text-gray-500">
                  Faculty: {c.faculty?.user?.username || 'TBA'} · Max: {c.maxCapacity}
                </div>
                <div className="mt-3">
                  {enrolled ? (
                    <span className="badge-green w-full text-center py-1.5 flex items-center justify-center">✓ Enrolled</span>
                  ) : (
                    <button onClick={() => handleEnroll(c.courseId)} disabled={loading}
                      className="btn-primary w-full py-1.5 text-sm">
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
