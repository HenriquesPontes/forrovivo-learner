# forrovivo-learner

Learner portal for ForroVivo. Vercel deploys it at **learn.forrovivo.com**.

This is not Admin, not the public marketing site, and not Connect. Learning catalog and account APIs stay on Cloudflare (`api.forrovivo.com`). Native apps remain the primary learning surface.

```
Vercel
│
├── forrovivo-web      forrovivo.com, connect.forrovivo.com
├── forrovivo-admin    admin.forrovivo.com
└── forrovivo-learner  learn.forrovivo.com
```

| Host | Vercel project | Folder | Role |
|------|----------------|--------|------|
| `learn.forrovivo.com` | `forrovivo-learner` | this repo | Learner portal |

## Routes

| Path | Role |
|------|------|
| `/` | Email/password log in (first page) |
| `/create-account` | Create a web learner account |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Set a new password from a reset link |
| `/home` | Signed-in portal home |
| `/login` | Redirects to `/` |

Web auth calls `api.forrovivo.com` (`POST /app/v1/auth/login`, `/register`, `/forgot-password`, `/reset-password`). Native apps keep Apple / Google sign-in.

Password reset requires `LEARNER_WEB_SERVICE_KEY` (same value on the Worker) and `RESEND_API_KEY` on the learner host.

## Local

```bash
npm install
npm run dev
```

Optional:

- `LEARN_ORIGIN=http://localhost:3000` when the health strip must call a non-Vercel origin
- `API_ORIGIN=https://api.forrovivo.com` (default) for account auth proxy routes

## Do not

- Store linguistic JSON here (packs stay in `forrovivo-research` / Learning catalog).
- Reuse Admin tokens or Admin RBAC for learners.
- Commit `.env.local`, secrets, or learner PII.
