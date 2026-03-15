'use client';

interface DataCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataCard({ children, onClick, className = '' }: DataCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left w-full ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}
