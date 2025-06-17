import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  gate: string
  setUser: (user: User | null) => void
  setGate: (gate: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      gate: 'GATE_A',
      setUser: (user) => set({ user }),
      setGate: (gate) => set({ gate }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface ParkingState {
  activeTransactions: Map<string, any>
  addActiveTransaction: (plateNumber: string, data: any) => void
  removeActiveTransaction: (plateNumber: string) => void
  getActiveTransaction: (plateNumber: string) => any
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  activeTransactions: new Map(),
  addActiveTransaction: (plateNumber, data) =>
    set((state) => {
      const newMap = new Map(state.activeTransactions)
      newMap.set(plateNumber, data)
      return { activeTransactions: newMap }
    }),
  removeActiveTransaction: (plateNumber) =>
    set((state) => {
      const newMap = new Map(state.activeTransactions)
      newMap.delete(plateNumber)
      return { activeTransactions: newMap }
    }),
  getActiveTransaction: (plateNumber) => {
    return get().activeTransactions.get(plateNumber)
  },
}))

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))