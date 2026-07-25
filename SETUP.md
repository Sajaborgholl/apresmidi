# Setup guide

## 1. Install dependencies

```
npm install
```

## 2. Push this to your GitHub repo

```
git init
git add .
git commit -m "Initial invite-app scaffold"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Replace `<YOUR_GITHUB_REPO_URL>` with the URL of the empty repo you created
(e.g. https://github.com/yourname/invite-app.git).

## 3. Run the database schema

In Supabase: Project → SQL Editor → New query.
Paste the contents of `supabase/schema.sql` and click Run.
This creates the templates/invites/rsvps tables and seeds one template.

Then paste `supabase/seed-demo.sql` and run it — this creates a demo
invite at the slug "sarah-karim" so you have something to look at.

## 4. Import into Vercel

- In Vercel, "Add New Project" → import the GitHub repo you just pushed.
- Before deploying, add these Environment Variables (from your Supabase
  Project Settings → API Keys page):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  - SUPABASE_SECRET_KEY
- Deploy.

## 5. Test it

Visit `https://your-vercel-url.vercel.app/i/sarah-karim` — you should see
the demo wedding invitation, countdown, map, and RSVP form. Submit a test
RSVP and check the `rsvps` table in Supabase to confirm it saved.

## 6. Local development (optional)

```
cp .env.local.example .env.local
```
Fill in the real values in `.env.local`, then:
```
npm run dev
```
Visit http://localhost:3000/i/sarah-karim
