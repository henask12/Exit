import React from 'react';

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: ComponentProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}
