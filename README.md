# EnstaRobots World Cup 🏆

A modern, real-time event management platform for robotics competitions. Built with Next.js, Supabase, and Framer Motion.

![EnstaRobots Banner](public/icon.png)

## 🌟 Features

### For Visitors
- **Live Match Tracking**: Real-time scores and match status
- **Competition Brackets**: Tournament progression visualization
- **Rankings**: Dynamic leaderboards with trend indicators
- **Mobile-First Design**: Optimized for all devices

### For Competitors (Teams)
- **Team Dashboard**: View match schedule and past results
- **Countdown Timers**: Know exactly when your match starts
- **Real-time Notifications**: Get alerted when your match is starting
- **Team Code Authentication**: Secure, simple login

### For Judges
- **Offline-First Scoring**: Submit scores even without internet
- **Competition-Specific Forms**: Different scoring for Line Follower, All Terrain, and Fight
- **Auto-Sync**: Scores sync automatically when connectivity is restored
- **Scoring History**: Review all submitted scores

### For Administrators
- **Competition Management**: Create and control tournament phases
- **Match Scheduling**: Assign arenas and manage match flow
- **Global Announcements**: Publish real-time alerts to all users
- **Team CRUD**: Manage team registrations and assignments

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **Animations**: Framer Motion
- **PWA**: @ducanh2912/next-pwa
- **Icons**: Lucide React
- **Hosting**: Vercel (Free Tier)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd EnstaRobots-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   > ⚠️ **Important**: Use `NEXT_PUBLIC_` prefix (not `EXPO_PUBLIC_`)

4. **Set up Supabase database**
   
   Execute the SQL schema in your Supabase SQL Editor:
   ```bash
   # File: supabase/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📦 Build & Deploy

### Build for Production

```bash
# Build with webpack (required for PWA)
npm run build -- --webpack

# Start production server
npm start
```

### Deploy to Vercel

1. **Connect your GitHub repository** to Vercel

2. **Add environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#051560` (Deep tech blue)
- **Secondary Blue**: `#0f34a8` (Gradient-friendly)
- **Background**: `#020617` (Dark mode)
- **Accent**: `#00e5ff` (Electric blue glow)

### Typography
- **Sans**: Geist Sans (Next.js default)
- **Mono**: Geist Mono (for team codes, times)

## 📱 Progressive Web App (PWA)

The app is installable on mobile and desktop devices:

- **Service Worker**: Caches pages for offline viewing
- **Manifest**: Custom icon and theme colors
- **Offline Support**: Judges can score matches offline

## 🔐 Authentication & Roles

### Team Login
- **Method**: Team code (e.g., `TEAM-XXXX-XXXX`)
- **Storage**: LocalStorage with 7-day expiration
- **Route**: `/auth/team`

### Judge/Admin Login
- **Method**: Email/Password via Supabase Auth
- **Route**: `/auth/judge`
- **Roles**: `judge` or `admin`

## 📊 Database Schema

### Core Tables
- `competitions` - Competition categories
- `teams` - Competitor teams
- `matches` - Match scheduling
- `scores` - Match results
- `announcements` - Real-time alerts
- `profiles` - Judge/Admin accounts
- `arenas` - Physical locations

See `supabase/schema.sql` for complete schema with Row Level Security policies.

## ⚡ Real-time Features

### Supabase Realtime Subscriptions
- **Matches**: Status updates (scheduled → live → completed)
- **Scores**: New score submissions
- **Announcements**: Global alerts

### Channels by Role
- **Visitors**: Public matches, announcements
- **Teams**: Own matches, team-specific announcements
- **Judges**: Assigned competitions
- **Admins**: All channels

## 🧪 Testing

### Manual Testing Checklist
- [ ] Visitor pages load correctly
- [ ] Team login with mock code works
- [ ] Judge offline scoring saves locally
- [ ] Admin announcements propagate in real-time
- [ ] Mobile navigation works (bottom bar)
- [ ] PWA installability
- [ ] Responsive design on all screen sizes

### Cross-Browser Testing
- Chrome ✓
- Safari ✓
- Edge ✓
- Firefox ✓

## 📂 Project Structure

```
app/
├── page.tsx                    # Landing page
├── live/page.tsx              # Live matches
├── rankings/page.tsx          # Rankings
├── competitions/page.tsx      # Competition details
├── auth/
│   ├── team/page.tsx         # Team login
│   └── judge/page.tsx        # Judge/Admin login
├── team/
│   ├── page.tsx              # Team dashboard
│   └── matches/page.tsx      # Team matches
├── judge/
│   ├── page.tsx              # Judge dashboard
│   ├── score/page.tsx        # Scoring form
│   └── history/page.tsx      # Scoring history
└── admin/
    ├── page.tsx              # Admin dashboard
    ├── competitions/         # Competition CRUD
    └── announcements/        # Announcements

components/
├── Navbar.tsx                # Role-aware navbar
├── BottomNav.tsx            # Mobile navigation
├── NotificationBanner.tsx   # Real-time alerts
└── ErrorBoundary.tsx        # Error handling

lib/
├── supabase.ts              # Supabase client
├── auth.ts                  # Auth helpers
├── types.ts                 # TypeScript types
├── navConfig.ts             # Role-based navigation
└── offlineScores.ts         # Offline scoring

supabase/
└── schema.sql               # Database schema
```

## 🔧 Configuration Files

### `next.config.ts`
- PWA configuration
- Turbopack setup

### `tailwind.config.ts`
- Custom color palette
- Dark mode configuration

### `middleware.ts`
- Role-based route protection
- Session validation

## 🐛 Troubleshooting

### Build Errors

**Error**: "webpack config with no turbopack config"
```bash
# Solution: Use webpack flag
npm run build -- --webpack
```

**Error**: "NEXT_PUBLIC_ variables undefined"
```bash
# Solution: Check .env.local file exists and has correct prefix
```

### Runtime Issues

**Issue**: Realtime not working
- Check Supabase RLS policies
- Verify environment variables
- Ensure tables have `ALTER PUBLICATION` enabled

**Issue**: PWA not installing
- Check manifest.json exists in /public
- Verify HTTPS (required for PWA)
- Check service worker in DevTools

## 📝 License

This project is open source and available under the MIT License.

## 👥 Credits

- **Developed by**: Electronix ENSTAB Club
- **Framework**: Next.js by Vercel
- **Database**: Supabase
- **Design**: Custom "World Cup" aesthetic

## 🆘 Support

For questions or issues:
1. Check the [implementation plan](./brain/implementation_plan.md)
2. Review the [walkthrough](./brain/walkthrough.md)
3. Contact the development team

---

**Built with ❤️ for EnstaRobots World Cup 2026**
