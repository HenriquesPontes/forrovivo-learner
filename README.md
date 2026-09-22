# forrovivo-learner

Learner portal for Forro Vivo. Vercel deploys it at **learn.forrovivo.com**.

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

## Local

```bash
npm install
npm run dev
```

Optional: set `LEARN_ORIGIN=http://localhost:3000` when the home page health strip must call a non-Vercel origin.

## Do not

- Store linguistic JSON here (packs stay in `forrovivo-research` / Learning catalog).
- Reuse Admin tokens or Admin RBAC for learners.
- Commit `.env.local`, secrets, or learner PII.
