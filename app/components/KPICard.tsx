interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  subtitle?: string;
  trendUp?: boolean;
}

export default function KPICard({ title, value, icon, trend, subtitle, trendUp = true }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trendUp ? "M13 7l5 5m0 0l-5 5m5-5H6" : "M13 17l5-5m0 0l-5-5m5 5H6"} />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {trend && <p className="text-sm text-gray-500">{trend}</p>}
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

