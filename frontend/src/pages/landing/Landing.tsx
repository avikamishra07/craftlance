import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Shield, Zap, Star, TrendingUp,
  CheckCircle, Users, Award, Clock,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
})

const FEATURES = [
  {
    icon: Shield,
    title: 'Trust-First Reputation',
    desc: 'Every freelancer is scored on on-time delivery, communication, and client retention — not just stars.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    desc: 'Our AI ranks top freelancers for your project and explains exactly why they\'re a good fit.',
  },
  {
    icon: TrendingUp,
    title: 'Verified Skills',
    desc: 'Skill badges are earned through AI-generated MCQ tests — no self-reported fluff.',
  },
  {
    icon: Award,
    title: 'Smart Proposals',
    desc: 'AI scores every proposal for clarity, relevance, professionalism, and value.',
  },
  {
    icon: Clock,
    title: 'Milestone Payments',
    desc: 'Break projects into milestones. Funds released only on approval — for both sides.',
  },
  {
    icon: Users,
    title: 'Professional Workspace',
    desc: 'Built-in communication, deliverable tracking, and revision management — all in one place.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Found a senior React dev in 24 hours. The reputation metrics made it easy to trust immediately.',
    name: 'Priya Sharma',
    role: 'CTO, FinScale',
    avatar: 'PS',
  },
  {
    quote: 'The AI proposal scorer helped me write a cover letter that won my first $5k project.',
    name: 'Alex Chen',
    role: 'Freelance Engineer',
    avatar: 'AC',
  },
  {
    quote: 'Milestone payments changed everything. No more chasing invoices.',
    name: 'Marcus Webb',
    role: 'Founder, WebFlow Agency',
    avatar: 'MW',
  },
]

const STATS = [
  { value: '12k+', label: 'Verified Freelancers' },
  { value: '$4.2M', label: 'Paid Out' },
  { value: '96%', label: 'On-time Delivery' },
  { value: '4.9★', label: 'Avg. Rating' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-0 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 left-1/4 w-64 h-64 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

        <motion.div {...fadeUp(0.1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
          Now in public beta — join 12,000+ professionals
        </motion.div>

        <motion.h1 {...fadeUp(0.15)}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl"
        >
          Professional freelancing,{' '}
          <span className="gradient-text">reimagined.</span>
        </motion.h1>

        <motion.p {...fadeUp(0.2)}
          className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed"
        >
          Craftlance connects verified freelancers with serious clients through
          trust metrics, AI matching, and professional collaboration tools — not just ratings.
        </motion.p>

        <motion.div {...fadeUp(0.25)} className="flex items-center gap-3 mt-8">
          <Link to="/register"
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-xl transition-all shadow-glow text-sm"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/projects"
            className="flex items-center gap-2 px-6 py-3 border border-white/[0.1] hover:border-white/[0.2] text-muted-foreground hover:text-foreground rounded-xl transition-all text-sm"
          >
            Browse projects
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div {...fadeUp(0.3)} className="flex items-center gap-6 mt-10 text-xs text-muted-foreground">
          {['No hidden fees', 'Verified identity', 'Milestone protection'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> {t}
            </span>
          ))}
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-16 w-full max-w-4xl glass rounded-2xl border border-white/[0.08] p-4 shadow-glass"
        >
          {/* Mini dashboard preview */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-surface-2 rounded-xl p-3 text-center">
                <p className="text-xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['On-time Delivery  96%', 'Communication  88%', 'Reliability Badge  Gold'].map((item) => (
              <div key={item} className="bg-surface-2 rounded-xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/[0.06] py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl font-bold gradient-text">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14"
          >
            <p className="text-xs font-medium text-brand-400 uppercase tracking-widest mb-3">Why Craftlance</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for professionals,<br />not just gig workers</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-brand-500/20 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 w-fit mb-4 group-hover:bg-brand-500/20 transition-all">
                  <Icon className="h-4 w-4 text-brand-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold">Trusted by builders</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(({ quote, name, role, avatar }, i) => (
              <motion.div key={name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="glass rounded-2xl p-5 border border-white/[0.06]"
              >
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-semibold text-white">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 border border-white/[0.08] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-surface opacity-60 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
              <p className="text-muted-foreground mb-6">Join the platform where professionals trust each other.</p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/register?role=freelancer"
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-xl transition-all shadow-glow"
                >
                  Join as Freelancer
                </Link>
                <Link to="/register?role=client"
                  className="px-6 py-2.5 border border-white/[0.1] hover:border-white/[0.2] text-sm rounded-xl transition-all"
                >
                  Hire Talent
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-brand flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span>Craftlance © 2025</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Blog', 'Contact'].map((l) => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
