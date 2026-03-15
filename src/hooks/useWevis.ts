'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getSalesActivities,
  addSalesActivity,
  getSalesActivityStats,
  getMeetingMinutes,
  addMeetingMinutes,
  updateMeetingMinutes,
  getWevisConversations,
  addWevisMessage,
  processWevisQuery,
  type SalesActivityFilters,
  type CreateSalesActivityInput,
  type CreateMeetingMinutesInput,
} from '@/lib/api/wevis';
import type { WevisMessage } from '@/types';

// ============================================================
// Sales Activities
// ============================================================

export function useSalesActivities(filters?: SalesActivityFilters) {
  return useQuery({
    queryKey: ['salesActivities', filters],
    queryFn: () => getSalesActivities(filters),
  });
}

export function useSalesActivityStats() {
  return useQuery({
    queryKey: ['salesActivities', 'stats'],
    queryFn: getSalesActivityStats,
  });
}

export function useCreateSalesActivity() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: (input: CreateSalesActivityInput) => addSalesActivity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesActivities'] });
      addToast('success', '영업활동이 기록되었습니다');
    },
    onError: () => {
      addToast('error', '영업활동 기록에 실패했습니다');
    },
  });
}

// ============================================================
// Meeting Minutes
// ============================================================

export function useMeetingMinutes() {
  return useQuery({
    queryKey: ['meetingMinutes'],
    queryFn: getMeetingMinutes,
  });
}

export function useCreateMeetingMinutes() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: (input: CreateMeetingMinutesInput) => addMeetingMinutes(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetingMinutes'] });
      addToast('success', '회의록이 저장되었습니다');
    },
    onError: () => {
      addToast('error', '회의록 저장에 실패했습니다');
    },
  });
}

export function useUpdateMeetingMinutes() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateMeetingMinutesInput> }) =>
      updateMeetingMinutes(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetingMinutes'] });
      addToast('success', '회의록이 수정되었습니다');
    },
    onError: () => {
      addToast('error', '회의록 수정에 실패했습니다');
    },
  });
}

// ============================================================
// WEVIS Chat
// ============================================================

export function useWevisChat(sessionId: string) {
  const [messages, setMessages] = useState<WevisMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial conversation
  const conversationQuery = useQuery({
    queryKey: ['wevisChat', sessionId],
    queryFn: () => getWevisConversations(sessionId),
    enabled: !!sessionId,
  });

  // Sync query data to local state
  if (conversationQuery.data && messages.length === 0 && conversationQuery.data.length > 0) {
    setMessages(conversationQuery.data);
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);

      // Add user message optimistically
      const userMsg: WevisMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Save user message to DB
        const savedUserMsg = await addWevisMessage(sessionId, 'user', content);
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? savedUserMsg : m))
        );

        // Process query
        const response = await processWevisQuery(content);

        // Save assistant message to DB
        const savedAssistantMsg = await addWevisMessage(sessionId, 'assistant', response);
        setMessages((prev) => [...prev, savedAssistantMsg]);
      } catch {
        // Add error message locally
        const errorMsg: WevisMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '죄송합니다, 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    isInitialLoading: conversationQuery.isLoading,
  };
}

export function useWevisQuery() {
  return useMutation({
    mutationFn: (query: string) => processWevisQuery(query),
  });
}
