# Deployment Guide - EnstaRobots World Cup

## Prerequisites
- Vercel account (free tier)
- Supabase project set up
- GitHub repository

## Step 1: Prepare Supabase

1. **Execute SQL Schema**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy contents from `supabase/schema.sql`
   - Execute the script

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL (e.g., `https://your-project.supabase.co`)
     - Anon/Public Key

3. **Verify RLS Policies**
   - Go to Database → Tables
   - Check that Row Level Security is enabled on all tables
   - Test policies with sample data

## Step 2: Deploy to Vercel

### Option A: Via Dashboard

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build -- --webpack`
   - Output Directory: `.next`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option B: Via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

## Step 3: Verify Deployment

### Test Checklist
- [ ] Landing page loads
- [ ] Navigation works
- [ ] Team login page accessible
- [ ] Judge login page accessible
- [ ] PWA manifest served correctly
- [ ] Service worker registered

### Quick Tests

1. **Test Team Login**
   - Create a test team in Supabase
   - Try logging in at `/auth/team`

2. **Test Judge Login**
   - Create a test judge profile
   - Try logging in at `/auth/judge`

3. **Test Realtime**
   - Open two browser windows
   - Publish an announcement
   - Verify it appears in real-time

## Step 4: Custom Domain (Optional)

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to Settings → Domains

2. **Add Domain**
   - Enter your custom domain
   - Follow DNS configuration instructions

3. **Wait for DNS Propagation**
   - Usually takes 5-30 minutes

## Step 5: PWA Testing

### Desktop
1. Open your deployed URL in Chrome
2. Look for install icon in address bar
3. Click to install
4. App should open in standalone window

### Mobile
1. Open URL in mobile browser (Chrome/Safari)
2. Tap "Add to Home Screen"
3. Icon should appear on home screen
4. Test offline functionality

## Troubleshooting

### Build Fails
**Issue**: "webpack config error"
```bash
# Update package.json scripts
"build": "next build --webpack"
```

**Issue**: "Environment variables undefined"
- Check Vercel dashboard
- Ensure `NEXT_PUBLIC_` prefix

### Runtime Errors
**Issue**: "Failed to fetch from Supabase"
- Verify Supabase URL is correct
- Check RLS policies allow public read

**Issue**: "PWA not installable"
- Verify HTTPS (Vercel provides this automatically)
- Check manifest.json exists in /public

### Performance Issues
**Issue**: "Slow loading times"
- Enable Vercel Analytics
- Check Build Logs for optimization warnings
- Consider implementing React Query for caching

## Monitoring & Analytics

### Vercel Analytics
```bash
# Install
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Supabase Logs
- Monitor Realtime connections
- Check API usage
- Review error logs

## Production Checklist

- [ ] All environment variables set
- [ ] Database schema executed
- [ ] RLS policies verified
- [ ] Test accounts created (team, judge, admin)
- [ ] PWA installable
- [ ] Mobile responsive tested
- [ ] Cross-browser tested
- [ ] Realtime working
- [ ] Offline scoring functional
- [ ] Custom domain configured (if applicable)

## Post-Deployment

### Initial Data Setup
1. Create competitions via Admin panel
2. Add teams via Admin panel
3. Schedule matches
4. Test complete flow from visitor → team → judge → admin

### User Onboarding
1. Distribute team codes to competitors
2. Provide judge credentials via secure channel
3. Brief admins on dashboard usage

## Rollback Procedure

If deployment has issues:

1. **Via Vercel Dashboard**
   - Go to Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

---

**Ready to Deploy!** 🚀

For support, check the [README](./README.md) or contact the development team.
