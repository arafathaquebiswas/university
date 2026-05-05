const router = require('express').Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  Quiz,
  QuizSubmission,
  QuizQuestion,
  QuizAttempt,
  Course,
  Enrollment,
  Student,
  Faculty,
  User,
} = require('../models');

const normalize = (value) => String(value || '').trim().toLowerCase();

const isFacultyOwner = async (user, courseId) => {
  if (user.role === 'admin') return true;
  if (user.role !== 'faculty') return false;
  const faculty = await Faculty.findOne({ where: { userId: user.userId } });
  if (!faculty) return false;
  const course = await Course.findByPk(courseId);
  return !!course && Number(course.facultyId) === Number(faculty.facultyId);
};

const validateQuestions = (questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'At least one question is required';
  }
  for (const question of questions) {
    if (!question.prompt || !String(question.prompt).trim()) return 'Each question needs prompt text';
    if (!['mcq', 'short', 'true_false'].includes(question.type)) return 'Invalid question type';
    if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) return 'Question marks must be positive';
    if (question.type === 'mcq') {
      if (!Array.isArray(question.options) || question.options.length < 2) return 'MCQ needs at least two options';
      if (!question.correctAnswer || !String(question.correctAnswer).trim()) return 'MCQ needs a correct answer';
    }
    if (question.type === 'true_false') {
      const answer = normalize(question.correctAnswer);
      if (!['true', 'false'].includes(answer)) return 'True/False answer must be true or false';
    }
  }
  return null;
};

const buildQuestionPayload = (questions = []) =>
  questions.map((question, index) => ({
    type: question.type,
    prompt: String(question.prompt).trim(),
    options: question.type === 'mcq' ? question.options.map((opt) => String(opt).trim()) : [],
    correctAnswer: question.correctAnswer != null ? String(question.correctAnswer).trim() : null,
    marks: Number(question.marks),
    questionOrder: index + 1,
  }));

const sanitizeQuestionForStudent = (question, includeSolution) => ({
  questionId: question.questionId,
  type: question.type,
  prompt: question.prompt,
  options: question.options || [],
  marks: question.marks,
  questionOrder: question.questionOrder,
  ...(includeSolution ? { correctAnswer: question.correctAnswer } : {}),
});

router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const includeQuestions = req.query.includeQuestions === '1';
    const quizzes = await Quiz.findAll({
      where: { courseId: req.params.courseId },
      include: includeQuestions ? [{ association: 'questions' }] : [],
      order: [['scheduledAt', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

router.get('/faculty/:facultyId', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ where: { userId: req.user.userId } });
      if (!faculty || Number(faculty.facultyId) !== Number(req.params.facultyId)) {
        return res.status(403).json({ error: 'Forbidden: cannot view other faculty quizzes' });
      }
    }

    const courses = await Course.findAll({
      where: { facultyId: req.params.facultyId },
      include: [{ association: 'quizzes', include: [{ association: 'questions' }] }],
      order: [['createdAt', 'DESC']],
    });

    const quizzes = courses.flatMap((course) =>
      (course.quizzes || []).map((quiz) => ({
        ...quiz.toJSON(),
        questionCount: (quiz.questions || []).length,
        course: {
          courseId: course.courseId,
          courseCode: course.courseCode,
          title: course.title,
          credits: course.credits,
        },
      }))
    );

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load faculty quizzes' });
  }
});

router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const enrollments = await Enrollment.findAll({ where: { studentId: student.studentId } });
    const courseIds = enrollments.map((enrollment) => enrollment.courseId);
    if (courseIds.length === 0) return res.json([]);

    const quizzes = await Quiz.findAll({
      where: { courseId: { [Op.in]: courseIds } },
      order: [['scheduledAt', 'ASC'], ['createdAt', 'DESC']],
      include: [{ association: 'course' }, { association: 'questions' }],
    });

    const now = Date.now();
    res.json(quizzes.map((quiz) => ({
      ...quiz.toJSON(),
      questionCount: (quiz.questions || []).length,
      isClosed: quiz.scheduledAt ? new Date(quiz.scheduledAt).getTime() < now : false,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load quiz portal' });
  }
});

router.get('/my/attempts', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const attempts = await QuizAttempt.findAll({
      where: { studentId: student.studentId },
      include: [{
        association: 'quiz',
        include: [{ association: 'course' }, { association: 'questions' }],
      }],
      order: [['submittedAt', 'DESC']],
    });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load attempts' });
  }
});

router.get('/:quizId', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId, {
      include: [{ association: 'course' }, { association: 'questions' }],
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let includeSolution = false;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.userId } });
      if (!student) return res.status(404).json({ error: 'Student profile not found' });

      const enrolled = await Enrollment.findOne({
        where: {
          studentId: student.studentId,
          courseId: quiz.courseId,
          status: { [Op.notIn]: ['dropped', 'withdrawn'] },
        },
      });
      if (!enrolled) return res.status(403).json({ error: 'You are not enrolled in this course' });

      const attempt = await QuizAttempt.findOne({ where: { quizId: quiz.quizId, studentId: student.studentId } });
      includeSolution = !!attempt;
    }

    const payload = quiz.toJSON();
    payload.questions = (payload.questions || [])
      .sort((a, b) => a.questionOrder - b.questionOrder)
      .map((question) =>
        req.user.role === 'faculty' || req.user.role === 'admin'
          ? question
          : sanitizeQuestionForStudent(question, includeSolution)
      );

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load quiz details' });
  }
});

router.post('/', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      totalMarks = 10,
      duration,
      scheduledAt,
      isPublished = false,
      questions = [],
    } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId and title are required' });
    }

    const ownsCourse = await isFacultyOwner(req.user, courseId);
    if (!ownsCourse) return res.status(403).json({ error: 'Forbidden: cannot manage this course' });

    const validationError = validateQuestions(questions);
    if (validationError) return res.status(400).json({ error: validationError });

    const quiz = await Quiz.create({
      courseId,
      title,
      description,
      totalMarks,
      duration,
      scheduledAt,
      isPublished,
    });

    const questionRows = buildQuestionPayload(questions).map((question) => ({ ...question, quizId: quiz.quizId }));
    await QuizQuestion.bulkCreate(questionRows);

    const created = await Quiz.findByPk(quiz.quizId, { include: [{ association: 'questions' }, { association: 'course' }] });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

router.put('/:quizId', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId, { include: [{ association: 'questions' }] });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const ownsCourse = await isFacultyOwner(req.user, quiz.courseId);
    if (!ownsCourse) return res.status(403).json({ error: 'Forbidden: cannot edit this quiz' });

    const {
      title,
      description,
      totalMarks,
      duration,
      scheduledAt,
      isPublished,
      questions,
    } = req.body;

    const payload = {};
    if (title !== undefined) payload.title = title;
    if (description !== undefined) payload.description = description;
    if (totalMarks !== undefined) payload.totalMarks = totalMarks;
    if (duration !== undefined) payload.duration = duration;
    if (scheduledAt !== undefined) payload.scheduledAt = scheduledAt;
    if (isPublished !== undefined) payload.isPublished = isPublished;

    await quiz.update(payload);

    if (Array.isArray(questions)) {
      const validationError = validateQuestions(questions);
      if (validationError) return res.status(400).json({ error: validationError });
      await QuizQuestion.destroy({ where: { quizId: quiz.quizId } });
      const questionRows = buildQuestionPayload(questions).map((question) => ({ ...question, quizId: quiz.quizId }));
      await QuizQuestion.bulkCreate(questionRows);
    }

    const updated = await Quiz.findByPk(quiz.quizId, { include: [{ association: 'questions' }, { association: 'course' }] });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

router.delete('/:quizId', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const ownsCourse = await isFacultyOwner(req.user, quiz.courseId);
    if (!ownsCourse) return res.status(403).json({ error: 'Forbidden: cannot delete this quiz' });

    await QuizQuestion.destroy({ where: { quizId: quiz.quizId } });
    await QuizAttempt.destroy({ where: { quizId: quiz.quizId } });
    await QuizSubmission.destroy({ where: { quizId: quiz.quizId } });
    await quiz.destroy();
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

router.post('/:quizId/attempt', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const quiz = await Quiz.findByPk(req.params.quizId, { include: [{ association: 'questions' }, { association: 'course' }] });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const enrolled = await Enrollment.findOne({
      where: {
        studentId: student.studentId,
        courseId: quiz.courseId,
        status: { [Op.notIn]: ['dropped', 'withdrawn'] },
      },
    });
    if (!enrolled) return res.status(403).json({ error: 'You are not enrolled in this course' });

    if (quiz.scheduledAt && new Date(quiz.scheduledAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Deadline passed. Quiz is closed.' });
    }

    const existing = await QuizAttempt.findOne({ where: { quizId: quiz.quizId, studentId: student.studentId } });
    if (existing) return res.status(409).json({ error: 'Quiz already submitted' });

    const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(submittedAnswers.map((item) => [Number(item.questionId), item.answer]));

    let autoMarks = 0;
    let manualMarks = 0;
    const resultBreakdown = (quiz.questions || [])
      .sort((a, b) => a.questionOrder - b.questionOrder)
      .map((question) => {
        const studentAnswer = answerMap.get(Number(question.questionId));
        const maxMarks = Number(question.marks || 0);
        let awardedMarks = 0;
        let requiresManual = false;

        if (question.type === 'mcq' || question.type === 'true_false') {
          if (normalize(studentAnswer) === normalize(question.correctAnswer)) {
            awardedMarks = maxMarks;
          }
          autoMarks += awardedMarks;
        } else {
          requiresManual = true;
          manualMarks += 0;
        }

        return {
          questionId: question.questionId,
          type: question.type,
          prompt: question.prompt,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          maxMarks,
          awardedMarks,
          requiresManual,
        };
      });

    const totalMarks = Number(quiz.totalMarks || resultBreakdown.reduce((sum, row) => sum + row.maxMarks, 0));
    const obtainedMarks = autoMarks + manualMarks;
    const requiresManualReview = resultBreakdown.some((row) => row.requiresManual);

    const attempt = await QuizAttempt.create({
      quizId: quiz.quizId,
      studentId: student.studentId,
      answers: submittedAnswers,
      resultBreakdown,
      autoMarks,
      manualMarks,
      obtainedMarks,
      totalMarks,
      status: requiresManualReview ? 'submitted' : 'graded',
      submittedAt: new Date(),
      gradedAt: requiresManualReview ? null : new Date(),
    });

    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

router.get('/:quizId/submissions', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const ownsCourse = await isFacultyOwner(req.user, quiz.courseId);
    if (!ownsCourse) return res.status(403).json({ error: 'Forbidden: cannot view these submissions' });

    const submissions = await QuizAttempt.findAll({
      where: { quizId: req.params.quizId },
      include: [{ association: 'student', include: [{ association: 'user', attributes: ['userId', 'username', 'email'] }] }],
      order: [['submittedAt', 'DESC']],
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load submissions' });
  }
});

router.put('/attempts/:attemptId/grade', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByPk(req.params.attemptId, {
      include: [{ association: 'quiz', include: [{ association: 'questions' }] }],
    });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    const ownsCourse = await isFacultyOwner(req.user, attempt.quiz.courseId);
    if (!ownsCourse) return res.status(403).json({ error: 'Forbidden: cannot grade this attempt' });

    const manualMarksByQuestion = new Map(
      (Array.isArray(req.body.manualScores) ? req.body.manualScores : [])
        .map((row) => [Number(row.questionId), Number(row.awardedMarks || 0)])
    );

    const updatedBreakdown = (attempt.resultBreakdown || []).map((row) => {
      if (!row.requiresManual) return row;
      const capped = Math.max(0, Math.min(Number(row.maxMarks || 0), manualMarksByQuestion.get(Number(row.questionId)) || 0));
      return { ...row, awardedMarks: capped };
    });

    const autoMarks = updatedBreakdown
      .filter((row) => !row.requiresManual)
      .reduce((sum, row) => sum + Number(row.awardedMarks || 0), 0);
    const manualMarks = updatedBreakdown
      .filter((row) => row.requiresManual)
      .reduce((sum, row) => sum + Number(row.awardedMarks || 0), 0);

    const obtainedMarks = autoMarks + manualMarks;

    await attempt.update({
      resultBreakdown: updatedBreakdown,
      autoMarks,
      manualMarks,
      obtainedMarks,
      status: 'graded',
      gradedAt: new Date(),
      gradedBy: req.user.userId,
    });

    const refreshed = await QuizAttempt.findByPk(attempt.attemptId, {
      include: [{ association: 'student', include: [{ association: 'user', attributes: ['userId', 'username', 'email'] }] }],
    });

    res.json(refreshed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade attempt' });
  }
});

module.exports = router;