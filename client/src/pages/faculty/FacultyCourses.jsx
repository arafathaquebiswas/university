import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const loadStudents = async (courseId) => {
    setSelected(courseId);
    const { data } = await api.get(`/enrollments/course/${courseId}`);
    setStudents(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.courseId}
            onClick={() => loadStudents(c.courseId)}
            className={`card cursor-pointer hover:shadow-md transition-all ${selected === c.courseId ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-start justify-between">
              <span className="badge-blue">{c.courseCode}</span>
              <span className="text-xs text-gray-400">{c.semester}</span>
            </div>
            <h3 className="font-semibold text-gray-800 mt-2">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
            <div className="mt-3 text-xs text-gray-500">{c.credits} credits · Max {c.maxCapacity}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Enrolled Students</h2>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">No students enrolled</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Student', 'Email', 'Attendance %', 'Status', 'Grade'].map(h => (
                    <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(e => (
                    <tr key={e.enrollId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{e.student?.user?.username}</td>
                      <td className="px-4 py-2 text-gray-500">{e.student?.user?.email}</td>
                      <td className="px-4 py-2">
                        <span className={`font-medium ${parseFloat(e.attendancePercentage) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {e.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-2"><span className={e.status === 'active' ? 'badge-green' : 'badge-gray'}>{e.status}</span></td>
                      <td className="px-4 py-2">{e.grade ? `${e.grade.letterGrade} (${e.grade.score})` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
