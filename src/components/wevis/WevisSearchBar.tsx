'use client';

import { useState, useCallback } from 'react';
import { WevisChat } from './WevisChat';

interface WevisSearchBarProps {
  className?: string;
}

export function WevisSearchBar({ className = '' }: WevisSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | undefined>();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setSubmittedQuery(query.trim());
      setIsOpen(true);
      setQuery('');
    },
    [query]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSubmittedQuery(undefined);
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit} className={`relative ${className}`}>
        <div className="w-8 h-8 bg-[#E1431B] rounded-lg flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2">
          <span className="text-white font-bold text-xs">W</span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="웨비스에게 물어보세요..."
          className="w-full pl-14 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 shadow-sm transition-colors"
        />
      </form>

      <WevisChat
        isOpen={isOpen}
        onClose={handleClose}
        initialQuery={submittedQuery}
      />
    </>
  );
}
