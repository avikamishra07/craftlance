import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// ── Auth ──────────────────────────────────────────────────────────────────────
const Landing    = lazy(() => import('@/pages/landing/Landing'))
const Login      = lazy(() => import('@/pages/auth/Login'))
const Register   = lazy(() => import('@/pages/auth/Register'))
const Onboarding = lazy(() => import('@/pages/auth/Onboarding'))
const NotFound   = lazy(() => import('@/pages/NotFound'))

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard        = lazy(() => import('@/pages/dashboard/Dashboard'))
const MyProposals      = lazy(() => import('@/pages/dashboard/MyProposals'))
const MyProjects       = lazy(() => import('@/pages/dashboard/MyProjects'))
const PaymentHistory   = lazy(() => import('@/pages/dashboard/PaymentHistory'))
const EarningsSummary  = lazy(() => import('@/pages/dashboard/EarningsSummary'))
const Reviews          = lazy(() => import('@/pages/dashboard/Reviews'))
const SkillsPage       = lazy(() => import('@/pages/dashboard/SkillsPage'))
const SavedFreelancers = lazy(() => import('@/pages/dashboard/SavedFreelancers'))

// ── Projects (M3 + M4) ────────────────────────────────────────────────────────
const BrowseProjects = lazy(() => import('@/pages/projects/BrowseProjects'))
const PostProject    = lazy(() => import('@/pages/projects/PostProject'))
const ProjectDetail  = lazy(() => import('@/pages/projects/ProjectDetail'))
const EditProject    = lazy(() => import('@/pages/projects/EditProject'))

// ── Workspace (M4 + M5) ───────────────────────────────────────────────────────
const WorkspaceDetail = lazy(() => import('@/pages/workspace/WorkspaceDetail'))

// ── Freelancer & Community (M2 + M9) ─────────────────────────────────────────
const FreelancerProfile = lazy(() => import('@/pages/FreelancerProfile'))
const CommunityPage     = lazy(() => import('@/pages/community/CommunityPage'))

const PageFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
  </div>
)

const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────────
  { path: '/',         element: <Landing /> },
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },

  // ── Onboarding ───────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute requireOnboarding={false} />,
    children: [
      { path: '/onboarding', element: <Onboarding /> },
    ],
  },

  // ── Protected app shell ───────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PageWrapper />,
        children: [

          // ── Dashboard ──────────────────────────────────────────────────────
          { path: '/dashboard',                element: <Dashboard /> },
          { path: '/dashboard/proposals',      element: <MyProposals /> },      // M3 + M7 AI
          { path: '/dashboard/projects',       element: <MyProjects /> },       // M4
          { path: '/dashboard/payments',       element: <PaymentHistory /> },   // M5
          { path: '/dashboard/earnings',       element: <EarningsSummary /> },  // M5
          { path: '/dashboard/reviews',        element: <Reviews /> },          // M6
          { path: '/dashboard/skills',         element: <SkillsPage /> },       // M8
          { path: '/dashboard/saved',          element: <SavedFreelancers /> }, // M9

          // ── Projects ───────────────────────────────────────────────────────
          { path: '/projects',               element: <BrowseProjects /> },   // M3
          { path: '/projects/new',           element: <PostProject /> },      // M3
          { path: '/projects/:id',           element: <ProjectDetail /> },    // M3
          { path: '/projects/:id/edit',      element: <EditProject /> },      // M4

          // ── Workspace ──────────────────────────────────────────────────────
          { path: '/workspace/:contractId',  element: <WorkspaceDetail /> },  // M4 + M5

          // ── Community & Profiles ───────────────────────────────────────────
          { path: '/community',              element: <CommunityPage /> },    // M9
          { path: '/profile/:userId',        element: <FreelancerProfile /> }, // M2 + M9

          // ── Settings (placeholder) ─────────────────────────────────────────
          {
            path: '/settings',
            element: (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Settings coming soon</p>
              </div>
            ),
          },
        ],
      },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '/404', element: <NotFound /> },
  { path: '*',    element: <Navigate to="/404" replace /> },
])

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  )
}
