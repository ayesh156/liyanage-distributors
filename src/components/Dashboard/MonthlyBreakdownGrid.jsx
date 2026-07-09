import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const fmt = (v) => `Rs. ${(v || 0).toLocaleString('en-US')}`;
const fmtK = (v) => {
  if (!v) return '—';
  if (v >= 1000000) return `Rs. ${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000)    return `Rs. ${(v / 1000).toFixed(1)}k`;
  return fmt(v);
};

export default function MonthlyBreakdownGrid({ data }) {
  if (!data || data.length === 0) return null;

  const maxInvoiced = Math.max(...data.map((d) => d.invoiced || 0), 1);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Monthly Breakdown</h3>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          Last {data.length} months
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header w-20">Month</th>
              <th className="table-header text-right">Invoiced</th>
              <th className="table-header text-right">Recovered</th>
              <th className="table-header text-right">Outstanding</th>
              <th className="table-header w-32">Collection %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => {
              const invoiced    = row.invoiced    || row.outstanding + row.recovered || 0;
              const recovered   = row.recovered   || 0;
              const outstanding = row.outstanding || 0;
              const collectionPct = invoiced > 0 ? Math.round((recovered / invoiced) * 100) : 0;
              const barWidth = invoiced > 0 ? (invoiced / maxInvoiced) * 100 : 0;
              const isLast = idx === data.length - 1;

              const trend =
                idx === 0 ? null
                : outstanding > (data[idx - 1]?.outstanding || 0) ? 'up'
                : outstanding < (data[idx - 1]?.outstanding || 0) ? 'down'
                : 'flat';

              return (
                <tr
                  key={row.month}
                  className={`hover:bg-gray-50 transition-colors ${isLast ? 'bg-accent-50/30' : ''}`}
                >
                  <td className="table-cell font-semibold text-gray-800">
                    {row.month}
                    {isLast && (
                      <span className="ml-1.5 text-[9px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-right font-mono text-sm text-gray-600">
                    {fmtK(invoiced)}
                  </td>
                  <td className="table-cell text-right font-mono text-sm text-emerald-600">
                    {fmtK(recovered)}
                  </td>
                  <td className="table-cell text-right font-mono text-sm font-semibold">
                    <span className={outstanding > 0 ? 'text-accent-600' : 'text-emerald-600'}>
                      {fmtK(outstanding)}
                    </span>
                    {trend === 'up'   && <TrendingUp  size={12} className="inline ml-1 text-red-500" />}
                    {trend === 'down' && <TrendingDown size={12} className="inline ml-1 text-emerald-500" />}
                    {trend === 'flat' && <Minus        size={12} className="inline ml-1 text-gray-400" />}
                  </td>
                  <td className="table-cell w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            collectionPct >= 80 ? 'bg-emerald-500'
                            : collectionPct >= 50 ? 'bg-amber-500'
                            : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(collectionPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                        {collectionPct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-300 bg-gray-50">
              <td className="table-cell text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total
              </td>
              <td className="table-cell text-right font-mono text-sm font-semibold text-gray-800">
                {fmtK(data.reduce((s, r) => s + (r.invoiced || 0), 0))}
              </td>
              <td className="table-cell text-right font-mono text-sm font-semibold text-emerald-600">
                {fmtK(data.reduce((s, r) => s + (r.recovered || 0), 0))}
              </td>
              <td className="table-cell text-right font-mono text-sm font-bold text-accent-600">
                {fmtK(data[data.length - 1]?.outstanding || 0)}
              </td>
              <td className="table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}