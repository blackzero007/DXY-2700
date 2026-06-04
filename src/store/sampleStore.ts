import { create } from "zustand"
import type { Sample, Transition } from "@/types"
import { SampleStatus } from "@/types"
import * as api from "@/api/samples"

interface SampleStore {
  samples: Sample[]
  currentSample: (Sample & { transitions: Transition[] }) | null
  searchQuery: string
  loading: boolean
  fetchSamples: () => Promise<void>
  searchSamples: (query: string) => Promise<void>
  createSample: (data: { code: string; name: string; type: string; source: string }) => Promise<void>
  updateSampleStatus: (id: number, status: SampleStatus) => Promise<void>
  deleteSample: (id: number) => Promise<void>
  fetchSampleDetail: (id: number) => Promise<void>
  addTransition: (id: number, data: { node_name: string; operator: string; note: string }) => Promise<void>
  setSearchQuery: (query: string) => void
}

export const useSampleStore = create<SampleStore>((set, get) => ({
  samples: [],
  currentSample: null,
  searchQuery: "",
  loading: false,

  fetchSamples: async () => {
    set({ loading: true })
    try {
      const samples = await api.fetchSamples()
      set({ samples })
    } finally {
      set({ loading: false })
    }
  },

  searchSamples: async (query: string) => {
    set({ searchQuery: query, loading: true })
    try {
      const samples = await api.fetchSamples(query)
      set({ samples })
    } finally {
      set({ loading: false })
    }
  },

  createSample: async (data) => {
    await api.createSample(data)
    await get().fetchSamples()
  },

  updateSampleStatus: async (id, status) => {
    await api.updateSample(id, { status })
    await get().fetchSamples()
  },

  deleteSample: async (id) => {
    await api.deleteSample(id)
    await get().fetchSamples()
  },

  fetchSampleDetail: async (id) => {
    set({ loading: true })
    try {
      const currentSample = await api.fetchSampleById(id)
      set({ currentSample })
    } finally {
      set({ loading: false })
    }
  },

  addTransition: async (id, data) => {
    await api.addTransition(id, data)
    await get().fetchSampleDetail(id)
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}))
