import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Grading engine (client-side mirror for real-time preview) ─────────────────
const applyNMinusOne = (scores = []) => {
  if (scores.length <= 1) return { kept: scores, dropped: null, droppedIndex: -1 };
  let minVal = Infinity, droppedIndex = 0;
  scores.forEach((s, i) => { if (s < minVal) { minVal = s; droppedIndex = i; } });
  return { kept: scores.filter((_, i) => i !== droppedIndex), dropped: minVal, droppedIndex };
};

const getGrade = (t) => {
  if (t >= 97) return { letter: 'A+', points: 4.0, color: 'text-emerald-600' };
  if (t >= 90) return { letter: 'A',  points: 4.0, color: 'text-emerald-600' };
  if (t >= 85) return { letter: 'A-', points: 3.7, color: 'text-green-600' };
  if (t >= 80) return { letter: 'B+', points: 3.3, color: 'text-blue-600' };
  if (t >= 75) return { letter: 'B',  points: 3.0, color: 'text-blue-600' };
  if (t >= 70) return { letter: 'B-', points: 2.7, color: 'text-blue-500' };
  if (t >= 65) return { letter: 'C+', points: 2.3, color: 'text-yellow-600' };
  if (t >= 60) return { letter: 'C',  points: 2.0, color: 'text-yellow-600' };
  if (t >= 57) return { letter: 'C-', points: 1.7, color: 'text-orange-500' };
  if (t >= 55) return { letter: 'D+', points: 1.3, color: 'text-orange-600' };
  if (t >= 52) return { letter: 'D',  points: 1.0, color: 'text-red-500' };
  if (t >= 50) return { letter: 'D-', points: 0.7, color: 'text-red-600' };
  return           { letter: 'F',  points: 0.0, color: 'text-red-700' };
};

const calcPreview = (input, policy) => {
  const { quizScores=[], midtermScore=0, finalScore=0, labScore=0 } = input;
  const { kept, droppedIndex } = applyNMinusOne(quizScores);
  const maxPerItem = policy.quizMaxPerItem || 10;
  const quizSum = kept.reduce((a, b) => a + b, 0);
  const quizMax = kept.length * maxPerItem;
  const quizAvg = quizMax > 0 ? (quizSum / quizMax) * 100 : 0;

  const eff = p => p.hasLab ? p.finalWeight : p.finalWeight + p.labWeight;
  const total =
    quizAvg * (p => p.quizWeight)(policy) +
    midtermScore * policy.midtermWeight +
    finalScore   * eff(policy) +
    (policy.hasLab ? labScore * policy.labWeight : 0);

  return { quizAvg: quizAvg.toFixed(1), droppedIndex, total: total.toFixed(2), ...getGrade(total) };
};

// ─── Policy configurator ───────────────────────────────────────────────────────
const PolicyEditor = ({ policy, onChange, courseId }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(policy);
  const save = async () => {
    try {
      await api.put(`/grades/policy/${courseId}`, form);
      onChange(form);
      setEditing(false);
      toast.success('Policy saved');
    } catch { toast.error('Failed to save policy'); }
  };
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-blue-800">Grading Policy (weights must total 100%)</p>
        <button onClick={() => { setEditing(!editing); setForm(policy); }}
          className="text-xs text-blue-600 hover:underline">{editing ? 'Cancel' : 'Edit'}</button>
      </div>
      {editing ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['quizWeight','Quiz %'],['midtermWeight','Midterm %'],['finalWeight','Final %'],['labWeight','Lab %']].map(([k,l]) => (
            <div key={k}>
              <label className="text-xs text-gray-600">{l}</label>
              <input type="number" step="0.05" min="0" max="1"
                className="input-field mt-0.5" value={form[k]}
                onChange={e => setForm(p => ({ ...p, [k]: parseFloat(e.target.value) }))} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-600">Max per Quiz</label>
            <input type="number" className="input-field mt-0.5" value={form.quizMaxPerItem}
              onChange={e => setForm(p => ({ ...p, quizMaxPerItem: parseFloat(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input type="checkbox" id="hasLab" checked={form.hasLab}
              onChange={e => setForm(p => ({ ...p, hasLab: e.target.checked }))} />
            <label htmlFor="hasLab" className="text-xs text-gray-700">Has Lab component</label>
          </div>
          <div className="col-span-2">
            <button onClick={save} className="btn-primary text-sm py-1.5 w-full">Save Policy</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 text-sm flex-wrap">
          {[['Quiz', policy.quizWeight], ['Midterm', policy.midtermWeight], ['Final', policy.finalWeight], policy.hasLab && ['Lab', policy.labWeight]].filter(Boolean).map(([k, v]) => (
            <span key={k} className="bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-700">
              {k}: <strong>{(v * 100).toFixed(0)}%</strong>
            </span>
          ))}
          <span className="bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-700">
            Max/Quiz: <strong>{policy.quizMaxPerItem}</strong>
          </span>
          {policy.hasLab && <span className="badge-blue">Lab included</span>}
        </div>
      )}
    </div>
  );
};

// ─── Per-student grade row ────────────────────────────────────────────────────
const GradeRow = ({ enrollment, policy, onSaved }) => {
  const g = enrollment.grade;
  const [form, setForm] = useState({
    quizScores:   g?.quizScores   || [],
    midtermScore: g?.midtermScore ?? '',
    finalScore:   g?.finalScore   ?? '',
    labScore:     g?.labScore     ?? '',
  });
  const [quizInput, setQuizInput] = useState((g?.quizScores || []).join(', '));
  const [saving, setSaving] = useState(false);

  const parseQuizzes = (str) => {
    const scores = str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    setForm(p => ({ ...p, quizScores: scores }));
    return scores;
  };

  const preview = calcPreview({ ...form, quizScores: parseQuizzes(quizInput) || form.quizScores }, policy);
  const { kept, droppedIndex, dropped } = applyNMinusOne(form.quizScores);

  const save = async (finalize = false) => {
    setSaving(true);
    try {
      await api.post('/grades', {
        enrollId: enrollment.enrollId,
        quizScores: form.quizScores,
        midtermScore: parseFloat(form.midtermScore) || 0,
        finalScore:   parseFloat(form.finalScore)   || 0,
        labScore:     parseFloat(form.labScore)      || 0,
        finalize,
      });
      toast.success(finalize ? `Grade finalized: ${preview.letter}` : 'Marks saved (draft)');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const student = enrollment.student?.user;

  return (
    <div className="card mb-3 hover:shadow-md transition-shadow">
      {/* Student header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-800">{student?.username}</p>
          <p className="text-xs text-gray-500">{student?.email}</p>
          <p className={`text-xs mt-1 font-medium ${parseFloat(enrollment.attendancePercentage) < 75 ? 'text-red-600' : 'text-green-600'}`}>
            Attendance: {enrollment.attendancePercentage}%
            {parseFloat(enrollment.attendancePercentage) < 75 && ' ⚠'}
          </p>
        </div>
        {/* Live preview */}
        <div className="text-right bg-gray-50 rounded-xl px-5 py-3 border">
          <p className="text-xs text-gray-500 mb-1">Live Preview</p>
          <p className={`text-3xl font-black ${preview.color}`}>{preview.letter}</p>
          <p className="text-sm font-bold text-gray-700">{preview.total} / 100</p>
          <p className="text-xs text-gray-400">{preview.points} pts</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Quizzes */}
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Quiz Scores (comma-separated, max {policy.quizMaxPerItem} each)
          </label>
          <input
            className="input-field text-sm"
            placeholder="e.g. 9, 8, 7, 10"
            value={quizInput}
            onChange={e => { setQuizInput(e.target.value); parseQuizzes(e.target.value); }}
          />
          {/* N-1 breakdown */}
          {form.quizScores.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {form.quizScores.map((s, i) => (
                <span key={i}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${i === preview.droppedIndex ? 'bg-red-100 text-red-700 line-through' : 'bg-green-100 text-green-700'}`}>
                  Q{i + 1}: {s}
                </span>
              ))}
              {preview.droppedIndex >= 0 && (
                <span className="text-xs text-red-500 ml-1">↑ Q{preview.droppedIndex + 1} dropped (N-1 rule)</span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">Quiz avg (after drop): <strong>{preview.quizAvg}%</strong></p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Midterm (0–100)</label>
          <input type="number" min="0" max="100" step="0.5" className="input-field"
            value={form.midtermScore}
            onChange={e => setForm(p => ({ ...p, midtermScore: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Final (0–100)</label>
          <input type="number" min="0" max="100" step="0.5" className="input-field"
            value={form.finalScore}
            onChange={e => setForm(p => ({ ...p, finalScore: e.target.value }))} />
        </div>

        {policy.hasLab && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Lab (0–100)</label>
            <input type="number" min="0" max="100" step="0.5" className="input-field"
              value={form.labScore}
              onChange={e => setForm(p => ({ ...p, labScore: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Weight breakdown */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
        <span>Quiz <strong>{preview.quizAvg}%</strong> × {(policy.quizWeight * 100).toFixed(0)}% = <strong>{(parseFloat(preview.quizAvg) * policy.quizWeight).toFixed(1)}</strong></span>
        <span>·</span>
        <span>Mid <strong>{form.midtermScore || 0}</strong> × {(policy.midtermWeight * 100).toFixed(0)}% = <strong>{((parseFloat(form.midtermScore) || 0) * policy.midtermWeight).toFixed(1)}</strong></span>
        <span>·</span>
        <span>Final <strong>{form.finalScore || 0}</strong> × {((policy.hasLab ? policy.finalWeight : policy.finalWeight + policy.labWeight) * 100).toFixed(0)}% = <strong>{((parseFloat(form.finalScore) || 0) * (policy.hasLab ? policy.finalWeight : policy.finalWeight + policy.labWeight)).toFixed(1)}</strong></span>
        {policy.hasLab && <>
          <span>·</span>
          <span>Lab <strong>{form.labScore || 0}</strong> × {(policy.labWeight * 100).toFixed(0)}% = <strong>{((parseFloat(form.labScore) || 0) * policy.labWeight).toFixed(1)}</strong></span>
        </>}
        <span className="ml-auto font-bold text-gray-700">= {preview.total}</span>
      </div>

      <div className="flex gap-3">
        <button onClick={() => save(false)} disabled={saving} className="btn-secondary text-sm py-1.5 flex-1">
          Save Draft
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="btn-primary text-sm py-1.5 flex-1 bg-green-600 hover:bg-green-700">
          {saving ? 'Saving…' : `Finalize — ${preview.letter} (${preview.total})`}
        </button>
      </div>

      {g?.isFinalized && (
        <p className="text-xs text-green-600 mt-2 text-center">✓ Grade finalized: {g.letterGrade} ({g.totalMarks})</p>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GradeManagement() {
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelected] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [policy, setPolicy]           = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const loadCourse = async (courseId) => {
    setSelected(courseId);
    const [{ data: gradeData }, { data: pol }] = await Promise.all([
      api.get(`/grades/course/${courseId}`),
      api.get(`/grades/policy/${courseId}`),
    ]);
    setEnrollments(gradeData.enrollments || []);
    setPolicy({ ...gradeData.policy, ...pol });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
        <p className="text-sm text-gray-500">Quiz N-1 rule · Real-time preview · One-click finalize</p>
      </div>

      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
        <select className="input-field max-w-sm" value={selectedCourse}
          onChange={e => loadCourse(e.target.value)}>
          <option value="">Choose course…</option>
          {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseCode} — {c.title}</option>)}
        </select>
      </div>

      {policy && selectedCourse && (
        <PolicyEditor policy={policy} onChange={setPolicy} courseId={selectedCourse} />
      )}

      {enrollments.length > 0 && policy && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{enrollments.length} Students</h2>
            <div className="flex gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 bg-red-100 rounded-full inline-block" /> Dropped quiz
              <span className="w-3 h-3 bg-green-100 rounded-full inline-block ml-2" /> Counted quiz
            </div>
          </div>
          {enrollments.map(en => (
            <GradeRow
              key={en.enrollId}
              enrollment={en}
              policy={policy}
              onSaved={() => loadCourse(selectedCourse)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
