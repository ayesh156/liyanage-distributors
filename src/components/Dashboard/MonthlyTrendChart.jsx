import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const fmt = (v) => `Rs.${(v / 1000).toFixed(0)}k`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-3 border border-gray-200 !rounded-xl shadow-light-card min-w-[180px]">
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-6 text-xs mb-1">
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            Rs. {entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyTrendChart({ data }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Monthly Outstanding Trend</h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-500 inline-block" /> Invoiced</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Recovered</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Outstanding</span>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="outstandingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="invoiced"
              name="Invoiced"
              fill="#f97316"
              fillOpacity={0.25}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
            <Area
              type="monotone"
              dataKey="outstanding"
              name="Outstanding"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#outstandingGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="recovered"
              name="Recovered"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#recoveredGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}