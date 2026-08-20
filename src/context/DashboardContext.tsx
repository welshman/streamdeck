import { createContext, useContext } from 'react'
import { DashboardStore } from '@/hooks/useDashboardStore'

export const DashboardContext = createContext<DashboardStore | null>(null)

export function useDashboard(): DashboardStore {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return ctx
}
