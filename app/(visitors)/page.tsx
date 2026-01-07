"use client";

import { motion } from 'framer-motion';
import { Trophy, Zap, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSession, getUserRole } from '@/lib/auth';
import { UserRole } from '@/lib/navConfig';

export default function HomePage() {
  const [role, setRole] = useState<UserRole>('visitor');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRole(getUserRole());
    setMounted(true);
  }, []);

  const dashboardHref = role === 'admin' ? '/admin' : role === 'judge' ? '/judge' : '/team';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[#020617] py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6 inline-block"
            >
              <Trophy className="w-20 h-20 text-accent drop-shadow-[0_0_20px_rgba(0,188,212,0.4)]" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent leading-tight">
              EnstaRobots World Cup
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              The ultimate robotics competition. Track rankings, explore categories, and witness innovation in action.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {mounted && role !== 'visitor' && (
                <Link href={dashboardHref}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-accent text-background rounded-lg font-bold text-lg shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight size={20} />
                  </motion.button>
                </Link>
              )}
              <Link href="/competitions">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-lg font-bold text-lg hover:bg-white/20 transition-all"
                >
                  View Competitions
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--color-accent)] rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-[var(--color-secondary)] rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-card border-y border-card-border shadow-md shadow-black/[0.02]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={Trophy} label="Competitions" value="5" />
            <StatCard icon={Users} label="Teams" value="48" />
            <StatCard icon={Zap} label="Matches Today" value="12" />
            <StatCard icon={Calendar} label="Days Left" value="3" />
          </div>
        </div>
      </section>

      {/* Competition Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            Competition Categories
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CompetitionCard
              id="1"
              title="Junior Line Follower"
              description="Young talents navigate the track with precision."
              status="Qualifiers"
              delay={0}
            />
            <CompetitionCard
              id="2"
              title="Junior All Terrain"
              description="Overcome obstacles and conquer the challenge."
              status="Group Stage"
              delay={0.1}
            />
            <CompetitionCard
              id="3"
              title="Line Follower"
              description="Speed and accuracy meet in this classic race."
              status="Knockout"
              delay={0.2}
            />
            <CompetitionCard
              id="4"
              title="All Terrain"
              description="The ultimate test of robot engineering."
              status="Finals"
              delay={0.3}
            />
            <CompetitionCard
              id="5"
              title="Fight"
              description="Battle robots clash in the arena."
              status="Live Now"
              delay={0.4}
              isLive
            />
            <Link href="/competitions">
              <CompetitionCard
                id="0"
                title="View All"
                description="Explore the complete competition schedule."
                status=""
                delay={0.5}
                isViewAll
              />
            </Link>
          </div>
        </div>
      </section >
    </div >
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="text-center p-6 rounded-lg bg-card border border-card-border backdrop-blur-sm shadow-md shadow-black/[0.02]"
    >
      <Icon className="w-8 h-8 mx-auto mb-3 text-accent" />
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground uppercase tracking-wide">{label}</div>
    </motion.div>
  );
}

function CompetitionCard({
  id,
  title,
  description,
  status,
  delay,
  isLive = false,
  isViewAll = false
}: {
  id: string;
  title: string;
  description: string;
  status: string;
  delay: number;
  isLive?: boolean;
  isViewAll?: boolean;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.03, boxShadow: isLive ? "0 10px 40px rgba(0,188,212,0.15)" : "0 10px 30px rgba(0,0,0,0.04)" }}
      className={`p-6 h-full rounded-xl border transition-all cursor-pointer shadow-md shadow-black/[0.02] ${isLive
        ? 'bg-gradient-to-br from-accent/10 to-card border-accent'
        : isViewAll
          ? 'bg-muted/50 border-dashed border-card-border hover:border-accent/50'
          : 'bg-card border-card-border hover:border-accent/50'
        }`}
    >
      {isLive && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          <span className="text-accent font-bold text-sm uppercase tracking-wider">Live Now</span>
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>

      {status && !isLive && (
        <div className="inline-block px-3 py-1 bg-foreground/5 backdrop-blur-sm rounded-full text-xs font-semibold text-muted-foreground border border-card-border">
          {status}
        </div>
      )}

      {isViewAll && (
        <div className="text-accent font-semibold flex items-center gap-2">
          See Schedule <span className="text-xl">→</span>
        </div>
      )}
    </motion.div>
  );

  if (isViewAll) return content;
  return <Link href={`/competitions/${id}`}>{content}</Link>;
}
