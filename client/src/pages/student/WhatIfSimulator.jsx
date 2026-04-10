import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const gradeColor = (g) => {
  if (['A+','A','A-'].includes(g)) return '#10b981';
  if (['B+','B','B-'].includes(g)) return '#3b82f6';
  if (['C+','C','C-'].includes(g)) return '#f59e0b';
  if (['D+','D','D-'].includes(g)) return '#f97316';
  return '#ef4444';
};

const targets = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-'];

export default function WhatIfSimulator() {
  const [enrollments, setEnrollments] = useState([]);
  const [selected, setSelected]       = useState('');
  const [whatIfFinal, setWhatIfFinal] = useState(80);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    api.get('/enrollments/my').then(r => setEnrollments(r.data)).catch(() => {});
  }, []);

  const simulate = async (enrollId = selected, score = whatIfFinal) => {
    if (!enrollId) return;
    setLoading(true);
    try {
      const { data } = await api.post('/grades/whatif', {
        enrollId: parseInt(enrollId),
        whatIfFinalScore: parseFloat(score),
      });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally { setLoading(false); }
  };

  const selectedEnroll = enrollments.find(e => String(e.enrollId) === String(selected));
  const currentGrade   = selectedEnroll?.grade;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">What-If Grade Simulator 🔮</h1>
        <p className="text-sm text-gray-500">See how your final exam score affects your grade</p>
      </div>

      {/* Course picker */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
            <select className="input-field" value={selected}
              onChange={e => { setSelected(e.target.value); setResult(null); }}>
              <option value="">Choose a course…</option>
              {enrollments.map(e => (
                <option key={e.enrollId} value={e.enrollId}>
                  {e.course?.courseCode} — {e.course?.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What-If Final Score: <strong className="text-blue-600">{whatIfFinal}</strong>
            </label>
            <input type="range" min="0" max="100" step="1"
              className="w-full accent-blue-600"
              value={whatIfFinal}
              onChange={e => { setWhatIfFinal(e.target.value); if (selected) simulate(selected, e.target.value); }}
            />
          </div>

          <button onClick={() => simulate()} disabled={!selected || loading}
            className="btn-primary px-6 py-2.5 disabled:opacity-50">
            {loading ? 'Simulating…' : 'Simulate'}
          </button>
        </div>
      </div>

      {/* Current marks snapshot */}
      {selected && currentGrade && (
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-3">Current Marks Snapshot</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-gray-500">Quiz Avg (after N-1)</p>
              <p className="font-bold text-gray-800">{currentGrade.quizAverage?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Midterm</p>
              <p className="font-bold text-gray-800">{currentGrade.midtermScore ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Final (actual)</p>
              <p className="font-bold text-gray-800">{currentGrade.finalScore ?? '—'}</p>
            </div>
            {currentGrade.hasLab && (
              <div>
                <p className="text-xs text-gray-500">Lab</p>
                <p className="font-bold text-gray-800">{currentGrade.labScore ?? '—'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <>
          {/* Specific what-if result */}
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-2">
              If you score <strong className="text-blue-600">{whatIfFinal}</strong> in the final exam…
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Total marks = {result.specific.totalMarks.toFixed(2)} / 100
            </p>
            <div className="inline-flex items-center gap-6 bg-gray-50 rounded-2xl px-8 py-5">
              <div>
                <p className="text-xs text-gray-500">Grade</p>
                <p className="text-5xl font-black" style={{ color: gradeColor(result.specific.letterGrade) }}>
                  {result.specific.letterGrade}
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500">Total Marks</p>
                <p className="text-3xl font-bold text-gray-800">{result.specific.totalMarks.toFixed(1)}</p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500">Grade Points</p>
                <p className="text-3xl font-bold text-gray-800">{result.specific.cgpaPoints.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Full simulation chart */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Grade vs Final Score</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.simulations} margin={{ left: 0, right: 10, top: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="finalScore" label={{ value: 'Final Score', position: 'insideBottom', offset: -10, fontSize: 11 }} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 10 }} label={{ value: 'Grade Points', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip
                  formatter={(v, n, { payload }) => [payload.letterGrade, 'Grade']}
                  labelFormatter={v => `Final: ${v}`}
                />
                <ReferenceLine x={parseInt(whatIfFinal)} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'What-If', position: 'top', fontSize: 10, fill: '#3b82f6' }} />
                <Bar dataKey="cgpaPoints" radius={[4,4,0,0]}
                  fill="#3b82f6"
                  label={{ position: 'top', formatter: (v, entry) => result.simulations.find(s => s.cgpaPoints === v)?.letterGrade || '', fontSize: 9, fill: '#374151' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Required scores table */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Required Final Score to Achieve Each Grade</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {targets.map(t => {
                const req = result.required[t];
                const feasible = req !== null && req <= 100;
                const already  = req !== null && req <= 0;
                return (
                  <div key={t} className={`text-center p-3 rounded-xl border ${already ? 'bg-green-50 border-green-300' : feasible ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="font-bold text-gray-800">{t}</p>
                    <p className={`text-sm font-bold mt-1 ${already ? 'text-green-600' : feasible ? 'text-blue-600' : 'text-red-500'}`}>
                      {already ? 'Already ✓' : feasible ? `≥ ${req}` : 'Not possible'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
