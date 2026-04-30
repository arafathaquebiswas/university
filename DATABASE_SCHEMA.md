# Database Schema — Smart University Management & Academic Portal System

**Database:** PostgreSQL  
**ORM:** Sequelize (Node.js)  
**Total Tables:** 26

---

## Table of Contents

1. [users](#1-users)
2. [admins](#2-admins)
3. [faculty](#3-faculty)
4. [students](#4-students)
5. [accounts_staff](#5-accounts_staff)
6. [departments](#6-departments)
7. [programs](#7-programs)
8. [courses](#8-courses)
9. [course_grading_policies](#9-course_grading_policies)
10. [enrollments](#10-enrollments)
11. [grades](#11-grades)
12. [attendance_records](#12-attendance_records)
13. [semester_gpa](#13-semester_gpa)
14. [scholarships](#14-scholarships)
15. [scholarship_applications](#15-scholarship_applications)
16. [financial_records](#16-financial_records)
17. [installment_plans](#17-installment_plans)
18. [installments](#18-installments)
19. [quizzes](#19-quizzes)
20. [quiz_submissions](#20-quiz_submissions)
21. [timetable](#21-timetable)
22. [course_materials](#22-course_materials)
23. [announcements](#23-announcements)
24. [notifications](#24-notifications)
25. [important_dates](#25-important_dates)
26. [audit_logs](#26-audit_logs)

---

## 1. users

Central authentication table. Every person in the system has a row here regardless of role.

| Column       | Type                                                                 | Constraints                        |
|--------------|----------------------------------------------------------------------|------------------------------------|
| userId       | INTEGER                                                              | PRIMARY KEY, AUTO INCREMENT        |
| username     | VARCHAR(50)                                                          | NOT NULL, UNIQUE                   |
| passwordHash | VARCHAR(255)                                                         | NOT NULL                           |
| email        | VARCHAR(150)                                                         | NOT NULL, UNIQUE                   |
| role         | ENUM('admin', 'faculty', 'student', 'accounts_staff')                | NOT NULL                           |
| deptId       | INTEGER                                                              | FK → departments.deptId            |
| isActive     | BOOLEAN                                                              | DEFAULT true                       |
| createdAt    | TIMESTAMP                                                            | NOT NULL                           |
| updatedAt    | TIMESTAMP                                                            | NOT NULL                           |

---

## 2. admins

Profile extension for users with role = 'admin'.

| Column    | Type    | Constraints                      |
|-----------|---------|----------------------------------|
| adminId   | INTEGER | PRIMARY KEY, AUTO INCREMENT      |
| userId    | INTEGER | NOT NULL, UNIQUE, FK → users.userId |
| createdAt | TIMESTAMP | NOT NULL                       |
| updatedAt | TIMESTAMP | NOT NULL                       |

---

## 3. faculty

Profile extension for users with role = 'faculty'.

| Column        | Type         | Constraints                         |
|---------------|--------------|-------------------------------------|
| facultyId     | INTEGER      | PRIMARY KEY, AUTO INCREMENT         |
| userId        | INTEGER      | NOT NULL, UNIQUE, FK → users.userId |
| officeNumber  | VARCHAR(20)  |                                     |
| specialization| VARCHAR(100) |                                     |
| designation   | VARCHAR(50)  |                                     |
| createdAt     | TIMESTAMP    | NOT NULL                            |
| updatedAt     | TIMESTAMP    | NOT NULL                            |

---

## 4. students

Profile extension for users with role = 'student'. Also stores academic standing and registration approval state.

| Column         | Type                                                        | Constraints                         |
|----------------|-------------------------------------------------------------|-------------------------------------|
| studentId      | INTEGER                                                     | PRIMARY KEY, AUTO INCREMENT         |
| userId         | INTEGER                                                     | NOT NULL, UNIQUE, FK → users.userId |
| majorId        | INTEGER                                                     | FK → programs.progId                |
| currentGPA     | DECIMAL(4,2)                                                | DEFAULT 0.00                        |
| enrollmentYear | INTEGER                                                     |                                     |
| studentCode    | VARCHAR(20)                                                 | UNIQUE                              |
| approvalStatus | ENUM('pending', 'approved', 'rejected')                     | DEFAULT 'pending'                   |
| reviewedBy     | INTEGER                                                     | FK → users.userId (admin)           |
| academicStatus | ENUM('good_standing', 'probation', 'suspended', 'dismissed')| DEFAULT 'good_standing'             |
| createdAt      | TIMESTAMP                                                   | NOT NULL                            |
| updatedAt      | TIMESTAMP                                                   | NOT NULL                            |

---

## 5. accounts_staff

Profile extension for users with role = 'accounts_staff'.

| Column    | Type        | Constraints                         |
|-----------|-------------|-------------------------------------|
| staffId   | INTEGER     | PRIMARY KEY, AUTO INCREMENT         |
| userId    | INTEGER     | NOT NULL, UNIQUE, FK → users.userId |
| sector    | VARCHAR(50) | DEFAULT 'accounts'                  |
| createdAt | TIMESTAMP   | NOT NULL                            |
| updatedAt | TIMESTAMP   | NOT NULL                            |

---

## 6. departments

Academic departments of the university.

| Column    | Type         | Constraints                 |
|-----------|--------------|-----------------------------|
| deptId    | INTEGER      | PRIMARY KEY, AUTO INCREMENT |
| name      | VARCHAR(100) | NOT NULL, UNIQUE            |
| head      | VARCHAR(100) |                             |
| createdAt | TIMESTAMP    | NOT NULL                    |
| updatedAt | TIMESTAMP    | NOT NULL                    |

---

## 7. programs

Degree programs offered by departments (e.g. B.Sc. in CSE).

| Column    | Type         | Constraints                      |
|-----------|--------------|----------------------------------|
| progId    | INTEGER      | PRIMARY KEY, AUTO INCREMENT      |
| name      | VARCHAR(100) | NOT NULL                         |
| duration  | INTEGER      | NOT NULL (years)                 |
| deptId    | INTEGER      | NOT NULL, FK → departments.deptId|
| createdAt | TIMESTAMP    | NOT NULL                         |
| updatedAt | TIMESTAMP    | NOT NULL                         |

---

## 8. courses

Individual courses offered in a given semester.

| Column      | Type         | Constraints                      |
|-------------|--------------|----------------------------------|
| courseId    | INTEGER      | PRIMARY KEY, AUTO INCREMENT      |
| courseCode  | VARCHAR(20)  | UNIQUE                           |
| title       | VARCHAR(150) | NOT NULL                         |
| description | TEXT         |                                  |
| credits     | INTEGER      | DEFAULT 3                        |
| progId      | INTEGER      | FK → programs.progId             |
| facultyId   | INTEGER      | FK → faculty.facultyId           |
| semester    | VARCHAR(20)  |                                  |
| maxCapacity | INTEGER      | DEFAULT 40                       |
| isActive    | BOOLEAN      | DEFAULT true                     |
| createdAt   | TIMESTAMP    | NOT NULL                         |
| updatedAt   | TIMESTAMP    | NOT NULL                         |

---

## 9. course_grading_policies

One-to-one with courses. Defines how final marks are computed for each course.

| Column             | Type    | Constraints                          |
|--------------------|---------|--------------------------------------|
| policyId           | INTEGER | PRIMARY KEY, AUTO INCREMENT          |
| courseId           | INTEGER | NOT NULL, UNIQUE, FK → courses.courseId |
| quizWeight         | FLOAT   | DEFAULT 0.20                         |
| midtermWeight      | FLOAT   | DEFAULT 0.30                         |
| finalWeight        | FLOAT   | DEFAULT 0.40                         |
| labWeight          | FLOAT   | DEFAULT 0.10                         |
| quizMaxPerItem     | FLOAT   | DEFAULT 10                           |
| totalQuizzesPlanned| INTEGER | DEFAULT 4                            |
| hasLab             | BOOLEAN | DEFAULT false                        |
| createdAt          | TIMESTAMP | NOT NULL                           |
| updatedAt          | TIMESTAMP | NOT NULL                           |

---

## 10. enrollments

Records which student is enrolled in which course for which semester.

| Column               | Type                                              | Constraints                                      |
|----------------------|---------------------------------------------------|--------------------------------------------------|
| enrollId             | INTEGER                                           | PRIMARY KEY, AUTO INCREMENT                      |
| studentId            | INTEGER                                           | NOT NULL, FK → students.studentId                |
| courseId             | INTEGER                                           | NOT NULL, FK → courses.courseId                  |
| semester             | VARCHAR(30)                                       | NOT NULL                                         |
| status               | ENUM('active', 'dropped', 'completed', 'withdrawn')| DEFAULT 'active'                                |
| attendancePercentage | DECIMAL(5,2)                                      | DEFAULT 0.00                                     |
| enrolledAt           | DATE                                              | DEFAULT NOW                                      |
| createdAt            | TIMESTAMP                                         | NOT NULL                                         |
| updatedAt            | TIMESTAMP                                         | NOT NULL                                         |

**Unique constraint:** (studentId, courseId, semester)

---

## 11. grades

One-to-one with enrollments. Stores all score components and the computed final grade.

| Column        | Type         | Constraints                             |
|---------------|--------------|-----------------------------------------|
| gradeId       | INTEGER      | PRIMARY KEY, AUTO INCREMENT             |
| enrollId      | INTEGER      | NOT NULL, UNIQUE, FK → enrollments.enrollId |
| quizScores    | FLOAT[]      | DEFAULT []  (array of per-quiz marks)   |
| quizMaxPerItem| FLOAT        | DEFAULT 10                              |
| totalQuizzes  | INTEGER      | DEFAULT 0                               |
| midtermScore  | FLOAT        |                                         |
| finalScore    | FLOAT        |                                         |
| labScore      | FLOAT        |                                         |
| hasLab        | BOOLEAN      | DEFAULT false                           |
| quizAverage   | FLOAT        | Computed — best N-1 quizzes as %        |
| droppedQuizIdx| INTEGER      | DEFAULT -1 (index of dropped quiz)      |
| totalMarks    | FLOAT        | Weighted total 0–100                    |
| letterGrade   | VARCHAR(5)   |                                         |
| cgpaPoints    | FLOAT        |                                         |
| quizWeight    | FLOAT        | DEFAULT 0.20 (snapshot of policy)       |
| midtermWeight | FLOAT        | DEFAULT 0.30                            |
| finalWeight   | FLOAT        | DEFAULT 0.40                            |
| labWeight     | FLOAT        | DEFAULT 0.10                            |
| remarks       | VARCHAR(200) |                                         |
| isFinalized   | BOOLEAN      | DEFAULT false                           |
| createdAt     | TIMESTAMP    | NOT NULL                                |
| updatedAt     | TIMESTAMP    | NOT NULL                                |

---

## 12. attendance_records

One row per student per course per class date.

| Column    | Type                                        | Constraints                       |
|-----------|---------------------------------------------|-----------------------------------|
| recordId  | INTEGER                                     | PRIMARY KEY, AUTO INCREMENT       |
| studentId | INTEGER                                     | NOT NULL, FK → students.studentId |
| courseId  | INTEGER                                     | NOT NULL, FK → courses.courseId   |
| date      | DATE                                        | NOT NULL                          |
| status    | ENUM('present', 'absent', 'late', 'excused')| NOT NULL                          |
| markedBy  | INTEGER                                     | FK → users.userId (faculty)       |
| createdAt | TIMESTAMP                                   | NOT NULL                          |
| updatedAt | TIMESTAMP                                   | NOT NULL                          |

**Unique constraint:** (studentId, courseId, date)

---

## 13. semester_gpa

Cumulative and per-semester GPA snapshot for each student.

| Column            | Type         | Constraints                       |
|-------------------|--------------|-----------------------------------|
| id                | INTEGER      | PRIMARY KEY, AUTO INCREMENT       |
| studentId         | INTEGER      | NOT NULL, FK → students.studentId |
| semester          | VARCHAR(30)  | NOT NULL                          |
| semesterGPA       | DECIMAL(4,2) | DEFAULT 0                         |
| creditsAttempted  | INTEGER      | DEFAULT 0                         |
| creditsEarned     | INTEGER      | DEFAULT 0                         |
| cumulativeGPA     | DECIMAL(4,2) | DEFAULT 0                         |
| totalCreditsEarned| INTEGER      | DEFAULT 0                         |
| createdAt         | TIMESTAMP    | NOT NULL                          |
| updatedAt         | TIMESTAMP    | NOT NULL                          |

**Unique constraint:** (studentId, semester)

---

## 14. scholarships

Defines available scholarship programs and their eligibility rules.

| Column       | Type          | Constraints                 |
|--------------|---------------|-----------------------------|
| scholarshipId| INTEGER       | PRIMARY KEY, AUTO INCREMENT |
| name         | VARCHAR(100)  | NOT NULL                    |
| criteria     | TEXT          |                             |
| amount       | DECIMAL(10,2) | NOT NULL                    |
| minGPA       | DECIMAL(3,2)  |                             |
| isActive     | BOOLEAN       | DEFAULT true                |
| createdAt    | TIMESTAMP     | NOT NULL                    |
| updatedAt    | TIMESTAMP     | NOT NULL                    |

---

## 15. scholarship_applications

Tracks student scholarship applications and admin review decisions.

| Column        | Type                                 | Constraints                              |
|---------------|--------------------------------------|------------------------------------------|
| applicationId | INTEGER                              | PRIMARY KEY, AUTO INCREMENT              |
| studentId     | INTEGER                              | NOT NULL, FK → students.studentId        |
| scholarshipId | INTEGER                              | NOT NULL, FK → scholarships.scholarshipId|
| status        | ENUM('pending', 'approved', 'rejected')| DEFAULT 'pending'                      |
| appliedAt     | TIMESTAMP                            | DEFAULT NOW                              |
| reviewedBy    | INTEGER                              | FK → users.userId (admin)               |
| reviewedAt    | TIMESTAMP                            |                                          |
| remarks       | VARCHAR(255)                         |                                          |
| createdAt     | TIMESTAMP                            | NOT NULL                                 |
| updatedAt     | TIMESTAMP                            | NOT NULL                                 |

**Unique constraint:** (studentId, scholarshipId)

---

## 16. financial_records

Individual financial transactions — invoices, payments, scholarships, fines.

| Column        | Type                                                       | Constraints                              |
|---------------|------------------------------------------------------------|------------------------------------------|
| recordId      | INTEGER                                                    | PRIMARY KEY, AUTO INCREMENT              |
| studentId     | INTEGER                                                    | NOT NULL, FK → students.studentId        |
| amount        | DECIMAL(10,2)                                              | NOT NULL                                 |
| type          | ENUM('tuition', 'library_fee', 'lab_fee', 'scholarship', 'payment', 'fine') | NOT NULL |
| status        | ENUM('pending', 'paid', 'overdue', 'waived')               | DEFAULT 'pending'                        |
| semester      | VARCHAR(20)                                                |                                          |
| dueDate       | DATE                                                       |                                          |
| paymentDate   | DATE                                                       |                                          |
| scholarshipId | INTEGER                                                    | FK → scholarships.scholarshipId          |
| description   | VARCHAR(255)                                               |                                          |
| transactionRef| VARCHAR(100)                                               |                                          |
| createdAt     | TIMESTAMP                                                  | NOT NULL                                 |
| updatedAt     | TIMESTAMP                                                  | NOT NULL                                 |

---

## 17. installment_plans

A split-payment arrangement created by accounts staff for a student.

| Column               | Type                                      | Constraints                       |
|----------------------|-------------------------------------------|-----------------------------------|
| planId               | INTEGER                                   | PRIMARY KEY, AUTO INCREMENT       |
| studentId            | INTEGER                                   | NOT NULL, FK → students.studentId |
| totalAmount          | DECIMAL(10,2)                             | NOT NULL                          |
| numberOfInstallments | INTEGER                                   | NOT NULL                          |
| semester             | VARCHAR(20)                               | NOT NULL                          |
| status               | ENUM('active', 'completed', 'defaulted')  | DEFAULT 'active'                  |
| createdBy            | INTEGER                                   | FK → users.userId (accounts staff)|
| createdAt            | TIMESTAMP                                 | NOT NULL                          |
| updatedAt            | TIMESTAMP                                 | NOT NULL                          |

---

## 18. installments

Individual installment rows belonging to an installment plan.

| Column        | Type                              | Constraints                            |
|---------------|-----------------------------------|----------------------------------------|
| installmentId | INTEGER                           | PRIMARY KEY, AUTO INCREMENT            |
| planId        | INTEGER                           | NOT NULL, FK → installment_plans.planId|
| amount        | DECIMAL(10,2)                     | NOT NULL                               |
| dueDate       | DATE                              | NOT NULL                               |
| paymentDate   | DATE                              |                                        |
| status        | ENUM('pending', 'paid', 'overdue')| DEFAULT 'pending'                      |
| transactionRef| VARCHAR(100)                      |                                        |
| createdAt     | TIMESTAMP                         | NOT NULL                               |
| updatedAt     | TIMESTAMP                         | NOT NULL                               |

---

## 19. quizzes

Quizzes/exams created by faculty for a course.

| Column      | Type         | Constraints                     |
|-------------|--------------|---------------------------------|
| quizId      | INTEGER      | PRIMARY KEY, AUTO INCREMENT     |
| courseId    | INTEGER      | NOT NULL, FK → courses.courseId |
| title       | VARCHAR(200) | NOT NULL                        |
| description | TEXT         |                                 |
| totalMarks  | FLOAT        | DEFAULT 10                      |
| duration    | INTEGER      | In minutes                      |
| scheduledAt | TIMESTAMP    |                                 |
| isPublished | BOOLEAN      | DEFAULT false                   |
| createdAt   | TIMESTAMP    | NOT NULL                        |
| updatedAt   | TIMESTAMP    | NOT NULL                        |

---

## 20. quiz_submissions

Student submission/score for a given quiz.

| Column       | Type                          | Constraints                         |
|--------------|-------------------------------|-------------------------------------|
| submissionId | INTEGER                       | PRIMARY KEY, AUTO INCREMENT         |
| quizId       | INTEGER                       | NOT NULL, FK → quizzes.quizId       |
| studentId    | INTEGER                       | NOT NULL, FK → students.studentId   |
| score        | FLOAT                         |                                     |
| submittedAt  | TIMESTAMP                     | DEFAULT NOW                         |
| status       | ENUM('pending', 'graded')     | DEFAULT 'pending'                   |
| createdAt    | TIMESTAMP                     | NOT NULL                            |
| updatedAt    | TIMESTAMP                     | NOT NULL                            |

**Unique constraint:** (quizId, studentId)

---

## 21. timetable

Scheduled class slots for courses (day, time, room).

| Column      | Type                                                                        | Constraints                     |
|-------------|-----------------------------------------------------------------------------|---------------------------------|
| timetableId | INTEGER                                                                     | PRIMARY KEY, AUTO INCREMENT     |
| courseId    | INTEGER                                                                     | NOT NULL, FK → courses.courseId |
| dayOfWeek   | ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') | NOT NULL              |
| startTime   | TIME                                                                        | NOT NULL                        |
| endTime     | TIME                                                                        | NOT NULL                        |
| room        | VARCHAR(50)                                                                 |                                 |
| semester    | VARCHAR(20)                                                                 | NOT NULL                        |
| createdAt   | TIMESTAMP                                                                   | NOT NULL                        |
| updatedAt   | TIMESTAMP                                                                   | NOT NULL                        |

---

## 22. course_materials

Files (lecture notes, assignments, PDFs) uploaded by faculty for a course.

| Column       | Type         | Constraints                     |
|--------------|--------------|---------------------------------|
| materialId   | INTEGER      | PRIMARY KEY, AUTO INCREMENT     |
| courseId     | INTEGER      | NOT NULL, FK → courses.courseId |
| uploadedBy   | INTEGER      | NOT NULL, FK → users.userId     |
| title        | VARCHAR(200) | NOT NULL                        |
| filename     | VARCHAR(300) | NOT NULL (stored filename)      |
| originalName | VARCHAR(300) | NOT NULL                        |
| mimetype     | VARCHAR(100) |                                 |
| size         | INTEGER      | In bytes                        |
| createdAt    | TIMESTAMP    | NOT NULL                        |
| updatedAt    | TIMESTAMP    | NOT NULL                        |

---

## 23. announcements

Announcements scoped to a course, a department, or the entire university.

| Column         | Type         | Constraints                         |
|----------------|--------------|-------------------------------------|
| announcementId | INTEGER      | PRIMARY KEY, AUTO INCREMENT         |
| title          | VARCHAR(200) | NOT NULL                            |
| content        | TEXT         | NOT NULL                            |
| courseId       | INTEGER      | FK → courses.courseId (nullable)    |
| deptId         | INTEGER      | FK → departments.deptId (nullable)  |
| createdBy      | INTEGER      | FK → users.userId                   |
| isGlobal       | BOOLEAN      | DEFAULT false                       |
| createdAt      | TIMESTAMP    | NOT NULL                            |
| updatedAt      | TIMESTAMP    | NOT NULL                            |

> If `isGlobal = true`, the announcement is visible to all users.  
> If `courseId` is set, it is scoped to that course.  
> If `deptId` is set, it is scoped to that department.

---

## 24. notifications

In-app notifications delivered to individual users.

| Column         | Type                                                                  | Constraints               |
|----------------|-----------------------------------------------------------------------|---------------------------|
| notificationId | INTEGER                                                               | PRIMARY KEY, AUTO INCREMENT|
| userId         | INTEGER                                                               | NOT NULL, FK → users.userId|
| type           | ENUM('grade', 'attendance', 'payment', 'announcement', 'enrollment', 'system') | NOT NULL      |
| message        | TEXT                                                                  | NOT NULL                  |
| status         | ENUM('read', 'unread')                                                | DEFAULT 'unread'          |
| link           | VARCHAR(255)                                                          |                           |
| timestamp      | TIMESTAMP                                                             | DEFAULT NOW               |
| createdAt      | TIMESTAMP                                                             | NOT NULL                  |
| updatedAt      | TIMESTAMP                                                             | NOT NULL                  |

---

## 25. important_dates

University calendar events visible to all users (exam dates, registration windows, holidays).

| Column      | Type                                                  | Constraints                 |
|-------------|-------------------------------------------------------|-----------------------------|
| dateId      | INTEGER                                               | PRIMARY KEY, AUTO INCREMENT |
| title       | VARCHAR(200)                                          | NOT NULL                    |
| description | VARCHAR(500)                                          |                             |
| eventDate   | DATE                                                  | NOT NULL                    |
| category    | ENUM('exam', 'registration', 'holiday', 'event', 'deadline') | DEFAULT 'event'    |
| isActive    | BOOLEAN                                               | DEFAULT true                |
| createdAt   | TIMESTAMP                                             | NOT NULL                    |
| updatedAt   | TIMESTAMP                                             | NOT NULL                    |

---

## 26. audit_logs

Security audit trail — records every significant action taken by any user.

| Column      | Type         | Constraints               |
|-------------|--------------|---------------------------|
| logId       | INTEGER      | PRIMARY KEY, AUTO INCREMENT|
| userId      | INTEGER      | FK → users.userId         |
| action      | VARCHAR(100) | NOT NULL (e.g. CREATE, UPDATE, DELETE, LOGIN) |
| targetTable | VARCHAR(100) |                           |
| targetId    | INTEGER      |                           |
| ipAddress   | VARCHAR(45)  |                           |
| details     | TEXT         | JSON string (before/after data) |
| timestamp   | TIMESTAMP    | DEFAULT NOW               |

---

## Entity Relationships

### User & Profiles (1:1)
```
users ──< admins          (users.userId = admins.userId)
users ──< faculty         (users.userId = faculty.userId)
users ──< students        (users.userId = students.userId)
users ──< accounts_staff  (users.userId = accounts_staff.userId)
```

### Organisational Hierarchy
```
departments >──< programs    (departments.deptId = programs.deptId)
programs    >──< students    (programs.progId = students.majorId)
programs    >──< courses     (programs.progId = courses.progId)
departments >──  users       (departments.deptId = users.deptId)
```

### Course Operations
```
faculty   >──< courses                  (faculty.facultyId = courses.facultyId)
courses   ──< course_grading_policies   (1:1)
courses   >──< enrollments
courses   >──< attendance_records
courses   >──< quizzes
courses   >──< timetable
courses   >──< course_materials
courses   >──< announcements
```

### Student Academic Records
```
students >──< enrollments
enrollments ──< grades        (1:1, grades.enrollId = enrollments.enrollId)
students >──< attendance_records
students >──< semester_gpa
students >──< quiz_submissions (via quizzes)
```

### Finance
```
students >──< financial_records
students >──< installment_plans
installment_plans >──< installments
scholarships >──< financial_records
scholarships >──< scholarship_applications
students >──< scholarship_applications
```

### Communication
```
users >──< announcements   (createdBy)
users >──< notifications
users >──< audit_logs
```

### Admin Approval
```
users (admin) ──< students             (students.reviewedBy = users.userId)
users (admin) ──< scholarship_applications (reviewedBy)
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Separate profile tables (admins, faculty, students, accounts_staff) | Each role has different attributes; avoids sparse nullable columns on users |
| `approvalStatus` on students | Admin must approve new student registrations before they gain full access |
| `academicStatus` on students | Faculty can recommend probation; stored on student for quick queries |
| Grade stores a snapshot of policy weights | Grading policies can change; the grade at submission time must be preserved |
| `quizScores[]` array + `droppedQuizIdx` | Implements the N-1 (best-of) quiz rule without a separate quiz-score table |
| `isGlobal` on announcements | Single table handles course-level, department-level, and university-wide posts |
| `audit_logs` has no `updatedAt` | Audit records are immutable — they are only ever inserted, never modified |
| installment_plans → installments (1:N) | Separates the plan metadata from individual payment rows for flexible tracking |
