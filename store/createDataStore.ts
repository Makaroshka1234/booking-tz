import { create } from "zustand"

export interface DataStoreState<T> {
  data: T
  loading: boolean
  error: Error | null
  setData: (data: T) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  reset: () => void
}

export function createDataStore<T>(initialData: T) {
  return create<DataStoreState<T>>((set) => ({
    data: initialData,
    loading: true,
    error: null,
    setData: (data) => set({ data, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => set({ data: initialData, loading: true, error: null }),
  }))
}
