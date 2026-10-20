# forrovivo-learner

<p align="center">
  <img src="public/images/app/forro-icon.png" alt="Forro Vivo app icon" width="180">
</p>

Web lessons at [learn.forrovivo.com](https://learn.forrovivo.com). Guests can study the first unit. An account opens the rest of the path. The iPhone and Android apps remain the main way to learn.

Learner portal for ForroVivo. Vercel deploys it at **learn.forrovivo.com**.

This is not Admin, not the public marketing site, and not Connect. Learning catalog and account APIs stay on Cloudflare (`api.forrovivo.com`). Native iOS and Android apps are **live in production** and remain the primary learning surface.

```
Vercel
│
├── forrovivo-web      forrovivo.com, connect.forrovivo.com
├── forrovivo-admin    admin.forrovivo.com
└── forrovivo-learner  learn.forrovivo.com
```

| Host | Vercel project | Folder | Role |
|------|----------------|--------|------|
| `learn.forrovivo.com` | `forrovivo-learner` | this repo | Web Academy portal |

## Current stage

- Guests enter via **Try lessons**, study the first Academy unit, and are prompted to create an account for the full path.
- Signed-in learners use email/password auth (and optional Apple / Google when portal OAuth env is configured).
- Course map and lesson quizzes read attested Forro `learning_path.json` from the Learning catalog.
- Password reset flows proxy to the platform Worker (`forgot-password` / `reset-password`).
- Store CTAs link to the App Store and Google Play for the native Learning apps.

## Flow

| Step | Route |
|------|--------|
| Log in | `/` (email/password; optional social) |
| Try as guest | Header **Try lessons** → `/try` → `/home` |
| Course map | `/home` |
| Lesson quiz | `/academy/[unit]/[level]` |
| Register / save | `/create-account` |

Guests study **Unit 1** only. Account unlocks the full path.

## Routes

| Path | Role |
|------|------|
| `/` | Email/password login |
| `/try` | Enter as guest → redirect `/home` |
| `/home` | Academy course map (guest or signed-in) |
| `/academy/[unit]/[level]` | Lesson quiz from attested `learning_path.json` |
| `/login` | Alias → `/` |
| `/create-account` | Register / save progress |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Set a new password from a reset link |
| `/api/auth/*` | Login, register, logout, OAuth, password reset proxies |

Catalog: `GET /app/v1/catalog/forro/learning_path.json`. Auth: `POST /app/v1/auth/login|register|forgot-password|reset-password` (and session / OAuth as configured on the Worker).

## Local

```bash
npm install
npm run dev
```

Optional:

- `LEARN_ORIGIN` when the health strip must call a non-default origin
- `API_ORIGIN` (defaults to `https://api.forrovivo.com`) for account auth proxy routes
- Apple / Google client IDs only when social sign-in should appear

## Do not

- Store linguistic JSON here (packs stay in `forrovivo-research` / Learning catalog).
- Reuse Admin tokens or Admin RBAC for learners.
- Commit `.env.local`, secrets, or learner PII.
