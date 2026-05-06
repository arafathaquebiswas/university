import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const COURSE_FEE = 20000;

const FIXED_FEES = {
  semesterFee: 10000,
};

const FACULTY_PAYMENT_PER_COURSE = 50000;

export default function GenerateInvoice() {
  const [section, setSection] = useState('student');

  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [mode, setMode] = useState('auto');
  const [courses, setCourses] = useState([]);
  const [facultyCourses, setFacultyCourses] = useState([]);

  const [scholarship, setScholarship] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    type: 'tuition',
    semester: 'Spring 2026',
    dueDate: '',
    description: '',
  });

  const [facultyForm, setFacultyForm] = useState({
    facultyId: '',
    paymentDate: '',
    semester: 'Spring 2026',
  });

  useEffect(() => {
    api
      .get('/users', { params: { role: 'student', limit: 100 } })
      .then((res) => setStudents(res.data.users || []))
      .catch(() => toast.error('Failed to load students'));

    api
      .get('/users', { params: { role: 'faculty', limit: 100 } })
      .then((res) => setFaculties(res.data.users || []))
      .catch(() => toast.error('Failed to load faculties'));
  }, []);

  useEffect(() => {
    if (form.studentId) {
      fetchScholarship();
    } else {
      setScholarship(null);
    }
  }, [form.studentId]);

  useEffect(() => {
    if (mode === 'auto' && form.studentId) {
      fetchCourses();
    }
  }, [form.studentId, mode]);

  const getStudentId = (student) => {
    return student.studentProfile?.studentId || student.studentId || '';
  };

  const getFacultyId = (faculty) => {
    return faculty.facultyProfile?.facultyId || faculty.facultyId || '';
  };

  const selectedStudent = students.find(
    (s) => String(getStudentId(s)) === String(form.studentId)
  );

  const fetchScholarship = async () => {
    try {
      const res = await api.get(`/finance/student/${form.studentId}`);
      const data = res.data || {};

      const scholarshipAmount = Number(
        data.scholarshipTotal || data.summary?.scholarshipTotal || 0
      );

      if (scholarshipAmount > 0) {
        setScholarship({
          name: 'Applied Scholarship',
          amount: scholarshipAmount,
        });
      } else {
        setScholarship(null);
      }
    } catch {
      setScholarship(null);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);

      const res = await api.get(`/enrollments/student/${form.studentId}`);
      const enrollments = res.data || [];

      const courseResponses = await Promise.all(
        enrollments.map((enrollment) => api.get(`/courses/${enrollment.courseId}`))
      );

      const formattedCourses = courseResponses.map((response) => {
        const course = response.data;

        return {
          id: course.courseId,
          code: course.courseCode,
          title: course.title,
          credits: course.credits || 3,
          fee: COURSE_FEE,
        };
      });

      setCourses(formattedCourses);
    } catch (err) {
      console.error('Failed to load courses:', err.response?.data || err.message);
      setCourses([]);
      toast.error('Failed to load enrolled courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchFacultyPayment = async (facultyId) => {
    if (!facultyId) {
      setSelectedFaculty(null);
      setFacultyCourses([]);
      return;
    }

    try {
      setLoadingFaculty(true);

      const res = await api.get(`/finance/faculty/${facultyId}`);
      setSelectedFaculty(res.data.faculty || null);
      setFacultyCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load faculty payment:', err.response?.data || err.message);
      toast.error('Failed to load faculty payment');
      setSelectedFaculty(null);
      setFacultyCourses([]);
    } finally {
      setLoadingFaculty(false);
    }
  };

  const courseTotal = courses.reduce((sum, course) => {
    return sum + Number(course.fee || 0);
  }, 0);

  const fixedFeeTotal = FIXED_FEES.semesterFee;

  const autoTotalBeforeScholarship = courseTotal + fixedFeeTotal;

  const scholarshipDiscount = scholarship?.amount
    ? Math.min(Number(scholarship.amount), autoTotalBeforeScholarship)
    : 0;

  const autoFinalTotal = Math.max(
    0,
    autoTotalBeforeScholarship - scholarshipDiscount
  );

  const facultyTotal = facultyCourses.length * FACULTY_PAYMENT_PER_COURSE;

  const generateStudentPDF = (items, totalAmount, invoiceType, discountAmount = 0) => {
    const doc = new jsPDF();

    const invoiceNo = `INV-${Date.now()}`;
    const issueDate = new Date().toISOString().slice(0, 10);

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BRACU Portal', 20, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Accounts Office', 20, 26);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 160, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Invoice No: ${invoiceNo}`, 140, 48);
    doc.text(`Issue Date: ${issueDate}`, 140, 55);
    doc.text(`Due Date: ${form.dueDate || 'N/A'}`, 140, 62);
    doc.text(`Invoice Type: ${invoiceType}`, 140, 69);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 20, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${selectedStudent?.username || 'N/A'}`, 20, 58);
    doc.text(`Email: ${selectedStudent?.email || 'N/A'}`, 20, 65);
    doc.text(`Student ID: ${form.studentId}`, 20, 72);
    doc.text(`Semester: ${form.semester || 'N/A'}`, 20, 79);

    let y = 95;

    doc.setFillColor(243, 244, 246);
    doc.rect(20, y, 170, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', 25, y + 8);
    doc.text('Type', 115, y + 8);
    doc.text('Amount', 160, y + 8);

    y += 22;
    doc.setFont('helvetica', 'normal');

    items.forEach((item) => {
      if (y > 245) {
        doc.addPage();
        y = 25;
      }

      doc.text(String(item.description || 'N/A'), 25, y);
      doc.text(String(item.type || 'Fee'), 115, y);
      doc.text(`BDT ${Number(item.amount || 0).toLocaleString()}`, 160, y);

      y += 10;
    });

    if (discountAmount > 0) {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.text('Applied Scholarship', 25, y);
      doc.text('Discount', 115, y);
      doc.text(`- BDT ${Number(discountAmount).toLocaleString()}`, 160, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
    }

    doc.line(20, y, 190, y);
    y += 18;

    doc.setFillColor(239, 246, 255);
    doc.rect(125, y, 65, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Amount', 132, y + 11);

    doc.setFontSize(16);
    doc.text(`BDT ${Number(totalAmount).toLocaleString()}`, 132, y + 22);

    doc.setFillColor(254, 243, 199);
    doc.rect(20, y, 60, 16, 'F');

    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14);
    doc.text('STATUS: UNPAID', 27, y + 10);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Instructions:', 20, 245);
    doc.text('Please complete payment before the due date to avoid penalties.', 20, 253);

    doc.line(20, 270, 190, 270);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('This invoice was generated electronically by BRACU Portal.', 20, 278);
    doc.text('Thank you.', 20, 284);

    doc.save(`invoice-${form.studentId}.pdf`);
  };

  const generateFacultyPDF = () => {
    const doc = new jsPDF();

    const paymentNo = `FAC-PAY-${Date.now()}`;
    const issueDate = new Date().toISOString().slice(0, 10);

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BRACU Portal', 20, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Accounts Office', 20, 26);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACULTY PAYMENT', 125, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Payment No: ${paymentNo}`, 135, 48);
    doc.text(`Issue Date: ${issueDate}`, 135, 55);
    doc.text(`Payment Date: ${facultyForm.paymentDate || 'N/A'}`, 135, 62);
    doc.text(`Semester: ${facultyForm.semester || 'N/A'}`, 135, 69);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Pay To', 20, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${selectedFaculty?.user?.username || 'N/A'}`, 20, 58);
    doc.text(`Email: ${selectedFaculty?.user?.email || 'N/A'}`, 20, 65);
    doc.text(`Faculty ID: ${facultyForm.facultyId}`, 20, 72);
    doc.text(`Designation: ${selectedFaculty?.designation || 'N/A'}`, 20, 79);

    let y = 95;

    doc.setFillColor(243, 244, 246);
    doc.rect(20, y, 170, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Course', 25, y + 8);
    doc.text('Type', 115, y + 8);
    doc.text('Amount', 160, y + 8);

    y += 22;
    doc.setFont('helvetica', 'normal');

    facultyCourses.forEach((course) => {
      if (y > 245) {
        doc.addPage();
        y = 25;
      }

      doc.text(`${course.courseCode} - ${course.title}`, 25, y);
      doc.text('Teaching Payment', 115, y);
      doc.text(`BDT ${FACULTY_PAYMENT_PER_COURSE.toLocaleString()}`, 160, y);

      y += 10;
    });

    doc.line(20, y, 190, y);
    y += 18;

    doc.setFillColor(239, 246, 255);
    doc.rect(125, y, 65, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Payment', 132, y + 11);

    doc.setFontSize(16);
    doc.text(`BDT ${facultyTotal.toLocaleString()}`, 132, y + 22);

    doc.setFillColor(220, 252, 231);
    doc.rect(20, y, 70, 16, 'F');

    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text('PAYMENT: GENERATED', 27, y + 10);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Note:', 20, 245);
    doc.text('Faculty payment is calculated at BDT 50,000 per assigned course.', 20, 253);

    doc.line(20, 270, 190, 270);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('This faculty payment document was generated electronically by BRACU Portal.', 20, 278);

    doc.save(`faculty-payment-${facultyForm.facultyId}.pdf`);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    if (!form.studentId) return toast.error('Please select a student');
    if (!form.dueDate) return toast.error('Please select a due date');

    setLoading(true);

    try {
      let items = [];
      let totalAmount = 0;
      let discountAmount = 0;
      const invoiceType = mode === 'auto' ? 'Automatic' : 'Manual';

      if (mode === 'auto') {
        items = [
          ...courses.map((course) => ({
            description: `${course.code} - ${course.title}`,
            type: 'Course Fee',
            amount: course.fee,
          })),
          {
            description: 'Semester Registration Fee',
            type: 'Semester Fee',
            amount: FIXED_FEES.semesterFee,
          },
        ];

        discountAmount = scholarshipDiscount;
        totalAmount = autoFinalTotal;
      } else {
        if (!form.amount) {
          setLoading(false);
          return toast.error('Please enter amount');
        }

        items = [
          {
            description: form.description || form.type.replace('_', ' '),
            type: form.type.replace('_', ' '),
            amount: Number(form.amount),
          },
        ];

        totalAmount = Number(form.amount);
      }

      await api.post('/finance/invoices', {
        studentId: form.studentId,
        amount: totalAmount,
        type: mode === 'auto' ? 'tuition' : form.type,
        semester: form.semester,
        dueDate: form.dueDate,
        description:
          mode === 'auto'
            ? `${form.semester} full semester invoice. Scholarship discount: BDT ${discountAmount}`
            : form.description || form.type.replace('_', ' '),
      });

      generateStudentPDF(items, totalAmount, invoiceType, discountAmount);
      toast.success('Invoice generated and PDF downloaded!');
    } catch (err) {
      console.error('Invoice error:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();

    if (!facultyForm.facultyId) return toast.error('Please select a faculty');
    if (!facultyForm.paymentDate) return toast.error('Please select payment date');
    if (facultyCourses.length === 0) return toast.error('No assigned courses found');

    generateFacultyPDF();
    toast.success('Faculty Payment PDF generated!');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Generate Invoice</h1>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSection('student')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            section === 'student'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Student Invoice
        </button>

        <button
          type="button"
          onClick={() => setSection('faculty')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            section === 'faculty'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Faculty Payment
        </button>
      </div>

      {section === 'student' && (
        <div className="card">
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  mode === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Auto Invoice
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  mode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Manual Invoice
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>

              <select
                className="input-field"
                value={form.studentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, studentId: e.target.value }))
                }
                required
              >
                <option value="">Select student</option>

                {students.map((student) => {
                  const studentId = getStudentId(student);

                  return (
                    <option key={student.userId || studentId} value={studentId}>
                      {student.username} — {student.email}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-field"
                placeholder="Semester"
                value={form.semester}
                onChange={(e) =>
                  setForm((p) => ({ ...p, semester: e.target.value }))
                }
              />

              <input
                type="date"
                className="input-field"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                required
              />
            </div>

            {mode === 'auto' && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h2 className="font-semibold text-gray-900">Auto Invoice Preview</h2>

                {loadingCourses ? (
                  <p className="text-sm text-gray-500">Loading enrolled courses...</p>
                ) : (
                  <>
                    {courses.map((course, index) => (
                      <div
                        key={`${course.code}-${index}`}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {course.code} - {course.title}
                        </span>
                        <span>BDT {Number(course.fee).toLocaleString()}</span>
                      </div>
                    ))}

                    <hr />

                    <div className="flex justify-between text-sm">
                      <span>Semester Registration Fee</span>
                      <span>BDT {FIXED_FEES.semesterFee.toLocaleString()}</span>
                    </div>

                    <hr />

                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>BDT {autoTotalBeforeScholarship.toLocaleString()}</span>
                    </div>

                    {scholarshipDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-700 font-semibold">
                        <span>Applied Scholarship</span>
                        <span>- BDT {scholarshipDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold">
                      <span>Final Total</span>
                      <span>BDT {autoFinalTotal.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {mode === 'manual' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="input-field"
                    value={form.type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, type: e.target.value }))
                    }
                  >
                    {['tuition', 'library_fee', 'lab_fee', 'fine'].map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="input-field"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </div>

                <input
                  className="input-field"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading || loadingCourses}
              className="btn-primary w-full py-2.5"
            >
              {loading ? 'Generating…' : 'Generate Invoice'}
            </button>
          </form>
        </div>
      )}

      {section === 'faculty' && (
        <div className="card">
          <form onSubmit={handleFacultySubmit} className="space-y-4">
            <h2 className="font-semibold text-gray-900">Faculty Payment</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty *
              </label>

              <select
                className="input-field"
                value={facultyForm.facultyId}
                onChange={(e) => {
                  const facultyId = e.target.value;
                  setFacultyForm((p) => ({ ...p, facultyId }));
                  fetchFacultyPayment(facultyId);
                }}
                required
              >
                <option value="">Select faculty</option>

                {faculties.map((faculty) => {
                  const facultyId = getFacultyId(faculty);

                  return (
                    <option key={faculty.userId || facultyId} value={facultyId}>
                      {faculty.username} — {faculty.email}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-field"
                placeholder="Semester"
                value={facultyForm.semester}
                onChange={(e) =>
                  setFacultyForm((p) => ({ ...p, semester: e.target.value }))
                }
              />

              <input
                type="date"
                className="input-field"
                value={facultyForm.paymentDate}
                onChange={(e) =>
                  setFacultyForm((p) => ({ ...p, paymentDate: e.target.value }))
                }
                required
              />
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="font-semibold text-gray-900">Faculty Payment Preview</h3>

              {loadingFaculty ? (
                <p className="text-sm text-gray-500">Loading assigned courses...</p>
              ) : (
                <>
                  {facultyCourses.length === 0 ? (
                    <p className="text-sm text-red-500">
                      No assigned courses found for this faculty.
                    </p>
                  ) : (
                    facultyCourses.map((course) => (
                      <div key={course.courseId} className="flex justify-between text-sm">
                        <span>
                          {course.courseCode} - {course.title}
                        </span>
                        <span>BDT {FACULTY_PAYMENT_PER_COURSE.toLocaleString()}</span>
                      </div>
                    ))
                  )}

                  <hr />

                  <div className="flex justify-between text-sm">
                    <span>Per Course Payment</span>
                    <span>BDT {FACULTY_PAYMENT_PER_COURSE.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Total Courses</span>
                    <span>{facultyCourses.length}</span>
                  </div>

                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total Faculty Payment</span>
                    <span>BDT {facultyTotal.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loadingFaculty}
              className="btn-primary w-full py-2.5"
            >
              Generate Faculty Payment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}