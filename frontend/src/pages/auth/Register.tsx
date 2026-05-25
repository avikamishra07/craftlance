import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, Loader2, Briefcase, Users, Layers } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { AuthLayout } from '@/components/layout/PageWrapper'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['freelancer', 'client', 'both'] as const),
})
type FormData = z.infer<typeof schema>

const roles: { value: UserRole; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'freelancer', label: 'Freelancer', desc: 'I offer services', icon: Briefcase },
  { value: 'client', label: 'Client', desc: 'I hire talent', icon: Users },
  { value: 'both', label: 'Both', desc: 'I do both', icon: Layers },
]

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'freelancer' },
  })
  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    clearError()
    try {
      await registerUser(data)
      navigate('/onboarding', { replace: true })
    } catch {
      // error handled in store
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-xl font-semibold">Craftlance</span>
          </Link>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Professional freelancing, reimagined</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-white/[0.08]"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150',
                      selectedRole === value
                        ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                        : 'bg-surface-2 border-white/[0.06] text-muted-foreground hover:border-white/[0.12] hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-[10px] opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full name
              </label>
              <input
                {...register('full_name')}
                placeholder="Alex Johnson"
                autoComplete="name"
                className="input-premium w-full"
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="input-premium w-full"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="input-premium w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-150 shadow-glow-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Create account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account you agree to our{' '}
              <Link to="/terms" className="text-brand-400 hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </motion.p>
      </div>
    </AuthLayout>
  )
}
