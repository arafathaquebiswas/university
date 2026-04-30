import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CourseEnrollment() {
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [semester, setSemester] = useState('Spring 2026');
  const [loading, setLoading] = useState(false);
  const [confirmCourse, setConfirmCourse] = useState(null);

  const load = async () => {
    const [c, e] = await Promise.all([
      api.get('/courses', { params: { semester } }),
      api.get('/enrollments/my'),
    ]);
    setCourses(c.data);
    setMyEnrollments(e.data);
  };
  useEffect(() => { load(); }, [semester]);

  // Currently active enrollments
  const enrolledIds = new Set(myEnrollments.filter(e => e.status === 'active').map(e => e.courseId));

  // Courses taken in any previous semester (completed, dropped, withdrawn)
  const previouslyTakenIds = new Set(
    myEnrollments.filter(e => e.status !== 'active').map(e => e.courseId)
  );

  const handleEnroll = async (courseId) => {
    setLoading(true);
    try {
      await api.post('/enrollments', { courseId, semester });
      toast.success('Enrolled successfully!');
      setConfirmCourse(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    } finally { setLoading(false); }
  };

  const handleEnrollClick = (course) => {
    if (previouslyTakenIds.has(course.courseId)) {
      // Find the past enrollment record to show the semester
      const past = myEnrollments.find(e => e.courseId === course.courseId && e.status !== 'active');
      setConfirmCourse({ ...course, pastSemester: past?.semester, pastStatus: past?.status });
    } else {
      handleEnroll(course.courseId);
    }
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
            const takenBefore = previouslyTakenIds.has(c.courseId);
            return (
              <div key={c.courseId} className={`card ${enrolled ? 'opacity-70' : 'hover:shadow-md'} transition-shadow relative`}>
                {takenBefore && !enrolled && (
                  <span className="absolute top-3 right-3 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    Taken before
                  </span>
                )}
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
                    <button onClick={() => handleEnrollClick(c)} disabled={loading}
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

      {/* Re-enrollment confirmation popup */}
      {confirmCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Already Taken This Course</h2>
                <p className="text-xs text-gray-500">Re-enrollment confirmation</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-5">
              <p className="text-sm font-semibold text-gray-800">{confirmCourse.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{confirmCourse.courseCode} · {confirmCourse.credits} credits</p>
              {confirmCourse.pastSemester && (
                <p className="text-xs text-orange-700 mt-2">
                  Previously enrolled in <span className="font-medium">{confirmCourse.pastSemester}</span>
                  {confirmCourse.pastStatus && <> · Status: <span className="font-medium capitalize">{confirmCourse.pastStatus}</span></>}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-5">
              You have already taken this course in a previous semester. Are you sure you want to re-enroll in <span className="font-medium">{semester}</span>?
            </p>

            <div className="flex gap-3">
              <button onClick={() => handleEnroll(confirmCourse.courseId)} disabled={loading}
                className="btn-primary flex-1">
                {loading ? 'Enrolling…' : 'Yes, Re-enroll'}
              </button>
              <button onClick={() => setConfirmCourse(null)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
