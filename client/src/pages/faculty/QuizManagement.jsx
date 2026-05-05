import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusStyles = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  upcoming: 'bg-blue-100 text-blue-700',
};

const sampleQuizzes = [
  {
    id: 1,
    title: 'Quiz 1: Foundations',
    courseCode: 'CSE101',
    dueDate: '2026-05-10',
    status: 'published',
    totalMarks: 10,
  },
  {
    id: 2,
    title: 'Quiz 2: Problem Solving',
    courseCode: 'CSE201',
    dueDate: '2026-05-16',
    status: 'draft',
    totalMarks: 10,
  },
  {
    id: 3,
    title: 'Quiz 3: Review Session',
    courseCode: 'CSE301',
    dueDate: '2026-05-22',
    status: 'upcoming',
    totalMarks: 15,
  },
];

export default function QuizManagement() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let isMounted = true;

    api.get('/auth/me')
      .then(({ data }) => {
        const facultyId = data.facultyProfile?.facultyId;
        if (!facultyId || !isMounted) return;
        return api.get(`/courses/faculty/${facultyId}`)
          .then(({ data: courseData }) => {
            if (isMounted) setCourses(Array.isArray(courseData) ? courseData : []);
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
        <p className="text-sm text-gray-500">Track quiz plans for your assigned courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Assigned Courses</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{courses.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Published Quizzes</p>
          <p className="text-3xl font-black text-green-600 mt-1">1</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Upcoming Deadlines</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">2</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Course quiz plan</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-400">No assigned courses found.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{course.courseCode}</p>
                  <p className="text-xs text-gray-500">{course.title}</p>
                </div>
                <span className="badge-blue">{course.credits} cr</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Planned quizzes</h2>
          <button type="button" className="btn-primary text-sm py-2 px-4 opacity-70 cursor-not-allowed" disabled>
            Create Quiz
          </button>
        </div>

        <div className="space-y-3">
          {sampleQuizzes.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-blue">{quiz.courseCode}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[quiz.status]}`}>
                    {quiz.status}
                  </span>
                </div>
                <p className="mt-2 font-medium text-gray-800">{quiz.title}</p>
                <p className="text-xs text-gray-500">Due {new Date(quiz.dueDate).toLocaleDateString()} · {quiz.totalMarks} marks</p>
              </div>
              <button type="button" className="text-sm text-blue-600 hover:underline">
                Manage
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}