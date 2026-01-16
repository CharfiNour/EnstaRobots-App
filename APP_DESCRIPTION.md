# EnstaRobots Competition Management System - Full Technical & Functional Specification

## 1. Executive Summary
**EnstaRobots App** is a high-performance, real-time competition management platform designed for robotics tournaments. It serves as a central hub connecting organizers (Admins), adjudicators (Jury), participants (Teams), and the audience (Visitors). Built with a "Tactical/Space" aesthetic, it combines a premium visual experience with robust real-time data synchronization to ensure instantaneous updates across all devices.

## 2. User Roles & Modules

### A. The Public/Visitor Experience (Live Dashboard)
*Target Audience: Spectators, Guests, Remote Viewers*
- **Live Leaderboards**: detailed ranking tables with real-time score updates using Supabase Realtime subscriptions.
- **Match Feed**: A "Live Arena Feed" showing ongoing matches, current scores, and upcoming schedules.
- **Team Profiles**: Read-only views of participating teams, their robots (complete with 3D aesthetic models/images), and statistics.
- **Announcements**: A broadcast channel for competition updates (delays, phase changes, winners).

### B. The Competitor Interface (Team Dashboard)
*Target Audience: Participating Robotic Teams*
- **Team Profile Management**: A "Space-HUD" styled editor where teams can manage their roster, upload robot details, and view their innovative "Module Status".
- **Match Schedule**: Personalized timeline of past and upcoming matches.
- **Performance Analytics**: View of their own score history and comparative stats against other teams.
- **Secure Login**: Dedicated authentication flow via unique Team Codes.

### C. The Jury Console (Adjudication System)
*Target Audience: Referees, Jury Members*
- **Real-Time Scoring Engine**: An interactive scoring interface allowing the jury to increment scores, apply penalties, and log match events instantly.
- **Live Session Control**: Ability to "Go Live" with a persistent session state that broadcasts score changes to the public instantly.
- **Validation Protocols**: Step-by-step match validation flow (Pre-match check -> Live Game -> Score Validation -> Submission).
- **Tactical UI**: High-contrast, large-touch-target interface designed for use on tablets during fast-paced matches.

### D. The Command Center (Admin Panel)
*Target Audience: Event Organizers, Superusers*
- **Competition Management**: Creation and configuration of competition categories (e.g., Sumo, Line Follower, Junior).
- **Team Administration**: Full CRUD (Create, Read, Update, Delete) capabilities for team registrations, generating credentials, and managing approvals.
- **Phase Control**: System to advance the competition state (e.g., Qualifications -> Quarter Finals -> Finals).
- **Broadcast System**: Tools to push global announcements to all connected clients.
- **User Management**: Creating and assigning Jury accounts and access levels.

---

## 3. Technical Architecture

### Core Stack
- **Framework**: **Next.js 14+** (App Router) for server-side rendering and static generation.
- **Language**: **TypeScript** for type-safe code and robust maintainability.
- **Styling**: **Vanilla CSS Modules** & **Tailwind** tailored for specific complex animations. The design system relies heavily on "Glassmorphism" (blur effects, semi-transparent layers) and "Neon/Glow" aesthetics.

### Data & Real-Time Layer
- **Backend-as-a-Service**: **Supabase** (PostgreSQL).
- **Real-Time Engine**: Uses **Supabase Realtime** channels to push database changes (Score inserts, State updates) to clients via WebSockets.
- **State Management**: Hybrid approach using React Context for local UI state and Optimistic UI updates for immediate feedback before server confirmation.
- **Offline Resilience**: Strategies implemented to handle temporary network drops during events.

### Security
- **Row Level Security (RLS)**: Database policies ensure Teams can only edit their own data, Jury can only score assigned matches, and Admins have global access.
- **Authentication**: Role-based access control (RBAC) securely separating the four user types.

---

## 4. Design Philosophy
- **Theme**: "Tactical Space Command" interface. Dark mode by default, utilizing deep blues, purples, and neon accents.
- **UX Goals**:
    - **"Wow" Factor**: High-fidelity animations and transitions to impress attendees.
    - **Clarity**: Despite the rich visuals, data hierarchy is preserved to allow quick reading of scores.
    - **Responsiveness**: Fully optimized for Mobile (Visitors), Tablets (Jury), and Desktops (Admins/Projectors).

## 5. Deployment & Scalability
- **Capacity**: Designed to handle 600+ concurrent users (requires Supabase Pro for WebSocket concurrency).
- **Infrastructure**: Vercel (Front-end) + Supabase (Back-end) setup allows for serverless scaling.
- **Monetization Ready**: The architecture allows for "Multi-tenant" style usage, making it suitable for renting out to other universities or organizations for their events.
