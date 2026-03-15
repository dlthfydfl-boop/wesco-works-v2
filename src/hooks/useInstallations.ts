'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getInstallations,
  getInstallation,
  getInstallationBySerial,
  addInstallation,
  updateInstallation,
  getInstallationStats,
  getInspectionRecords,
  addInspectionRecord,
  getInspectionSchedules,
  updateSchedule,
  getPartsReplacements,
  addPartsReplacement,
  getInstallationLifecycle,
} from '@/lib/api/installations';
import type { InstallationStatus, ScheduleStatus } from '@/types';

const KEYS = {
  installations: 'installations',
  installation: 'installation',
  installationStats: 'installationStats',
  inspectionRecords: 'inspectionRecords',
  inspectionSchedules: 'inspectionSchedules',
  partsReplacements: 'partsReplacements',
  lifecycle: 'installationLifecycle',
} as const;

export function useInstallations(filters?: { status?: string; customer?: string }) {
  return useQuery({
    queryKey: [KEYS.installations, filters],
    queryFn: () => getInstallations(filters),
  });
}

export function useInstallation(id: string) {
  return useQuery({
    queryKey: [KEYS.installation, id],
    queryFn: () => getInstallation(id),
    enabled: !!id,
  });
}

export function useInstallationBySerial(serialNo: string) {
  return useQuery({
    queryKey: [KEYS.installation, 'serial', serialNo],
    queryFn: () => getInstallationBySerial(serialNo),
    enabled: !!serialNo,
  });
}

export function useAddInstallation() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: addInstallation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.installations] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installationStats] });
      queryClient.invalidateQueries({ queryKey: [KEYS.inspectionSchedules] });
      addToast('success', '설치 등록이 완료되었습니다');
    },
    onError: () => {
      addToast('error', '설치 등록에 실패했습니다');
    },
  });
}

export function useUpdateInstallation() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateInstallation>[1] }) =>
      updateInstallation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.installations] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installation] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installationStats] });
      addToast('success', '장비 정보가 업데이트되었습니다');
    },
    onError: () => {
      addToast('error', '업데이트에 실패했습니다');
    },
  });
}

export function useInstallationStats() {
  return useQuery({
    queryKey: [KEYS.installationStats],
    queryFn: getInstallationStats,
  });
}

export function useInspectionRecords(installationId?: string) {
  return useQuery({
    queryKey: [KEYS.inspectionRecords, installationId],
    queryFn: () => getInspectionRecords(installationId),
  });
}

export function useAddInspectionRecord() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: addInspectionRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.inspectionRecords] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installations] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installation] });
      queryClient.invalidateQueries({ queryKey: [KEYS.installationStats] });
      queryClient.invalidateQueries({ queryKey: [KEYS.inspectionSchedules] });
      queryClient.invalidateQueries({ queryKey: [KEYS.lifecycle] });
      addToast('success', '점검 완료 등록되었습니다');
    },
    onError: () => {
      addToast('error', '점검 등록에 실패했습니다');
    },
  });
}

export function useInspectionSchedules(filters?: { status?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: [KEYS.inspectionSchedules, filters],
    queryFn: () => getInspectionSchedules(filters),
  });
}

export function useUpdateSchedule() {
  const queryClient = getQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: ScheduleStatus; scheduledDate?: string; assignedTo?: string; note?: string } }) =>
      updateSchedule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.inspectionSchedules] });
    },
  });
}

export function usePartsReplacements(installationId: string) {
  return useQuery({
    queryKey: [KEYS.partsReplacements, installationId],
    queryFn: () => getPartsReplacements(installationId),
    enabled: !!installationId,
  });
}

export function useAddPartsReplacement() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: addPartsReplacement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.partsReplacements] });
      queryClient.invalidateQueries({ queryKey: [KEYS.lifecycle] });
      addToast('success', '부품 교체가 등록되었습니다');
    },
    onError: () => {
      addToast('error', '부품 교체 등록에 실패했습니다');
    },
  });
}

export function useInstallationLifecycle(id: string) {
  return useQuery({
    queryKey: [KEYS.lifecycle, id],
    queryFn: () => getInstallationLifecycle(id),
    enabled: !!id,
  });
}

export function useUpcomingInspections() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: [KEYS.inspectionSchedules, 'upcoming'],
    queryFn: () => getInspectionSchedules({ status: '예정' }),
    select: (data) => {
      const overdue = data.filter((s) => s.scheduledDate < today);
      const todayItems = data.filter((s) => s.scheduledDate === today);
      const upcoming = data.filter((s) => s.scheduledDate > today);
      return { overdue, today: todayItems, upcoming, total: data.length };
    },
  });
}
