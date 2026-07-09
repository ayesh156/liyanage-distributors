import { DollarSign, TrendingDown, Users, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Building2 } from 'lucide-react';

const formatCurrency = (val) => val.toLocaleString('en-US');

export default function DashboardStats({ grandTotal, recovered, debtors, paymentDistribution }) {
  const stats = [
    {
      key: 'total',
      label: 'Total Market Outstanding',
      icon: DollarSign,
      color: 'accent',
      value: `Rs. ${formatCurrency(Math.round(grandTotal))}`,
      sub: 'Pending balance across all stores',
    },
    {
      key: 'recovered',
      label: 'Recovered This Month',
      icon: TrendingDown,
      color: 'emerald',
      value: `Rs. ${formatCurrency(Math.round(recovered))}`,
      sub: 'Collections in current calendar month',
    },
    {
      key: 'debtors',
      label: 'Active Debtors',
      icon: Users,
      color: 'blue',
      value: debtors,
      sub: 'Stores with balance due > 0',
    },
  ];

  const colorMap = {
    accent:  { bg: 'from-accent-50 to-accent-100/50',  border: 'border-accent-200',  text: 'text-accent-600',  iconBg: 'bg-accent-100'  },
    emerald: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    blue:    { bg: 'from-blue-50 to-blue-100/50',       border: 'border-blue-200',    text: 'text-blue-600',    iconBg: 'bg-blue-100'    },
  };

  // Payment mode breakdown (cash / cheque / check)
  const dist = paymentDistribution || { cash: 0, cheque: 0, check: 0, total: 1 };
  const total = dist.total || 1;
  const modes = [
    { key: 'cash',   label: 'Cash',         icon: Banknote,   color: 'text-emerald-600', bg: 'bg-emerald-500', value: dist.cash   },
    { key: 'cheque', label: 'Cheque',        icon: CreditCard, color: 'text-blue-600',    bg: 'bg-blue-500',    value: dist.cheque },
    { key: 'check',  label: 'Direct Check',  icon: Building2,  color: 'text-purple-600',  bg: 'bg-purple-500',  value: dist.check  },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* ── Main stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const c = colorMap[stat.color];
          return (
            <div key={stat.key} className={`stat-card bg-gradient-to-br ${c.bg} ${c.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                  <stat.icon size={18} className={c.text} />
                </div>
              </div>
              <p className={`text-2xl font-bold mb-1 ${c.text}`}>{stat.value}</p>
              <p className="text-xs font-semibold text-gray-800">{stat.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Payment Mode Distribution Grid ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Payment Mode Distribution</h3>
          <span className="text-xs text-gray-500">
            Total Collected: <span className="text-gray-900 font-semibold">Rs. {formatCurrency(dist.total)}</span>
          </span>
        </div>

        {/* Stacked progress bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-gray-200">
          {modes.map(({ key, bg, value }) => {
            const pct = total > 0 ? (value / total) * 100 : 0;
            return pct > 0 ? (
              <div key={key} className={`${bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
            ) : null;
          })}
        </div>

        {/* Mode breakdown grid */}
        <div className="grid grid-cols-3 gap-3">
          {modes.map(({ key, label, icon: Icon, color, value }) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={key} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={color} />
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                </div>
                <p className={`text-base font-bold ${color}`}>
                  Rs. {formatCurrency(Math.round(value))}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}