import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const gradeColor = (g) => {
  if (!g) return 'text-gray-300';
  if (['A+','A','A-'].includes(g)) return 'text-emerald-600';
  if (['B+','B','B-'].includes(g)) return 'text-blue-600';
  if (['C+','C','C-'].includes(g)) return 'text-yellow-600';
  if (['D+','D','D-'].includes(g)) return 'text-orange-500';
  return 'text-red-700';
};

const gpaColor = (gpa) => {
  const g = parseFloat(gpa);
  if (g >= 3.70) return 'text-emerald-600';
  if (g >= 3.00) return 'text-blue-600';
  if (g >= 2.00) return 'text-yellow-600';
  return 'text-red-600';
};

// Quiz breakdown cell
const QuizBreakdown = ({ grade }) => {
  if (!grade?.quizScores?.length) return <span className="text-gray-400">—</span>;
  const scores = grade.quizScores;
  const dropped = grade.droppedQuizIdx;
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {scores.map((s, i) => (
          <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-mono ${i === dropped ? 'bg-red-100 text-red-600 line-through' : 'bg-green-50 text-green-700'}`}>
            {s}
          </span>
        ))}
      </div>
      {dropped >= 0 && <p className="text-xs text-red-400">Q{dropped + 1} dropped (N-1)</p>}
      <p className="text-xs text-gray-500">Avg: <strong>{grade.quizAverage?.toFixed(1)}%</strong></p>
    </div>
  );
};

// Progress bar
const Bar = ({ value, color = 'bg-blue-500', max = 100 }) => (
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
    <div className={`h-full ${color} rounded-full transition-all duration-500`}
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);

export default function MyGrades() {
  const [data, setData] = useState({ enrollments: [], semesterGPAs: [], currentCGPA: 0 });
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/grades/my').then(r => setData(r.data)).catch(() => {});
  }, []);

  const withGrade = data.enrollments.filter(e => e.grade);
  const totalCredits = withGrade.filter(e => e.grade?.isFinalized).reduce((s, e) => s + (e.course?.credits || 3), 0);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/grades/gradesheet/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grade_sheet.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download grade sheet');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* CGPA hero */}
      <div className="flex items-start gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Academic Record</h1>
          <p className="text-sm text-gray-500">{totalCredits} credits completed</p>
        </div>
        <div className="ml-auto flex gap-4">
          <div className="card text-center py-4 px-6">
            <p className="text-xs text-gray-500">Cumulative GPA</p>
            <p className={`text-4xl font-black mt-1 ${gpaColor(data.currentCGPA)}`}>{data.currentCGPA || '—'}</p>
            <p className="text-xs text-gray-400">out of 4.0</p>
          </div>
          <Link to="/student/whatif"
            className="card text-center py-4 px-6 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center">
            <span className="text-2xl">🔮</span>
            <span className="text-xs font-medium text-blue-600 mt-1">What-If</span>
            <span className="text-xs text-gray-400">Simulator</span>
          </Link>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="card text-center py-4 px-6 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer flex flex-col items-center justify-center disabled:opacity-50"
          >
            <span className="text-2xl">📄</span>
            <span className="text-xs font-medium text-green-600 mt-1">{downloading ? 'Generating…' : 'Download'}</span>
            <span className="text-xs text-gray-400">Grade Sheet</span>
          </button>
        </div>
      </div>

      {/* Semester GPA table */}
      {data.semesterGPAs.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Semester Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Semester','Credits Attempted','Credits Earned','Sem GPA','CGPA'].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {data.semesterGPAs.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{s.semester}</td>
                    <td className="px-4 py-2">{s.creditsAttempted}</td>
                    <td className="px-4 py-2">{s.creditsEarned}</td>
                    <td className="px-4 py-2 font-bold">
                      <span className={gpaColor(s.semesterGPA)}>{parseFloat(s.semesterGPA).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-2 font-bold">
                      <span className={gpaColor(s.cumulativeGPA)}>{parseFloat(s.cumulativeGPA).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Grades</h2>
        {data.enrollments.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">No enrollments yet</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.enrollments.map(e => {
              const g = e.grade;
              const open = selected === e.enrollId;
              return (
                <div key={e.enrollId} className="card hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="badge-blue">{e.course?.courseCode}</span>
                        <span className="text-xs text-gray-400">{e.course?.credits} cr · {e.semester}</span>
                        {!g?.isFinalized && g && <span className="badge-yellow">Draft</span>}
                        {g?.isFinalized && <span className="badge-green">Final</span>}
                        {!g && <span className="badge-gray">Pending</span>}
                      </div>
                      <p className="font-semibold text-gray-800">{e.course?.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {g ? (
                        <>
                          <p className={`text-3xl font-black ${gradeColor(g.letterGrade)}`}>{g.letterGrade}</p>
                          <p className="text-sm font-bold text-gray-600">{g.totalMarks?.toFixed(1)}</p>
                          <p className="text-xs text-gray-400">{g.cgpaPoints} pts</p>
                        </>
                      ) : <p className="text-2xl text-gray-300">—</p>}
                    </div>
                  </div>

                  {/* Progress bars for components */}
                  {g && (
                    <div className="space-y-2 mb-3 text-xs text-gray-500">
                      <div>
                        <div className="flex justify-between"><span>Quiz avg</span><span className="font-medium">{g.quizAverage?.toFixed(1)}%</span></div>
                        <Bar value={g.quizAverage || 0} color="bg-purple-400" />
                      </div>
                      {g.midtermScore !== null && g.midtermScore !== undefined && (
                        <div>
                          <div className="flex justify-between"><span>Midterm</span><span className="font-medium">{g.midtermScore}</span></div>
                          <Bar value={g.midtermScore} color="bg-blue-400" />
                        </div>
                      )}
                      {g.finalScore !== null && g.finalScore !== undefined && (
                        <div>
                          <div className="flex justify-between"><span>Final</span><span className="font-medium">{g.finalScore}</span></div>
                          <Bar value={g.finalScore} color="bg-green-400" />
                        </div>
                      )}
                      {g.hasLab && g.labScore !== null && (
                        <div>
                          <div className="flex justify-between"><span>Lab</span><span className="font-medium">{g.labScore}</span></div>
                          <Bar value={g.labScore} color="bg-yellow-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand for quiz detail */}
                  {g?.quizScores?.length > 0 && (
                    <div>
                      <button onClick={() => setSelected(open ? null : e.enrollId)}
                        className="text-xs text-blue-600 hover:underline">
                        {open ? '▲ Hide' : '▼ Show'} quiz breakdown
                      </button>
                      {open && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2">Quiz Scores (N-1 rule applied):</p>
                          <QuizBreakdown grade={g} />
                          {/* Contribution table */}
                          <div className="mt-3 text-xs space-y-1 text-gray-600">
                            <div className="flex justify-between"><span>Quiz ({(g.quizWeight * 100).toFixed(0)}%)</span><span>{(g.quizAverage * g.quizWeight).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Midterm ({(g.midtermWeight * 100).toFixed(0)}%)</span><span>{((g.midtermScore || 0) * g.midtermWeight).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Final ({((g.hasLab ? g.finalWeight : g.finalWeight + g.labWeight) * 100).toFixed(0)}%)</span><span>{((g.finalScore || 0) * (g.hasLab ? g.finalWeight : g.finalWeight + g.labWeight)).toFixed(2)}</span></div>
                            {g.hasLab && <div className="flex justify-between"><span>Lab ({(g.labWeight * 100).toFixed(0)}%)</span><span>{((g.labScore || 0) * g.labWeight).toFixed(2)}</span></div>}
                            <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total</span><span>{g.totalMarks?.toFixed(2)}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
