# API additions

## Auth

- POST `/auth/login`
  - body: `{ email, password, FCM? }`
  - general user login

- POST `/auth/admin-login`
  - body: `{ email, password, FCM? }`
  - authenticates user then enforces role === `ADMIN`

- POST `/auth/teacher-login`
  - body: `{ email, password, FCM? }`
  - authenticates user then enforces role === `TEACHER`

Notes:
- Schemas are in `src/modules/auth/auth.validation.ts` as `loginSchema`, `adminLoginSchema`, and `teacherLoginSchema` (currently the same shape).
- Successful responses return `{ accessToken, refreshToken, user }` in `data`.
