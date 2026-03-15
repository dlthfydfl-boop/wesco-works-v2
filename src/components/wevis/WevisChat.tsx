'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWevisChat } from '@/hooks/useWevis';

const SUGGESTED_QUERIES = [
  '이번달 주문 현황',
  '재고 부족 목록',
  '납기 임박 주문',
  'A/S 접수 현황',
  '영업활동 요약',
];

interface WevisChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function WevisChat({ isOpen, onClose, initialQuery }: WevisChatProps) {
  const [sessionId] = useState(() => `wevis-${Date.now()}`);
  const { messages, isLoading, sendMessage } = useWevisChat(sessionId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuerySent = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle initial query
  useEffect(() => {
    if (isOpen && initialQuery && !initialQuerySent.current) {
      initialQuerySent.current = true;
      sendMessage(initialQuery);
    }
  }, [isOpen, initialQuery, sendMessage]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage(input.trim());
      setInput('');
    },
    [input, isLoading, sendMessage]
  );

  const handleSuggestion = useCallback(
    (query: string) => {
      if (isLoading) return;
      sendMessage(query);
    },
    [isLoading, sendMessage]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div className="fixed z-50 bottom-0 right-0 md:bottom-24 md:right-6 w-full md:w-[400px] md:max-h-[600px] h-[85vh] md:h-auto md:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#E1431B] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">웨비스</h3>
              <p className="text-xs text-gray-400">WESCO AI 비서</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Welcome message */}
          {messages.length === 0 && !isLoading && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-[#E1431B] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">W</span>
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    안녕하세요! 웨비스입니다.<br />무엇을 도와드릴까요?
                  </p>
                </div>
              </div>

              {/* Suggested queries */}
              <div className="flex flex-wrap gap-2 pl-9">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    className="px-3 py-1.5 text-xs font-medium text-[#E1431B] bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-[#E1431B] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">W</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-red-50 text-gray-900 rounded-tr-md'
                    : 'bg-gray-50 text-gray-800 rounded-tl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 bg-[#E1431B] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-xs">W</span>
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-gray-100 bg-white safe-area-bottom"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-[#E1431B] text-white rounded-xl hover:bg-[#c9391a] disabled:opacity-40 disabled:pointer-events-none transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
