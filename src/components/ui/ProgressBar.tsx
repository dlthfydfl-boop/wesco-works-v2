'use client';

interface ProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({ value, size = 'sm', showLabel = true }: ProgressBarProps) {
  const height = size === 'sm' ? 'h-2' : 'h-3';
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${
            clamped >= 100
              ? 'bg-green-500'
              : clamped >= 50
              ? 'bg-blue-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 w-10 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
