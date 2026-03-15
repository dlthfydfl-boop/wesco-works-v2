'use client';

import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useMeetingMinutes, useCreateMeetingMinutes } from '@/hooks/useWevis';
import { formatDate } from '@/lib/utils';
import type { MeetingMinutes } from '@/types';

type FormTab = 'structured' | 'voice';

export default function MeetingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState<FormTab>('structured');
  const [selectedMinutes, setSelectedMinutes] = useState<MeetingMinutes | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendeesInput, setAttendeesInput] = useState('');
  const [agendaInput, setAgendaInput] = useState('');
  const [discussionInput, setDiscussionInput] = useState('');
  const [decisionsInput, setDecisionsInput] = useState('');
  const [actionItemsInput, setActionItemsInput] = useState('');

  const { data: minutes, isLoading } = useMeetingMinutes();
  const createMutation = useCreateMeetingMinutes();

  const resetForm = useCallback(() => {
    setCustomerName('');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setAttendeesInput('');
    setAgendaInput('');
    setDiscussionInput('');
    setDecisionsInput('');
    setActionItemsInput('');
    setShowForm(false);
    setFormTab('structured');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!meetingDate) return;

      const attendees = attendeesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const agenda = agendaInput
        .split('\n')
        .map((a) => a.trim())
        .filter(Boolean);

      const discussion = discussionInput
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      const decisions = decisionsInput
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      // Parse action items: "할일 / 담당자 / 기한" per line
      const actionItems = actionItemsInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('/').map((p) => p.trim());
          return {
            task: parts[0] || line,
            assignee: parts[1] || '',
            deadline: parts[2] || '',
          };
        });

      createMutation.mutate(
        {
          customerName: customerName.trim() || undefined,
          meetingDate,
          attendees,
          structuredContent: {
            agenda,
            discussion,
            decisions,
            actionItems,
          },
        },
        { onSuccess: resetForm }
      );
    },
    [customerName, meetingDate, attendeesInput, agendaInput, discussionInput, decisionsInput, actionItemsInput, createMutation, resetForm]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="회의록"
        description="미팅 기록 관리"
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              새 회의록
            </Button>
          ) : undefined
        }
      />

      {/* New Meeting Form */}
      {showForm && (
        <DataCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tab Selection */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setFormTab('structured')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  formTab === 'structured'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                직접 입력
              </button>
              <button
                type="button"
                onClick={() => setFormTab('voice')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  formTab === 'voice'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                음성 입력
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고객사 (선택)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="고객사명"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">미팅 일시</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">참석자 (쉼표로 구분)</label>
              <input
                type="text"
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                placeholder="홍길동, 김철수, 박영희"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
              />
            </div>

            {formTab === 'structured' ? (
              <>
                {/* Structured Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">안건 (줄바꿈으로 구분)</label>
                  <textarea
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    placeholder="안건 1&#10;안건 2"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">논의 내용</label>
                  <textarea
                    value={discussionInput}
                    onChange={(e) => setDiscussionInput(e.target.value)}
                    placeholder="주요 논의 사항을 줄바꿈으로 구분"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">결정 사항</label>
                  <textarea
                    value={decisionsInput}
                    onChange={(e) => setDecisionsInput(e.target.value)}
                    placeholder="결정된 사항을 줄바꿈으로 구분"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    액션 아이템 (할일 / 담당자 / 기한)
                  </label>
                  <textarea
                    value={actionItemsInput}
                    onChange={(e) => setActionItemsInput(e.target.value)}
                    placeholder="견적서 발송 / 한상현 / 2026-03-20&#10;샘플 준비 / 김철수 / 2026-03-25"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                  />
                </div>
              </>
            ) : (
              /* Voice Input Tab */
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">음성 입력은 준비 중입니다</p>
                <p className="text-xs text-gray-400">Phase 3에서 STT 기능이 추가됩니다</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || formTab === 'voice'}>
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                취소
              </Button>
            </div>
          </form>
        </DataCard>
      )}

      {/* Meeting Minutes Detail */}
      {selectedMinutes && (
        <DataCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {selectedMinutes.customerName || '내부 회의'} 회의록
            </h3>
            <button
              onClick={() => setSelectedMinutes(null)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            {formatDate(selectedMinutes.meetingDate)}
            {selectedMinutes.attendees.length > 0 && (
              <span className="ml-2">| {selectedMinutes.attendees.join(', ')}</span>
            )}
          </div>

          {selectedMinutes.structuredContent && (
            <div className="space-y-4">
              {selectedMinutes.structuredContent.agenda.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">안건</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                    {selectedMinutes.structuredContent.agenda.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMinutes.structuredContent.discussion.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">논의 내용</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                    {selectedMinutes.structuredContent.discussion.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMinutes.structuredContent.decisions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">결정 사항</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                    {selectedMinutes.structuredContent.decisions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMinutes.structuredContent.actionItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">액션 아이템</h4>
                  <div className="space-y-2">
                    {selectedMinutes.structuredContent.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div>
                          <p className="text-gray-800">{item.task}</p>
                          <p className="text-xs text-gray-500">
                            {item.assignee && `${item.assignee}`}
                            {item.deadline && ` | ${item.deadline}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DataCard>
      )}

      {/* Minutes List */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">회의록 목록</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !minutes?.length ? (
          <EmptyState
            title="회의록이 없습니다"
            description="새 회의록 버튼을 눌러 첫 회의록을 작성하세요"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                첫 회의록 작성
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {minutes.map((m) => (
              <DataCard
                key={m.id}
                onClick={() => setSelectedMinutes(m)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {m.customerName || '내부 회의'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(m.meetingDate)}
                      {m.attendees.length > 0 && ` | ${m.attendees.slice(0, 3).join(', ')}${m.attendees.length > 3 ? ` 외 ${m.attendees.length - 3}명` : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.structuredContent?.actionItems && m.structuredContent.actionItems.length > 0 && (
                      <span className="text-xs text-gray-400">
                        액션 {m.structuredContent.actionItems.length}건
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {m.structuredContent?.agenda && m.structuredContent.agenda.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2 truncate">
                    {m.structuredContent.agenda[0]}
                    {m.structuredContent.agenda.length > 1 && ` 외 ${m.structuredContent.agenda.length - 1}건`}
                  </p>
                )}
              </DataCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
