'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type NotificationType = 'feature' | 'bugfix' | 'announcement'

export interface AppNotification {
  id: string
  title: string
  body: string
  type: NotificationType
  publishedAt: string
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

const notificationsKey = ['notifications'] as const

export const useNotifications = (enabled: boolean) => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: notificationsKey,
    queryFn: () => apiFetch<{ notifications: AppNotification[]; isAdmin: boolean }>('/api/notifications'),
    enabled,
  })

  const notifications = data?.notifications ?? []
  const isAdmin = data?.isAdmin ?? false

  const createMutation = useMutation<
    { notification: AppNotification }, Error, { title: string; body: string; type: NotificationType }
  >({
    mutationFn: (payload) =>
      apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: ({ notification }) => {
      queryClient.setQueryData<{ notifications: AppNotification[]; isAdmin: boolean }>(notificationsKey, old =>
        old ? { ...old, notifications: [notification, ...old.notifications] } : old
      )
    },
  })

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: (id) => apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<{ notifications: AppNotification[]; isAdmin: boolean }>(notificationsKey, old =>
        old ? { ...old, notifications: old.notifications.filter(n => n.id !== id) } : old
      )
    },
  })

  return {
    notifications,
    isAdmin,
    loading: isLoading,
    createNotification: createMutation.mutateAsync,
    creating: createMutation.isPending,
    deleteNotification: deleteMutation.mutateAsync,
    deletingId: deleteMutation.isPending ? deleteMutation.variables ?? null : null,
  }
}
