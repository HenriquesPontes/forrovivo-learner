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

## Flow

| Step | Route |
|------|--------|
| Log in | `/` (email/password) |
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

Catalog: `GET /app/v1/catalog/forro/learning_path.json`. Auth: `POST /app/v1/auth/login|register|forgot-password|reset-password`.

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
