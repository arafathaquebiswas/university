# Smart University Management & Academic Portal System

A full-stack web application for BRAC University — digitizing academic, financial, and administrative operations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js (MVC) |
| Database | PostgreSQL + Sequelize ORM |
| Auth | JWT + bcrypt |

---

## Project Structure

```
university/
├── server/          ← Express backend (port 5001)
│   ├── config/      ← Database config
│   ├── models/      ← Sequelize models + associations
│   ├── controllers/ ← Business logic
│   ├── routes/      ← API route definitions
│   ├── middleware/  ← JWT auth + role guard
│   └── seeders/     ← Sample data
└── client/          ← React frontend (port 5173)
    └── src/
        ├── api/         ← Axios instance
        ├── context/     ← Auth context
        ├── components/  ← Layout, Sidebar, etc.
        └── pages/       ← Admin / Faculty / Student / Accounts
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally)

### 1. Backend

```bash
cd server
# Database is already seeded. To reseed:
# node seeders/seed.js

node server.js
# Server starts on http://localhost:5001
```

### 2. Frontend

```bash
cd client
npm run dev
# App opens on http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bracu.ac.bd` | `Admin@123` |
| Faculty | `ext.dr.hassan_cse@g.bracu.ac.bd` | `Fac@123` |
| Student | `ali.khan_20301001@g.bracu.ac.bd` | `Stu@123` |
| Accounts Staff | `accounts.john@g.bracu.ac.bd` | `Acc@123` |

---

## Email Validation (Registration)

| Role | Format | Example |
|---|---|---|
| Student | `name_studentid@g.bracu.ac.bd` | `ali.khan_20301001@g.bracu.ac.bd` |
| Faculty | `ext.name_dept@g.bracu.ac.bd` | `ext.dr.hassan_cse@g.bracu.ac.bd` |
| Accounts Staff | `accounts.name@g.bracu.ac.bd` | `accounts.john@g.bracu.ac.bd` |
| Library Staff | `library.name@g.bracu.ac.bd` | `library.jane@g.bracu.ac.bd` |

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users                    (admin)
PUT    /api/users/:id
DELETE /api/users/:id                (admin)

GET    /api/courses
POST   /api/courses                  (admin/faculty)
GET    /api/courses/faculty/:id

POST   /api/enrollments              (student)
GET    /api/enrollments/my           (student)
GET    /api/enrollments/course/:id   (faculty/admin)
DELETE /api/enrollments/:id

POST   /api/attendance               (faculty)
GET    /api/attendance/my            (student)
GET    /api/attendance/course/:id

POST   /api/grades                   (faculty)
GET    /api/grades/my                (student)
GET    /api/grades/course/:id

GET    /api/finance/my               (student)
POST   /api/finance/pay              (student)
POST   /api/finance/invoices         (accounts_staff)
GET    /api/finance/all              (accounts_staff/admin)

GET    /api/notifications/my
PUT    /api/notifications/read-all

GET    /api/admin/analytics
GET/POST /api/admin/departments
GET/POST /api/admin/programs
```

---

## Features by Role

### Admin
- System analytics dashboard with charts
- Manage departments and programs
- Create/manage all user accounts
- Manage courses and assign faculty
- Configure scholarships

### Faculty
- View assigned courses and enrolled students
- Mark attendance (present/absent/late/excused)
- Submit and update grades (auto letter-grade + CGPA)
- Post course announcements

### Student
- Course registration and drop (with capacity check)
- View grades and auto-calculated CGPA
- Track attendance per course
- Pay fees and apply for scholarships
- Receive real-time notifications

### Accounts Staff
- Generate fee invoices for students
- View all financial records with filters
- Track scholarship disbursements
