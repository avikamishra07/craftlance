import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <p className="text-8xl font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </motion.div>
    </div>
  )
}
