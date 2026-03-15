'use client';

import { useState, useCallback } from 'react';
import { WevisChat } from './WevisChat';

export function WevisFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>();

  const handleOpen = useCallback((query?: string) => {
    setInitialQuery(query);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setInitialQuery(undefined);
  }, []);

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => handleOpen()}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-[#E1431B] text-white rounded-full shadow-lg hover:bg-[#c9391a] active:scale-95 transition-all flex items-center justify-center"
          aria-label="웨비스 열기"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      <WevisChat
        isOpen={isOpen}
        onClose={handleClose}
        initialQuery={initialQuery}
      />
    </>
  );
}

// Export open handler for use from other components
export { WevisFAB as default };
