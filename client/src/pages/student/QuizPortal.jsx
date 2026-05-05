import { useEffect, useState } from 'react';
import api from '../../api/axios';

const quizCards = [
  {
    id: 1,
    title: 'Quiz 1: Foundations',
    courseCode: 'CSE101',
    dueDate: '2026-05-10',
    status: 'Open',
    totalMarks: 10,
  },
  {
    id: 2,
    title: 'Quiz 2: Problem Solving',
    courseCode: 'CSE201',
    dueDate: '2026-05-16',
    status: 'Coming Soon',
    totalMarks: 10,
  },
  {
    id: 3,
    title: 'Quiz 3: Review Session',
    courseCode: 'CSE301',
    dueDate: '2026-05-22',
    status: 'Locked',
    totalMarks: 15,
  },
];

export default function QuizPortal() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/enrollments/my')
      .then(({ data }) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quiz Portal</h1>
        <p className="text-sm text-gray-500">View quiz availability for your enrolled courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Enrolled Courses</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{courses.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Open Quizzes</p>
          <p className="text-3xl font-black text-green-600 mt-1">1</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Due Soon</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">2</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Enrolled courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-400">No enrollments found.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((enrollment) => (
              <div key={enrollment.enrollId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{enrollment.course?.courseCode}</p>
                  <p className="text-xs text-gray-500">{enrollment.course?.title}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${parseFloat(enrollment.attendancePercentage) >= 75 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {enrollment.attendancePercentage}% attendance
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Available quizzes</h2>
        <div className="space-y-3">
          {quizCards.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-blue">{quiz.courseCode}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {quiz.status}
                  </span>
                </div>
                <p className="mt-2 font-medium text-gray-800">{quiz.title}</p>
                <p className="text-xs text-gray-500">Due {new Date(quiz.dueDate).toLocaleDateString()} · {quiz.totalMarks} marks</p>
              </div>
              <button type="button" className="text-sm text-blue-600 hover:underline">
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}