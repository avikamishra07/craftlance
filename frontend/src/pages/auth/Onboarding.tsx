import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, ArrowLeft, Loader2, Plus, X, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/auth'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/types'

const STEPS = ['Profile', 'Skills', 'Links', 'Done']

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'UI/UX Design',
  'Figma', 'AWS', 'PostgreSQL', 'Flutter', 'Go', 'Rust',
  'Machine Learning', 'FastAPI', 'Docker', 'GraphQL',
]

const schema = z.object({
  title: z.string().min(3, 'Add a short professional title').max(100),
  bio: z.string().min(20, 'Write at least 20 characters').max(1000),
  location: z.string().optional(),
  hourly_rate: z.number().min(1).optional(),
  availability: z.enum(['available', 'busy', 'not_available'] as const),
  linkedin_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  website_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { availability: 'available' },
  })

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill))

  const nextStep = async () => {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['title', 'bio', 'location'],
      [],
      ['linkedin_url', 'github_url', 'website_url'],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const updated = await usersApi.completeOnboarding({
        ...data,
        skills,
        hourly_rate: data.hourly_rate || undefined,
        linkedin_url: data.linkedin_url || undefined,
        github_url: data.github_url || undefined,
        website_url: data.website_url || undefined,
      })
      updateUser(updated)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFreelancer = user?.role !== 'client'

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold">Craftlance</span>
        </div>
        {/* Step pills */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
                  i < step ? 'bg-brand-500/20 text-brand-300' :
                  i === step ? 'bg-brand-500 text-white shadow-glow-sm' :
                  'bg-surface-2 text-muted-foreground'
                )}
              >
                {i < step && <Check className="h-3 w-3" />}
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', i < step ? 'bg-brand-500/40' : 'bg-white/[0.06]')} />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 0: Profile basics */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold">Set up your profile</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help others understand who you are and what you do
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Professional title
                    </label>
                    <input
                      {...register('title')}
                      placeholder="e.g. Full-Stack Engineer · React & Node.js"
                      className="input-premium w-full"
                    />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Bio
                    </label>
                    <textarea
                      {...register('bio')}
                      placeholder="Tell clients what you do, your experience, and what makes you stand out..."
                      rows={4}
                      className="input-premium w-full resize-none"
                    />
                    {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Location
                      </label>
                      <input
                        {...register('location')}
                        placeholder="e.g. Mumbai, India"
                        className="input-premium w-full"
                      />
                    </div>
                    {isFreelancer && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Hourly rate (USD)
                        </label>
                        <input
                          {...register('hourly_rate', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g. 50"
                          min={1}
                          className="input-premium w-full"
                        />
                      </div>
                    )}
                  </div>

                  {isFreelancer && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Availability
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['available', 'busy', 'not_available'] as AvailabilityStatus[]).map((a) => (
                          <label
                            key={a}
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all',
                              'bg-surface-2 border-white/[0.06] hover:border-white/[0.12]'
                            )}
                          >
                            <input
                              {...register('availability')}
                              type="radio"
                              value={a}
                              className="hidden"
                            />
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              a === 'available' ? 'bg-green-500' :
                              a === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                            )} />
                            {a === 'not_available' ? 'Unavailable' : a.charAt(0).toUpperCase() + a.slice(1)}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 1: Skills */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold">Add your skills</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Skills help clients find you. Add up to 15.
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  {/* Skill input */}
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                      placeholder="Type a skill and press Enter"
                      className="input-premium flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      className="px-3 py-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-lg hover:bg-brand-500/20 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Selected skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs rounded-full"
                        >
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)}>
                            <X className="h-3 w-3 hover:text-destructive transition-colors" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Popular skills</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SKILLS.filter((s) => !skills.includes(s)).slice(0, 12).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1 text-xs bg-surface-3 border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12] rounded-full transition-all"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Links */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold">Connect your profiles</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optional — add links to build trust with clients
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  {[
                    { name: 'linkedin_url' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
                    { name: 'github_url' as const, label: 'GitHub', placeholder: 'https://github.com/yourhandle' },
                    { name: 'website_url' as const, label: 'Website / Portfolio', placeholder: 'https://yoursite.com' },
                  ].map(({ name, label, placeholder }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </label>
                      <input
                        {...register(name)}
                        placeholder={placeholder}
                        className="input-premium w-full"
                      />
                      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center mx-auto shadow-glow"
                >
                  <Check className="h-10 w-10 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold">You're all set, {user?.full_name?.split(' ')[0]}!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your Craftlance profile is ready. Start exploring opportunities.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 && step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-white/[0.08] rounded-lg hover:border-white/[0.16] transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : step === 2 ? (
              <button
                type="button"
                onClick={async () => { const v = await trigger(['linkedin_url', 'github_url', 'website_url']); if (v) setStep(3) }}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Go to dashboard <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
