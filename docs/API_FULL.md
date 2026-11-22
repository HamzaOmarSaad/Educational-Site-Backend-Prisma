# API Reference — Full

This file documents available HTTP endpoints grouped by module. Paths are prefixed by the mount points in `src/bootstrap.ts`.

- `/auth` — authentication
- `/user` — user-related

---

Postman collection

I generated a starter Postman collection with representative requests for each module. You can find it at `docs/postman_collection.json` — import into Postman and set the `baseUrl` variable (e.g., `http://localhost:3000`).

Examples

- Example: Login

  Request:

  POST /auth/login
  Content-Type: application/json

  Body:

  {
  "email": "jane@example.com",
  "password": "Passw0rd!"
  }

  Response (200):

  {
  "success": true,
  "statusCode": 200,
  "data": {
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": "<uuid>", "role": "STUDENT", "email": "jane@example.com" }
  }
  }

- Example: Create Quiz (teacher)

  Request:

  POST /quiz/create-quiz
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json

  Body:

  {
  "lessonId": "<uuid>",
  "title": "Sample Quiz",
  "questions": [
  {
  "question": "What is 2+2?",
  "type": "MCQ",
  "answers": [ { "text": "3", "isCorrect": false }, { "text": "4", "isCorrect": true } ],
  "order": 1
  }
  ]
  }

  Response (201):

  {
  "success": true,
  "statusCode": 201,
  "data": { /* created quiz object */ }
  }

If you want, I can extend the Postman collection with more detailed example bodies and expected responses for every endpoint, or generate an OpenAPI v3 YAML from the documented endpoints.

- `/course` — courses
- `/admin` — admin operations
- `/enrollment` — enrollment
- `/lesson` — lessons
- `/payment` — payments / vouchers
- `/quiz` — quizzes
- `/teacher` — teacher-specific

---

## Auth

- POST `/auth/signup`
  - Validation: `src/modules/auth/auth.validation.ts` -> `signupSchema`
  - DTO: `src/modules/auth/auth.dto.ts`
  - Description: create student account (signup flow).
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L1-L120)

- POST `/auth/login`
  - Validation: `loginSchema`
  - Body: `{ email, password, FCM? }`
  - Returns: `{ accessToken, refreshToken, user }`
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L1-L120)

- POST `/auth/admin-login`
  - Validation: `adminLoginSchema` (alias of `loginSchema`)
  - Behavior: authenticates, then enforces `user.role === ADMIN`.
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L1-L120)

- POST `/auth/teacher-login`
  - Validation: `teacherLoginSchema` (alias of `loginSchema`)
  - Behavior: authenticates, then enforces `user.role === TEACHER`.
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L1-L120)

- POST `/auth/confirm-email`
  - Validation: `confirmEmailSchema` (body: `{ email, otp }`)
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L120-L220)

- POST `/auth/resend-email`
  - Validation: `resendEmailSchema` (body: `{ email }`)
  - Controller: [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts#L120-L220)

---

## Users (`/user`)

Implemented endpoints in `src/modules/users/user.controller.ts`:

- GET `/user/profile`
  - Auth: required
  - Roles: `STUDENT`, `TEACHER`
  - Returns: basic user profile
  - Routes: see `src/modules/users/user.routes.ts`

- GET `/user/student-profile`
  - Auth: required
  - Roles: `STUDENT`
  - Returns: student profile (joined data)

- GET `/user/teacher-profile`
  - Auth: required
  - Roles: `TEACHER`
  - Returns: teacher profile

Notes: `src/modules/users/user.routes.ts` defines additional route strings (create/update/delete teacher-profile, `/teachers`, `/teachers/:subjectId`) — these are not fully implemented in the controller and should be checked if they are required.

Controller: [src/modules/users/user.controller.ts](src/modules/users/user.controller.ts#L1-L200)
Routes: [src/modules/users/user.routes.ts](src/modules/users/user.routes.ts#L1-L50)

---

## Course (`/course`)

Controller: [src/modules/course/course.controller.ts](src/modules/course/course.controller.ts#L1-L200)
Routes are defined in `src/modules/course/course.routes.ts`.

- POST `/course/create`
  - Auth: required
  - Roles: `TEACHER`, `ADMIN`
  - Validation: `createCourseSchema` (`src/modules/course/course.validation.ts`)

- POST `/course/create-section`
  - Auth: required
  - Roles: `TEACHER`, `ADMIN`
  - Validation: `createCourseSectionSchema`

---

## Admin (`/admin`)

Controller: [src/modules/admin/admin.controller.ts](src/modules/admin/admin.controller.ts#L1-L200)

- POST `/admin/create-teacher`
  - Auth: required
  - Roles: `ADMIN`
  - Validation: `createTeacherSchema` (`src/modules/admin/admin.validation.ts`)
  - File upload: `attachment` (image)

---

## Enrollment (`/enrollment`)

Controller: [src/modules/enrollment/enrollment.controller.ts](src/modules/enrollment/enrollment.controller.ts#L1-L200)

- POST `/enrollment/enroll-course/:courseId`
  - Auth: required
  - Roles: currently `TEACHER`, `ADMIN` (see code)
  - Behavior: checks subscription, teacher wallet balance, creates WalletTransaction and Enrollment in a transaction

Note: `src/modules/enrollment/enrollment.routes.ts` contains route constants unrelated to current controller path; the controller uses an inline route string. Consider standardizing.

---

## Lesson (`/lesson`)

Controller: [src/modules/lesson/lesson.controller.ts](src/modules/lesson/lesson.controller.ts#L1-L200)

- POST `/lesson/create-lesson-video`
  - Auth: required
  - Roles: `TEACHER`
  - Validation: `createLessonVideoSchema` (`src/modules/lesson/lesson.validation.ts`)
  - File upload: field `video`

- POST `/lesson/create-lesson-attachment`
  - Auth: required
  - Roles: `TEACHER`
  - Validation: `createLessonAttachmentsSchema`
  - File upload: field `attachment`

---

## Payment (`/payment`)

Controller: [src/modules/payment/payment.controller.ts](src/modules/payment/payment.controller.ts#L1-L200)

- POST `/payment/create-voucher`
  - Auth: required
  - Roles: `TEACHER`, `ADMIN`
  - Validation: `createVoucherSchema` (`src/modules/payment/payment.validation.ts`)

- POST `/payment/redeem-voucher`
  - Auth: required
  - Roles: `STUDENT`
  - Validation: (currently uses `createVoucherSchema` in the controller)

---

## Quiz (`/quiz`)

Controller: [src/modules/quiz/quiz.controller.ts](src/modules/quiz/quiz.controller.ts#L1-L200)

- POST `/quiz/create-quiz`
  - Auth: required
  - Roles: `TEACHER`
  - Validation: `createQuizSchema` (`src/modules/quiz/quiz.validation.ts`)

- POST `/quiz/start-quiz/:quizId`
  - Auth: required
  - Roles: `STUDENT`
  - Validation: `startQuiz` (params schema)

- POST `/quiz/submit-quiz`
  - Auth: required
  - Roles: `STUDENT`
  - Validation: `submitQuiz` (body + params)

---

## Teacher (`/teacher`)

Controller: [src/modules/teacher/teacher.controller.ts](src/modules/teacher/teacher.controller.ts#L1-L200)

- POST `/teacher/create-teacher`
  - Auth: required
  - Roles: `ADMIN`
  - Note: controller delegates creation to admin flow (see `src/modules/admin/admin.service.ts`).

- GET `/teacher/subscribed-students`
  - Auth: required
  - Roles: `TEACHER`
  - Returns: list of approved subscribers

- GET `/teacher/student-requests`
  - Auth: required
  - Roles: `TEACHER`
  - Returns: list of pending subscription requests

- POST `/teacher/approve-student/:studentId`
  - Auth: required
  - Roles: `TEACHER`
  - Approves a pending student subscription

---

## Root

- GET `/` — health / quick hello (in `src/bootstrap.ts`)
- All other routes: `app.all("/*")` returns `NotFoundException`.
