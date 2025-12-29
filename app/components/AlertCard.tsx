interface AlertCardProps {
  type: 'warning' | 'success' | 'error';
  code: string;
  time: string;
  message: string;
  showResolve?: boolean;
}

export default function AlertCard({ type, code, time, message, showResolve = false }: AlertCardProps) {
  const colors = {
    warning: {
      border: 'border-l-yellow-500',
      icon: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    success: {
      border: 'border-l-blue-500',
      icon: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    error: {
      border: 'border-l-red-500',
      icon: 'text-red-600',
      bg: 'bg-red-50'
    }
  };

  const color = colors[type];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${color.border} flex items-start justify-between`}>
      <div className="flex items-start gap-3 flex-1">
        <div className={`p-2 rounded ${color.bg}`}>
          {type === 'warning' || type === 'error' ? (
            <svg className={`w-5 h-5 ${color.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className={`w-5 h-5 ${color.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{code}</span>
            <span className="text-sm text-gray-500">{time}</span>
          </div>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      </div>
      {showResolve && (
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Resolve
        </button>
      )}
    </div>
  );
}

