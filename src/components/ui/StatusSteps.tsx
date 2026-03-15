'use client';

const ORDER_STEPS = ['주문등록', '생산중', '생산완료', '발송준비', '발송완료', '설치완료'];

interface StatusStepsProps {
  current: string;
  steps?: string[];
}

export function StatusSteps({ current, steps = ORDER_STEPS }: StatusStepsProps) {
  const currentIdx = steps.indexOf(current);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone
                    ? isCurrent
                      ? 'bg-[#E1431B] text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isDone && !isCurrent ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  isCurrent ? 'text-[#E1431B] font-semibold' : isDone ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mt-[-16px] ${
                  i < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
