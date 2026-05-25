import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    // Re-fetch user profile on mount if we have a token but no user
    if (store.isAuthenticated && !store.user) {
      store.fetchMe()
    }
  }, [])

  return store
}
