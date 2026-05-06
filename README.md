# Smart University Management & Academic Portal System

A full-stack web application for BRAC University — digitizing academic, financial, and administrative operations across five user roles.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | React 18, Vite 5, Tailwind 3 |
| Backend | Node.js + Express.js (MVC) | Express 4 |
| Database | PostgreSQL + Sequelize ORM | Sequelize 6 |
| Auth | JWT + bcryptjs | 7-day tokens, 12-round hashing |
| PDF | PDFKit (server) + jsPDF (client) | — |
| Charts | Recharts | 2.10 |
| File Uploads | Multer (disk storage) | 20 MB limit |

---

## Project Structure

```
Project/
├── server/                   ← Express backend (port 5001)
│   ├── config/               ← Sequelize + PostgreSQL setup
│   ├── models/               ← 24 Sequelize models + associations
│   ├── controllers/          ← Business logic (12 controllers)
│   ├── routes/               ← API route definitions (11 route files)
│   ├── middleware/           ← JWT auth, role guard, Multer upload
│   ├── utils/
│   │   └── gradingEngine.js  ← Grading, GPA, scholarship, attendance logic
│   ├── seeders/
│   │   └── seed.js           ← Sample data (4 students, 3 faculty, 5 courses)
│   └── uploads/
│       └── materials/        ← Uploaded course files
└── client/                   ← React SPA (port 5173)
    └── src/
        ├── api/              ← Axios instance (auto-JWT + 401 logout)
        ├── context/          ← AuthContext + useAuth() hook
        ├── components/       ← Layout, Navbar, Sidebar, ProtectedRoute, StatCard
        └── pages/            ← 36 pages split by role (Student/Faculty/Admin/Accounts)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally)

### 1. Database

Create the database and configure `.env` in the `server/` directory:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=university_portal
DB_USER=<your_pg_user>
DB_PASS=<your_pg_password>
JWT_SECRET=<a_long_random_secret>
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 2. Backend

```bash
cd server
npm install
node seeders/seed.js   # seed sample data (force-syncs DB)
node server.js         # or: npx nodemon server.js
# API available at http://localhost:5001
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bracu.ac.bd` | `Admin@123` |
| Faculty | `ext.dr.hassan_cse@g.bracu.ac.bd` | `Fac@123` |
| Faculty | `ext.dr.rahman_eee@g.bracu.ac.bd` | `Fac@123` |
| Faculty | `ext.ms.sultana_cse@g.bracu.ac.bd` | `Fac@123` |
| Student | `ali.khan_20301001@g.bracu.ac.bd` | `Stu@123` |
| Student | `sara.ahmed_20301002@g.bracu.ac.bd` | `Stu@123` |
| Student | `rahim.mia_20201003@g.bracu.ac.bd` | `Stu@123` |
| Student | `nusrat.jahan_21301004@g.bracu.ac.bd` | `Stu@123` |
| Accounts Staff | `accounts.john@g.bracu.ac.bd` | `Acc@123` |

---

## Email Format & Role Detection

Registration role is **auto-detected** from the BRACU email pattern — no role dropdown needed.

| Role | Email Pattern | Example |
|---|---|---|
| Student | `name_studentid@g.bracu.ac.bd` | `ali.khan_20301001@g.bracu.ac.bd` |
| Faculty | `ext.name_dept@g.bracu.ac.bd` | `ext.dr.hassan_cse@g.bracu.ac.bd` |
| Accounts Staff | `accounts.name@g.bracu.ac.bd` | `accounts.john@g.bracu.ac.bd` |
| Library Staff | `library.name@g.bracu.ac.bd` | `library.jane@g.bracu.ac.bd` |
| Admin | `name@bracu.ac.bd` | `admin@bracu.ac.bd` |

---

## Features by Role

### Admin
- System-wide analytics dashboard with charts (Recharts)
- CRUD for departments (with merge) and academic programs
- Create and manage all user accounts across all roles
- Manage course catalog and assign faculty to courses
- Configure and manage scholarships
- Post global announcements and important dates

### Faculty
- View assigned courses and full enrollment lists
- Mark class attendance (present / absent / late / excused)
- Submit and update student grades with the grading engine (auto letter-grade + CGPA)
- Set per-course grading policy (quiz/midterm/final/lab weights)
- Create and manage quizzes (MCQ, true/false, short-answer); manually grade short-answer responses
- Upload course materials (PDF, Word, PowerPoint, images — 20 MB max)
- Post course-specific announcements

### Student
- Browse and enroll in courses (capacity-checked); drop enrolled courses
- View finalized grades, letter grades, and CGPA
- Download official grade sheet as a PDF
- Use the What-If Simulator to predict final grades before exams
- Track per-course attendance percentage
- Take published quizzes and view attempt results
- View course materials uploaded by faculty
- Pay semester fees and course fees; view invoice history
- Apply for scholarships (GPA-based eligibility check)
- Receive real-time notifications (grades, payments, attendance warnings, announcements)

### Accounts Staff
- Generate semester invoices (bulk) or individual invoices for students
- View and filter all financial records across the institution
- Mark payment records as paid; track overdue records (auto 5% fine)
- Manage scholarship disbursements and applications

---

## API Endpoints

### Auth — `/api/auth`
```
POST   /register            Auto-detect role from email, create user
POST   /login               Authenticate, receive JWT
GET    /me                  Current user profile with associations
```

### Users — `/api/users`
```
GET    /                    All users (admin, accounts_staff)
GET    /:id                 User by ID
PUT    /:id                 Update profile
DELETE /:id                 Delete user (admin)
```

### Courses — `/api/courses`
```
GET    /                    All courses
GET    /faculty/:facultyId  Courses by faculty
GET    /:id                 Course detail
POST   /                    Create course (admin, faculty)
PUT    /:id                 Update course (admin, faculty)
DELETE /:id                 Delete course (admin)
```

### Enrollments — `/api/enrollments`
```
POST   /                    Enroll in a course (student)
GET    /my                  My enrollments (student)
GET    /student/:studentId  Enrollments by student
GET    /course/:courseId    Students in a course (faculty, admin)
DELETE /:id                 Drop course
```

### Grades — `/api/grades`
```
GET    /my                        My grades + CGPA (student)
GET    /student/:studentId        Grades by student
GET    /course/:courseId          Course grades (faculty, admin)
GET    /policy/:courseId          Grading policy
GET    /scholarship/:studentId    Scholarship eligibility check
GET    /gradesheet/pdf            Download PDF grade sheet (student)
POST   /                          Submit/update marks (faculty, admin)
POST   /whatif                    What-if grade simulation
PUT    /policy/:courseId          Set grading policy (faculty, admin)
```

### Attendance — `/api/attendance`
```
POST   /                    Mark attendance for a class session (faculty)
GET    /my                  My attendance records (student)
GET    /course/:courseId    Course attendance (faculty, admin)
GET    /student/:studentId  Student attendance
```

### Quizzes — `/api/quizzes`
```
GET    /course/:courseId         Quizzes for a course
GET    /faculty/:facultyId       Faculty's quizzes (faculty, admin)
GET    /my                       Quizzes for enrolled courses (student)
GET    /my/attempts              My past attempts (student)
GET    /:quizId                  Quiz detail (answers hidden for students)
POST   /                         Create quiz with questions (faculty, admin)
PUT    /:quizId                  Update quiz (faculty, admin)
DELETE /:quizId                  Delete quiz (faculty, admin)
POST   /:quizId/attempt          Submit quiz attempt (student)
GET    /:quizId/submissions      View submissions (faculty, admin)
PUT    /attempts/:attemptId/grade  Grade short-answer responses (faculty, admin)
```

### Materials — `/api/materials`
```
POST   /                         Upload file (faculty, admin)
GET    /course/:courseId         Materials for a course
GET    /my                       Materials for enrolled courses (student)
GET    /download/:materialId     Download file
DELETE /:materialId              Delete file (uploader or admin)
```

### Announcements — `/api/announcements`
```
GET    /                    All announcements
GET    /global              Global announcements only
GET    /my-courses          Announcements for enrolled courses (student)
POST   /                    Create announcement (admin, faculty)
DELETE /:id                 Delete announcement (admin, faculty)
```

### Finance — `/api/finance`
```
GET    /scholarships                   Active scholarships
GET    /my                             My financial records (student)
GET    /all                            All records (admin, accounts_staff)
GET    /student/:studentId             Records by student (admin, accounts_staff)
GET    /faculty/:facultyId             Faculty payment info (admin, accounts_staff)
POST   /generate-semester-invoice      Bulk semester invoices (admin, accounts_staff)
POST   /invoices                       Individual invoice (admin, accounts_staff)
POST   /pay                            Make payment (student)
POST   /scholarship/apply              Apply for scholarship (student)
PUT    /records/:recordId/mark-paid    Mark as paid (admin, accounts_staff)
```

### Notifications — `/api/notifications`
```
GET    /my              My notifications
PUT    /read-all        Mark all as read
PUT    /:id/read        Mark one as read
```

### Admin — `/api/admin`
```
GET    /analytics                System dashboard analytics
GET    /departments              List departments (public)
POST   /departments              Create department
PUT    /departments/:id          Update department
DELETE /departments/:id          Delete department
POST   /departments/merge        Merge two departments
GET    /programs                 List programs
POST   /programs                 Create program
PUT    /programs/:id             Update program
POST   /users                    Create user with role
POST   /scholarships             Create scholarship
PUT    /scholarships/:id         Update scholarship
POST   /assign-faculty           Assign faculty to course
GET    /dates                    Important dates (public)
POST   /dates                    Create important date
PUT    /dates/:id                Update important date
DELETE /dates/:id                Delete important date
```

### Public — `/api/public` (no auth)
```
GET    /departments      Departments with programs
GET    /announcements    Global announcements
```

---

## Grading Engine (`server/utils/gradingEngine.js`)

| Function | Description |
|---|---|
| `calculateGrade()` | Weighted score: quiz (20%) + midterm (30%) + final (40%) + lab (10%) |
| `applyNMinusOne()` | Drops the lowest quiz score before averaging |
| `getGrade()` | Maps 0–100 total marks to one of 13 letter grades (A+ → F) |
| `whatIfSimulation()` | Predicts letter grade for any hypothetical final-exam score |
| `requiredFinalForGrade()` | Returns minimum final score needed to achieve a target grade |
| `calcGPA()` | Credit-weighted GPA from a list of `{credits, cgpaPoints}` items |
| `checkScholarship()` | Validates GPA threshold + no-F/no-retake criteria |
| `calcAttendancePct()` | Computes attendance % from present/total counts |

**Grade Scale:** A+ (4.00) · A (4.00) · A- (3.70) · B+ (3.30) · B (3.00) · B- (2.70) · C+ (2.30) · C (2.00) · C- (1.70) · D+ (1.30) · D (1.00) · D- (0.70) · F (0.00)

---

## Data Models (24 total)

| Model | Purpose |
|---|---|
| User | Base account (admin/faculty/student/accounts_staff/library_staff) |
| Student, Faculty, Admin, AccountsStaff | Role-specific profiles |
| Department, Program | Academic structure |
| Course | Course catalog with capacity |
| Enrollment | Student ↔ Course junction |
| Grade | Per-enrollment marks, letter grade, CGPA points |
| CourseGradingPolicy | Per-course weight configuration |
| Quiz, QuizQuestion, QuizAttempt | Full quiz system (MCQ/TF/short-answer) |
| AttendanceRecord | Per-student per-session attendance |
| CourseMaterial | Uploaded files metadata |
| Announcement | Global or course-scoped notices |
| Notification | In-app notifications with type + read status |
| FinancialRecord | Tuition, fees, scholarships, payments, fines |
| Scholarship, ScholarshipApplication | Scholarship management |
| SemesterGPA | Per-semester GPA snapshot |
| ImportantDate | Academic calendar entries |
| InstallmentPlan, Installment | Installment payment tracking |
| AuditLog | Admin action trail |
| Timetable | Course schedule (day, time, location) |
