import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const emptyAnswers = {};

const toAnswerMap = (answers = []) => {
  const map = {};
  answers.forEach((item) => {
    map[item.questionId] = item.answer;
  });
  return map;
};

export default function QuizPortal() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState(emptyAnswers);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [submittingQuizId, setSubmittingQuizId] = useState(null);

  const loadPortal = async () => {
    const [quizRes, attemptRes, materialRes] = await Promise.all([
      api.get('/quizzes/my'),
      api.get('/quizzes/my/attempts'),
      api.get('/materials/my'),
    ]);
    setQuizzes(Array.isArray(quizRes.data) ? quizRes.data : []);
    setAttempts(Array.isArray(attemptRes.data) ? attemptRes.data : []);
    setMaterials(Array.isArray(materialRes.data) ? materialRes.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadPortal();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load quiz portal');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((quiz) =>
      [quiz.title, quiz.description, quiz.course?.courseCode, quiz.course?.title]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q))
    );
  }, [quizzes, search]);

  const attemptedByQuiz = useMemo(() => {
    const map = new Map();
    attempts.forEach((attempt) => {
      map.set(Number(attempt.quizId), attempt);
    });
    return map;
  }, [attempts]);

  const openQuiz = async (quizId) => {
    try {
      setSaving(true);
      const { data } = await api.get(`/quizzes/${quizId}`);
      setSelectedQuiz(data);

      const existingAttempt = attemptedByQuiz.get(Number(quizId));
      if (existingAttempt) {
        setAnswers(toAnswerMap(existingAttempt.answers || []));
      } else {
        setAnswers(emptyAnswers);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load quiz details');
    } finally {
      setSaving(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;

    const questions = selectedQuiz.questions || [];
    const answerPayload = questions.map((question) => ({
      questionId: question.questionId,
      answer: answers[question.questionId] ?? '',
    }));

    for (const row of answerPayload) {
      if (!String(row.answer).trim()) {
        toast.error('Please answer all questions before submitting');
        return;
      }
    }

    try {
      setSubmittingQuizId(selectedQuiz.quizId);
      await api.post(`/quizzes/${selectedQuiz.quizId}/attempt`, { answers: answerPayload });
      toast.success('Quiz submitted');
      await loadPortal();
      await openQuiz(selectedQuiz.quizId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmittingQuizId(null);
    }
  };

  const downloadMaterial = async (materialId, originalName) => {
    try {
      const response = await api.get(`/materials/download/${materialId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.data.type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'material';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const openCount = filteredQuizzes.filter((quiz) => !quiz.isClosed).length;
  const attemptedCount = attempts.length;
  const gradedCount = attempts.filter((attempt) => attempt.status === 'graded').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Quiz Portal</h1>
        <p className="text-sm text-gray-500">Attempt quizzes, review results and access course resources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Open Quizzes</p>
          <p className="text-3xl font-black text-green-600 mt-1">{openCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{attemptedCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Graded</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{gradedCount}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Available Quizzes</h2>
          <input
            className="input-field max-w-sm"
            placeholder="Search quiz by title or course"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredQuizzes.length === 0 ? (
          <p className="text-sm text-gray-400">No quizzes available.</p>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => {
              const attempt = attemptedByQuiz.get(Number(quiz.quizId));
              const closed = !!quiz.isClosed;
              return (
                <div key={quiz.quizId} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="badge-blue">{quiz.course?.courseCode}</span>
                      <span className={closed ? 'badge-red' : 'badge-green'}>{closed ? 'Closed' : 'Open'}</span>
                      <span className="badge-gray">{quiz.questionCount || 0} questions</span>
                      {attempt && (
                        <span className={attempt.status === 'graded' ? 'badge-green' : 'badge-yellow'}>
                          {attempt.status === 'graded' ? 'Result Ready' : 'Submitted'}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">{quiz.title}</p>
                    <p className="text-sm text-gray-500">{quiz.description || 'No instructions provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleString() : 'N/A'} · {quiz.totalMarks} marks
                    </p>
                    {attempt && (
                      <p className="text-xs text-gray-600 mt-1">
                        Score: {attempt.obtainedMarks} / {attempt.totalMarks}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary text-sm py-1.5"
                    onClick={() => openQuiz(quiz.quizId)}
                  >
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedQuiz && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">{selectedQuiz.title}</h2>
              <p className="text-sm text-gray-500">{selectedQuiz.course?.courseCode} · {selectedQuiz.course?.title}</p>
              <p className="text-xs text-gray-500">
                Deadline: {selectedQuiz.scheduledAt ? new Date(selectedQuiz.scheduledAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <button type="button" className="btn-secondary text-sm" onClick={() => setSelectedQuiz(null)}>
              Close
            </button>
          </div>

          <p className="text-sm text-gray-600">{selectedQuiz.description || 'No instructions available.'}</p>

          <div className="space-y-4">
            {(selectedQuiz.questions || []).sort((a, b) => a.questionOrder - b.questionOrder).map((question, index) => (
              <div key={question.questionId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-800">Q{index + 1}. {question.prompt}</p>
                  <span className="badge-blue">{question.marks} marks</span>
                </div>

                {question.type === 'mcq' && (
                  <div className="mt-3 space-y-2">
                    {(question.options || []).map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`q-${question.questionId}`}
                          checked={answers[question.questionId] === option}
                          onChange={() => setAnswers((prev) => ({ ...prev, [question.questionId]: option }))}
                          disabled={attemptedByQuiz.has(Number(selectedQuiz.quizId))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true_false' && (
                  <div className="mt-3 flex gap-3">
                    {['true', 'false'].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`q-${question.questionId}`}
                          checked={String(answers[question.questionId]).toLowerCase() === option}
                          onChange={() => setAnswers((prev) => ({ ...prev, [question.questionId]: option }))}
                          disabled={attemptedByQuiz.has(Number(selectedQuiz.quizId))}
                        />
                        {option === 'true' ? 'True' : 'False'}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'short' && (
                  <textarea
                    className="input-field mt-3 min-h-20"
                    placeholder="Write your short answer"
                    value={answers[question.questionId] || ''}
                    onChange={(event) => setAnswers((prev) => ({ ...prev, [question.questionId]: event.target.value }))}
                    disabled={attemptedByQuiz.has(Number(selectedQuiz.quizId))}
                  />
                )}

                {attemptedByQuiz.has(Number(selectedQuiz.quizId)) && question.correctAnswer && (
                  <p className="text-xs text-green-700 mt-2">
                    Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          {!attemptedByQuiz.has(Number(selectedQuiz.quizId)) ? (
            <button
              type="button"
              className="btn-primary"
              onClick={submitQuiz}
              disabled={submittingQuizId === selectedQuiz.quizId || saving}
            >
              {submittingQuizId === selectedQuiz.quizId ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              Quiz already submitted. You can now review your answers and correct solutions.
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Course Materials</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400">No materials uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <div key={material.materialId} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{material.title}</p>
                  <p className="text-xs text-gray-500">{material.originalName}</p>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => downloadMaterial(material.materialId, material.originalName)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
