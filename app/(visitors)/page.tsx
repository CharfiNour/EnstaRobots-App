"use client";

import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HomeStatCard, HomeCompetitionCard } from './components';
import { useHomePage } from './hooks/useHomePage';

export default function HomePage() {
  const { role, mounted, data, dashboardHref } = useHomePage();

  if (!data) return null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 md:py-32 border-b border-card-border">
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
              <Trophy className="w-20 h-20 text-primary drop-shadow-[0_0_20px_rgba(5,21,96,0.1)]" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight italic tracking-tighter uppercase">
              EnstaRobots World Cup
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto font-medium">
              The ultimate robotics competition. Track rankings, explore categories, and witness innovation in action.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {mounted && role !== 'visitor' && (
                <Link href={dashboardHref}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-primary text-white rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center gap-2 uppercase tracking-tight italic"
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
                  className="px-8 py-4 bg-white border-2 border-primary/20 text-primary rounded-xl font-black text-lg shadow-sm hover:border-primary/40 transition-all uppercase tracking-tight italic"
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
            {data.stats.map((stat, index) => (
              <HomeStatCard key={index} {...stat} />
            ))}
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
            {data.competitions.map((comp) => (
              <HomeCompetitionCard key={comp.id} {...comp} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
