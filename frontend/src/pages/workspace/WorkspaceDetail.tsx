import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Loader2, AlertTriangle, DollarSign,
  Layers, MessageSquare, CheckCircle, Clock,
  MoreHorizontal, Flag, StopCircle,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, timeAgo } from '@/lib/utils'
import { useContractStore } from '@/store/contractStore'
import { useAuthStore } from '@/store/authStore'
import { MilestoneTimeline } from '@/components/workspace/MilestoneTimeline'
import { MessageThread } from '@/components/workspace/MessageThread'
import type { ContractStatus } from '@/types'

type Tab = 'milestones' | 'messages'

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: 'text-green-400' },
  paused:    { label: 'Paused',    color: 'text-yellow-400' },
  completed: { label: 'Completed', color: 'text-brand-400' },
  disputed:  { label: 'Disputed',  color: 'text-red-400' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground' },
}

export default function WorkspaceDetail() {
  const { contractId } = useParams<{ contractId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const {
    activeContract, activeContractLoading,
    fetchContract, clearActiveContract, updateContractStatus,
    milestones, milestonesLoading, fetchMilestones,
    messages, messagesLoading, fetchMessages, sendMessage,
  } = useContractStore()

  const [tab, setTab]             = useState<Tab>('milestones')
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState<ContractStatus | null>(null)

  useEffect(() => {
    if (!contractId) return
    fetchContract(contractId)
    fetchMilestones(contractId)
    fetchMessages(contractId)
    return () => clearActiveContract()
  }, [contractId])

  if (activeContractLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 text-brand-400 animate-spin" /></div>
  }

  if (!activeContract) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-semibold">Workspace not found</p>
        <Link to="/dashboard" className="mt-3 text-sm text-brand-400 hover:underline">Back to Dashboard</Link>
      </div>
    )
  }

  const contract    = activeContract
  const isClient    = contract.client_id === user?.id
  const isFreelancer = contract.freelancer_id === user?.id
  const peer        = isClient ? contract.freelancer : contract.client
  const peerRole    = isClient ? 'Freelancer' : 'Client'
  const isActive    = contract.status === 'active'
  const statusMeta  = STATUS_STYLES[contract.status]

  const progress = contract.milestone_count
    ? Math.round(((contract.completed_milestones ?? 0) / contract.milestone_count) * 100)
    : 0

  const handleStatusChange = async (status: ContractStatus) => {
    setActionLoading(status)
    setShowActions(false)
    try {
      await updateContractStatus(contract.id, status)
    } finally {
      setActionLoading(null)
    }
  }

  const unread = messages.filter((m) => !m.is_read && m.sender_id !== user?.id).length

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-88px)] flex flex-col">
      {/* Back + header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 shrink-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Contract header card */}
        <div className="glass rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-xs font-medium flex items-center gap-1', statusMeta.color)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusMeta.label}
                </span>
                {actionLoading && <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />}
              </div>

              <h1 className="font-bold text-lg leading-snug line-clamp-1">
                {contract.project?.title ?? 'Project Workspace'}
              </h1>

              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span>{peerRole}:</span>
                <span className="font-medium text-foreground">{peer?.full_name ?? '—'}</span>
                {peer?.is_verified && <CheckCircle className="h-3 w-3 text-brand-400" />}
                <span className="mx-1">·</span>
                <span>Started {timeAgo(contract.started_at)}</span>
              </div>
            </div>

            {/* Actions menu */}
            {isActive && (
              <div className="relative">
                <button
                  onClick={() => setShowActions((v) => !v)}
                  className="p-2 rounded-lg bg-surface-3 border border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-10 z-20 w-44 glass rounded-xl border border-white/[0.06] shadow-xl overflow-hidden">
                    <button onClick={() => handleStatusChange('paused')}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                      <Clock className="h-4 w-4" /> Pause Contract
                    </button>
                    {isClient && (
                      <>
                        <button onClick={() => handleStatusChange('completed')}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-green-400 hover:bg-green-500/10 transition-colors">
                          <CheckCircle className="h-4 w-4" /> Mark Complete
                        </button>
                        <button onClick={() => handleStatusChange('disputed')}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-orange-400 hover:bg-orange-500/10 transition-colors">
                          <Flag className="h-4 w-4" /> Open Dispute
                        </button>
                        <button onClick={() => handleStatusChange('cancelled')}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors">
                          <StopCircle className="h-4 w-4" /> Cancel Contract
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Resume if paused */}
            {contract.status === 'paused' && (
              <button onClick={() => handleStatusChange('active')} disabled={!!actionLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                Resume Contract
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
            <div className="text-center">
              <p className="text-base font-bold">{formatCurrency(contract.total_amount)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Contract Value</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold">{contract.completed_milestones ?? 0}/{contract.milestone_count ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Milestones Done</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold">{progress}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Progress</p>
            </div>
          </div>

          {/* Progress bar */}
          {contract.milestone_count > 0 && (
            <div className="mt-3 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs + content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl border border-white/[0.05] mb-4 shrink-0">
          {([
            { key: 'milestones', label: 'Milestones', icon: Layers, count: milestones.length },
            { key: 'messages',   label: 'Messages',   icon: MessageSquare, count: unread || undefined },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all',
                tab === key
                  ? 'bg-surface-4 text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 rounded-full',
                  tab === key ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-3 text-muted-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === 'milestones' ? (
            <div className="h-full overflow-y-auto">
              {milestonesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
                </div>
              ) : (
                <MilestoneTimeline contract={contract} milestones={milestones} />
              )}
            </div>
          ) : (
            <div className="h-full glass rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col">
              <MessageThread
                messages={messages}
                contractId={contract.id}
                onSend={(content, urls) => sendMessage(contract.id, content, urls)}
                loading={messagesLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for actions menu */}
      {showActions && (
        <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
      )}
    </div>
  )
}
