'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CenterName } from '@/lib/humanDesign'
import type { TransitPlanetRow } from '@/lib/computeTransit'

export interface PersonMeta {
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
  type: string
  profile: string
}

export interface TransitMeta {
  personalBirthDate: string
  personalBirthTime: string
  personalBirthCity: string
  personalTimezone: string
  transitComputedAt: string
  transitPlanets: TransitPlanetRow[]
}

export interface ChartMeta {
  personA?: PersonMeta
  personB?: PersonMeta
  transitMeta?: TransitMeta
}

export interface LegacyPlanetRow {
  name: string
  blackGate: number
  blackLine: number
  redGate: number
  redLine: number
}

export interface SavedChart {
  id: string
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string | null
  type: string
  authority: string
  profile: string
  definition: string
  createdAt: string
  chartKind: string | null
  meta: ChartMeta | null
  centers: CenterName[]
  channels: string[]
  gates: number[]
  personalityGates?: number[] | null
  designGates?: number[] | null
  planets?: LegacyPlanetRow[] | null
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const msg = await res.json().then((d: { error?: string }) => d.error).catch(() => `HTTP ${res.status}`)
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

const chartsKey = ['charts'] as const

export const useCharts = (enabled: boolean) => {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: chartsKey,
    queryFn: () => apiFetch<{ charts: SavedChart[] }>('/api/charts'),
    enabled,
  })

  const charts = data?.charts ?? []

  const renameMutation = useMutation<unknown, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) =>
      apiFetch(`/api/charts/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    onSuccess: (_result, { id, name }) => {
      queryClient.setQueryData<{ charts: SavedChart[] }>(chartsKey, old =>
        old ? { charts: old.charts.map(c => c.id === id ? { ...c, name: name.trim() || null } : c) } : old
      )
    },
  })

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: (id) => apiFetch(`/api/charts/${id}`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<{ charts: SavedChart[] }>(chartsKey, old =>
        old ? { charts: old.charts.filter(c => c.id !== id) } : old
      )
    },
  })

  return {
    charts,
    loading: isLoading,
    refetch,
    renameChart: renameMutation.mutateAsync,
    renamingId: renameMutation.isPending ? renameMutation.variables?.id ?? null : null,
    deleteChart: deleteMutation.mutateAsync,
    deletingId: deleteMutation.isPending ? deleteMutation.variables ?? null : null,
  }
}
