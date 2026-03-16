This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Setting up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **New project** → **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth 2.0 Client ID** → **Web application**.
3. Under **Authorised redirect URIs** add:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`
4. Copy the **Client ID** and **Client Secret**.
5. In your Supabase dashboard: **Authentication → Providers → Google** → paste the Client ID and Secret → **Save**.
6. In your Supabase dashboard: **Authentication → URL Configuration** → add `http://localhost:3000/auth/callback` (and your production URL) to **Redirect URLs**.

After a successful Google login, new users are automatically redirected to `/onboarding` to complete their profile. Returning users go straight to `/dashboard/projects`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Required |
| `ENCRYPTION_KEY` | 32-character random string for encrypting Figma tokens | Required |

Generate `ENCRYPTION_KEY` with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/modules/create` | POST | Create a new module |
| `/api/modules/generate` | POST | Generate test cases with Claude |
| `/api/modules/[id]/save` | POST | Save confirmed test cases |
| `/api/modules/[id]/chat` | POST | RAG chat for refining test cases |
| `/api/modules/[id]/figma-token` | GET/POST/DELETE | Manage Figma access token for a module |
| `/api/modules/[id]/confirm-update` | POST | Confirm updated test cases |
| `/api/modules/[id]/delete` | DELETE | Delete a module |
| `/api/modules/[id]/export/xml` | GET | Export test cases as XML |
| `/api/modules/[id]/export/tsv` | GET | Export test cases as TSV |
| `/api/upload/document` | POST | Upload and extract text from PRD documents |
| `/api/upload/figma` | POST | Fetch and parse a Figma file via URL |
| `/api/upload/figma-pdf` | POST | Parse Figma PDF export via Claude vision |
| `/api/upload/figma-screenshots` | POST | Parse UI screenshots via Claude vision |
| `/api/projects/create` | POST | Create a new project |

## Setting up the database

Run the migration files in order inside the Supabase SQL editor (or with the Supabase CLI):

```
supabase/migrations/001_init.sql
supabase/migrations/003_profiles_and_plans.sql
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
