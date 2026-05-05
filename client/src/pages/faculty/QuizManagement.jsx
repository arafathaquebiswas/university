import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const defaultQuestion = {
  type: 'mcq',
  prompt: '',
  optionsText: 'Option A, Option B',
  correctAnswer: '',
  marks: 1,
};

const emptyForm = {
  quizId: null,
  courseId: '',
  title: '',
  description: '',
  totalMarks: 10,
  duration: 20,
  scheduledAt: '',
  isPublished: true,
  questions: [{ ...defaultQuestion }],
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toPayloadQuestions = (questions) =>
  questions.map((question) => ({
    type: question.type,
    prompt: question.prompt.trim(),
    marks: Number(question.marks) || 1,
    options: question.type === 'mcq'
      ? question.optionsText.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    correctAnswer: question.correctAnswer,
  }));

const toFormQuestions = (questions = []) =>
  questions.map((question) => ({
    type: question.type,
    prompt: question.prompt,
    optionsText: Array.isArray(question.options) ? question.options.join(', ') : '',
    correctAnswer: question.correctAnswer || '',
    marks: question.marks || 1,
  }));

export default function QuizManagement() {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradingId, setGradingId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [facultyId, setFacultyId] = useState(null);

  const loadData = async (fid) => {
    const [coursesRes, quizzesRes] = await Promise.all([
      api.get(`/courses/faculty/${fid}`),
      api.get(`/quizzes/faculty/${fid}`),
    ]);
    setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me');
        const fid = me.data.facultyProfile?.facultyId;
        if (!fid) {
          toast.error('Faculty profile not found');
          setLoading(false);
          return;
        }
        setFacultyId(fid);
        await loadData(fid);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load quiz dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    if (!facultyId) return;
    await loadData(facultyId);
  };

  const resetForm = () => setForm(emptyForm);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((quiz) =>
      [quiz.title, quiz.description, quiz.course?.courseCode, quiz.course?.title]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q))
    );
  }, [quizzes, search]);

  const statusBadge = (quiz) => {
    const closed = quiz.scheduledAt && new Date(quiz.scheduledAt).getTime() < Date.now();
    if (!quiz.isPublished) return 'badge-yellow';
    if (closed) return 'badge-red';
    return 'badge-green';
  };

  const statusText = (quiz) => {
    const closed = quiz.scheduledAt && new Date(quiz.scheduledAt).getTime() < Date.now();
    if (!quiz.isPublished) return 'Draft';
    if (closed) return 'Closed';
    return 'Published';
  };

  const addQuestion = () => {
    setForm((prev) => ({ ...prev, questions: [...prev.questions, { ...defaultQuestion }] }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const updateQuestion = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => (idx === index ? { ...question, ...patch } : question)),
    }));
  };

  const validateForm = () => {
    if (!form.courseId) return 'Please select a course';
    if (!form.title.trim()) return 'Quiz title is required';
    if (!form.scheduledAt) return 'Deadline is required';
    if (!form.questions.length) return 'Add at least one question';
    for (const question of form.questions) {
      if (!question.prompt.trim()) return 'Each question needs prompt text';
      if (!question.marks || Number(question.marks) <= 0) return 'Question marks must be positive';
      if (question.type === 'mcq') {
        const options = question.optionsText.split(',').map((item) => item.trim()).filter(Boolean);
        if (options.length < 2) return 'MCQ must have at least 2 options';
        if (!question.correctAnswer.trim()) return 'MCQ must include the correct answer';
      }
      if (question.type === 'true_false' && !['true', 'false'].includes(question.correctAnswer.trim().toLowerCase())) {
        return 'True/False answer must be true or false';
      }
    }
    return null;
  };

  const handleSaveQuiz = async (event) => {
    event.preventDefault();
    const errorMessage = validateForm();
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        courseId: Number(form.courseId),
        title: form.title.trim(),
        description: form.description.trim(),
        totalMarks: Number(form.totalMarks),
        duration: Number(form.duration),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        isPublished: form.isPublished,
        questions: toPayloadQuestions(form.questions),
      };

      if (form.quizId) {
        await api.put(`/quizzes/${form.quizId}`, payload);
        toast.success('Quiz updated');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz created');
      }

      await refresh();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuiz = async (quizId) => {
    try {
      const { data } = await api.get(`/quizzes/${quizId}`);
      setForm({
        quizId: data.quizId,
        courseId: String(data.courseId),
        title: data.title || '',
        description: data.description || '',
        totalMarks: data.totalMarks || 10,
        duration: data.duration || 20,
        scheduledAt: toInputDateTime(data.scheduledAt),
        isPublished: !!data.isPublished,
        questions: toFormQuestions(data.questions || []),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz and all submissions?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted');
      if (selectedQuizId === quizId) {
        setSelectedQuizId(null);
        setSubmissions([]);
      }
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete quiz');
    }
  };

  const loadSubmissions = async (quizId) => {
    setSelectedQuizId(quizId);
    setSubLoading(true);
    try {
      const { data } = await api.get(`/quizzes/${quizId}/submissions`);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setSubLoading(false);
    }
  };

  const handleManualGrade = async (attempt) => {
    const manualRows = (attempt.resultBreakdown || []).filter((row) => row.requiresManual);
    if (!manualRows.length) {
      toast('No manual grading needed for this attempt');
      return;
    }

    const scores = [];
    for (const row of manualRows) {
      const input = window.prompt(
        `Marks for question: "${row.prompt}"\nMax: ${row.maxMarks}`,
        String(row.awardedMarks || 0)
      );
      if (input === null) return;
      const value = Number(input);
      if (!Number.isFinite(value) || value < 0 || value > Number(row.maxMarks)) {
        toast.error('Invalid marks entered. Grading cancelled.');
        return;
      }
      scores.push({ questionId: row.questionId, awardedMarks: value });
    }

    try {
      setGradingId(attempt.attemptId);
      await api.put(`/quizzes/attempts/${attempt.attemptId}/grade`, { manualScores: scores });
      toast.success('Attempt graded');
      await loadSubmissions(selectedQuizId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to grade attempt');
    } finally {
      setGradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Quiz Management</h1>
          <p className="text-sm text-gray-500">Create, schedule, grade and track quiz performance.</p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={resetForm}>New Quiz Form</button>
      </div>

      <form onSubmit={handleSaveQuiz} className="card space-y-4">
        <h2 className="text-lg font-semibold">{form.quizId ? 'Edit Quiz' : 'Create Quiz'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Course</label>
            <select
              className="input-field"
              value={form.courseId}
              onChange={(event) => setForm((prev) => ({ ...prev, courseId: event.target.value }))}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseCode} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Quiz Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g. Quiz 2 - Data Structures"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deadline</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.scheduledAt}
              onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="5"
              className="input-field"
              value={form.duration}
              onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Total Marks</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.totalMarks}
              onChange={(event) => setForm((prev) => ({ ...prev, totalMarks: event.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-7">
            <input
              id="publish-quiz"
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
            />
            <label htmlFor="publish-quiz" className="text-sm text-gray-700">Publish immediately</label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
          <textarea
            className="input-field min-h-20"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Instructions, grading rules, allowed attempts..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Questions</h3>
            <button type="button" className="btn-secondary text-sm py-1.5" onClick={addQuestion}>Add Question</button>
          </div>

          {form.questions.map((question, index) => (
            <div key={index} className="border rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Question {index + 1}</p>
                {form.questions.length > 1 && (
                  <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeQuestion(index)}>
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                  <select
                    className="input-field"
                    value={question.type}
                    onChange={(event) => updateQuestion(index, { type: event.target.value })}
                  >
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True / False</option>
                    <option value="short">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={question.marks}
                    onChange={(event) => updateQuestion(index, { marks: event.target.value })}
                  />
                </div>
                {question.type === 'mcq' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Options</label>
                    <input
                      className="input-field"
                      value={question.optionsText}
                      onChange={(event) => updateQuestion(index, { optionsText: event.target.value })}
                      placeholder="Option A, Option B, Option C"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Prompt</label>
                <textarea
                  className="input-field min-h-16"
                  value={question.prompt}
                  onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                  placeholder="Enter the question text"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Correct Answer</label>
                <input
                  className="input-field"
                  value={question.correctAnswer}
                  onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })}
                  placeholder={question.type === 'short' ? 'Reference answer for review' : 'Exact answer'}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : form.quizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
          {form.quizId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Quiz Library</h2>
          <input
            className="input-field max-w-sm"
            placeholder="Search by title, course, description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredQuizzes.length === 0 ? (
          <p className="text-sm text-gray-400">No quizzes found.</p>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.quizId} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge-blue">{quiz.course?.courseCode}</span>
                    <span className={statusBadge(quiz)}>{statusText(quiz)}</span>
                    <span className="badge-gray">{quiz.questionCount || 0} questions</span>
                  </div>
                  <p className="font-semibold text-gray-900">{quiz.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{quiz.description || 'No description'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Deadline: {quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleString() : 'Not set'} · {quiz.totalMarks} marks · {quiz.duration || 0} mins
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button type="button" className="btn-secondary text-sm py-1.5" onClick={() => handleEditQuiz(quiz.quizId)}>
                    Edit
                  </button>
                  <button type="button" className="btn-secondary text-sm py-1.5" onClick={() => loadSubmissions(quiz.quizId)}>
                    Submissions
                  </button>
                  <button type="button" className="btn-danger text-sm py-1.5" onClick={() => handleDeleteQuiz(quiz.quizId)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedQuizId && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Submissions</h2>
            <button type="button" className="btn-secondary text-sm py-1.5" onClick={() => loadSubmissions(selectedQuizId)}>
              Refresh
            </button>
          </div>

          {subLoading ? (
            <p className="text-sm text-gray-500">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-gray-400">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((attempt) => (
                <div key={attempt.attemptId} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{attempt.student?.user?.username || 'Student'}</p>
                    <p className="text-xs text-gray-500">{attempt.student?.user?.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{attempt.obtainedMarks} / {attempt.totalMarks}</p>
                    <p className={`text-xs ${attempt.status === 'graded' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {attempt.status === 'graded' ? 'Graded' : 'Needs review'}
                    </p>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline mt-1"
                      disabled={gradingId === attempt.attemptId}
                      onClick={() => handleManualGrade(attempt)}
                    >
                      {gradingId === attempt.attemptId ? 'Grading...' : 'Manual Grade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
