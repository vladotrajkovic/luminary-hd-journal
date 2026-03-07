# ✦ LUMINARY — Human Design Journal

A full-stack, production-ready Human Design journal app built with Next.js and Supabase.

## ✦ Features

- **User Authentication** — register/login with email via Supabase Auth
- **HD Profile Setup** — type, authority, profile, definition, incarnation cross, birth data, defined centers, active gates
- **Daily Journal** — sectioned journal with type-specific prompts (morning, strategy/authority, body/energy, deconditioning, evening)
- **Gate of the Day** — daily rotating gate reference from all 64 gates
- **Gate Library** — searchable reference for all 64 gates (shadow/gift/siddhi)
- **Centers Tracker** — all 9 centers with defined/open display + personal reflections
- **Moon & Transit Log** — track lunar phases and how transits affect your energy
- **Deconditioning Tools** — not-self theme tracking, strategy/authority reflection
- **Beautiful Cosmic UI** — dark mystical theme with sacred geometry aesthetic

---

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Backend | Supabase (Auth + PostgreSQL) |
| Hosting | Vercel (recommended) |
| Mobile Path | Expo React Native (same Supabase backend) |

---

## ✦ Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. In your project, go to **SQL Editor**
4. Paste and run the entire contents of `supabase/schema.sql`
5. Go to **Settings → API** and copy your:
   - Project URL
   - Anon/Public key

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✦ Deploy to Vercel (Production)

### Option A: Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
```

Follow the prompts, then add environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Option B: GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. Deploy

### Option C: Docker (VPS/DigitalOcean)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hd-journal .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  hd-journal
```

---

## ✦ Enable Email Confirmation (Optional)

In Supabase Dashboard → **Authentication → Settings**:
- Toggle "Enable email confirmations" ON for production
- Configure your SMTP or use Supabase's built-in email

---

## ✦ Custom Domain

### Vercel
In Vercel Dashboard → your project → **Settings → Domains** → add your domain.

### VPS (nginx example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add SSL with Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## ✦ Path to Mobile App (iOS & Android)

Since this uses React + Supabase, migrating to mobile is straightforward:

### Recommended: Expo + React Native

```bash
# Create Expo app
npx create-expo-app hd-journal-mobile
cd hd-journal-mobile
npx expo install @supabase/supabase-js expo-secure-store
```

**What transfers directly:**
- All `lib/hdData.ts` data (100% reusable)
- All `lib/supabase.ts` database calls (100% reusable)
- Business logic and form structure (90% reusable)

**What you rebuild (UI only):**
- Replace HTML/CSS with React Native components
- Replace `<div>` with `<View>`, `<p>` with `<Text>`
- Use `StyleSheet.create()` instead of inline styles
- Navigation: use `expo-router` or `react-navigation`

### Approximate Timeline: 2-3 weeks to rebuild UI in React Native

---

## ✦ Project Structure

```
hd-journal/
├── pages/
│   ├── index.tsx          # Landing page
│   ├── dashboard.tsx      # Main dashboard
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── journal/
│   │   ├── index.tsx      # Journal list
│   │   ├── new.tsx        # New entry form
│   │   └── [id].tsx       # Entry detail (add this)
│   ├── profile/
│   │   └── index.tsx      # Chart setup
│   ├── centers/
│   │   └── index.tsx      # Centers tracker
│   ├── gates/
│   │   └── index.tsx      # Gate library
│   └── transits/
│       └── index.tsx      # Moon & transit log
├── components/
│   └── layout/
│       └── Layout.tsx     # Sidebar navigation
├── lib/
│   ├── supabase.ts        # Database client & types
│   └── hdData.ts          # All HD reference data
├── styles/
│   └── globals.css        # Cosmic theme
├── supabase/
│   └── schema.sql         # Run this in Supabase SQL editor
└── .env.example           # Environment template
```

---

## ✦ Adding the Journal Entry Detail Page

Create `pages/journal/[id].tsx` to view/edit individual entries. Example fetch:

```typescript
const { data: entry } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('id', router.query.id)
  .single()
```

---

## ✦ Scaling & Monetization Ideas

- **Free tier**: basic journaling + gate library
- **Pro tier**: advanced prompts, transit notifications, export PDF journal
- **Community**: shared insights (opt-in), type-specific communities
- **Astrology integration**: real-time transit data via astrology API

---

*Made with ✦ for Human Design experimenters everywhere.*
