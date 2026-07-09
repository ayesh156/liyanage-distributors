import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Search, Printer, Store, CalendarDays, FileText, 
  ChevronDown, TrendingUp, Building2,
  MapPin, Phone, User, DollarSign, FileSpreadsheet
} from 'lucide-react';
import SmartCombobox from '../ui/SmartCombobox';
import PrintFullReport from './PrintFullReport';
import Pagination from '../ui/Pagination';

const formatCurrency = (val) => {
  const sign = val < 0 ? '-' : '';
  return `${sign}Rs. ${Math.abs(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getAgeDays = (dateStr) => {
  const now = new Date();
  const postingDate = new Date(dateStr);
  return Math.floor((now - postingDate) / (1000 * 60 * 60 * 24));
};

const getAgeBucket = (days) => {
  if (days <= 15) return { label: '0-15 days', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', barColor: 'bg-emerald-500' };
  if (days <= 30) return { label: '16-30 days', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', barColor: 'bg-yellow-500' };
  if (days <= 60) return { label: '31-60 days', color: 'bg-orange-50 text-orange-700 border-orange-200', barColor: 'bg-orange-500' };
  return { label: '60+ days', color: 'bg-red-50 text-red-700 border-red-200', barColor: 'bg-red-500' };
};

export default function OutstandingReport({ shops, allShops, generateOutstandingReport }) {
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedBuckets, setExpandedBuckets] = useState({});
  
  // ── Per-group pagination state keyed by shopId ──
  const [currentPages, setCurrentPages] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Reset all per-group pages when shop selection or rows-per-page changes
  useEffect(() => { setCurrentPages({}); }, [selectedShopId, rowsPerPage]);

  // Helper: get/set current page for a specific shop group
  const getGroupPage = (shopId) => currentPages[shopId] || 1;
  const setGroupPage = (shopId, page) =>
    setCurrentPages(prev => ({ ...prev, [shopId]: page }));

  // Generate comprehensive report data grouped by shop
  const { shopGroups, totalMarketOutstanding, summary } = useMemo(() => {
    const selectedId = selectedShopId === 'all' ? null : parseInt(selectedShopId);
    
    // Get raw report data - all transactions sorted by date with per-shop running balance
    const { rows } = generateOutstandingReport(selectedId);
    
    // Group by shop — rows already have correct balanceDue from generateOutstandingReport
    const groups = {};
    rows.forEach(row => {
      if (!groups[row.shopId]) {
        const shop = allShops.find(s => s.id === row.shopId);
        groups[row.shopId] = {
          shopId: row.shopId,
          shopName: row.shopName,
          shop,
          invoices: [],
          totalOutstanding: 0,
          totalInvoiced: 0,
          totalReceived: 0,
          invoiceCount: 0,
        };
      }
      const group = groups[row.shopId];
      
      if (row.docType === 'Invoice') {
        group.invoices.push({
          ...row,
          ageDays: row.ageDays,
          ageBucket: getAgeBucket(row.ageDays),
        });
        group.totalInvoiced += row.amount;
        group.totalReceived += (row.received || 0);
        group.invoiceCount++;
      }
    });

    // Calculate per-shop total outstanding:
    // Each invoice's displayBalanceDue = amount - received (non-cumulative, per-row net)
    // Shop total = sum of per-invoice displayBalanceDue values
    Object.values(groups).forEach(group => {
      group.totalOutstanding = group.invoices.reduce((sum, inv) => {
        const netValue = (Number(inv.amount) || 0) - (Number(inv.received) || 0);
        return sum + Math.max(0, netValue);
      }, 0);
    });

    // Grand total aggregating per-shop totals (non-cumulative sum)
    const totalOutstanding = Object.values(groups).reduce((sum, g) => sum + Math.max(0, g.totalOutstanding || 0), 0);
    
    // Summary stats
    const shopsWithOutstanding = Object.values(groups).filter(g => (g.totalOutstanding || 0) > 0);
    const totalInvoiceCount = Object.values(groups).reduce((sum, g) => sum + g.invoiceCount, 0);
    const totalInvoiceAmount = Object.values(groups).reduce((sum, g) => sum + g.totalInvoiced, 0);
    const totalReceivedAmount = Object.values(groups).reduce((sum, g) => sum + g.totalReceived, 0);
    const avgOutstanding = shopsWithOutstanding.length > 0 
      ? totalOutstanding / shopsWithOutstanding.length 
      : 0;
    const highestOutstanding = shopsWithOutstanding.length > 0
      ? Math.max(...shopsWithOutstanding.map(g => g.totalOutstanding || 0))
      : 0;

    return {
      shopGroups: Object.values(groups).sort((a, b) => {
        const routeCmp = (a.shop?.route || '').localeCompare(b.shop?.route || '');
        if (routeCmp !== 0) return routeCmp;
        return a.shopName.localeCompare(b.shopName);
      }),
      totalMarketOutstanding: totalOutstanding,
      summary: { 
        shopsWithOutstandingCount: shopsWithOutstanding.length, 
        totalInvoiceCount, 
        totalInvoiceAmount,
        totalReceivedAmount,
        avgOutstanding, 
        highestOutstanding 
      },
    };
  }, [selectedShopId, generateOutstandingReport, allShops]);

  // Sort invoices within a group
  const getSortedInvoices = useCallback((invoices) => {
    return [...invoices].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date) - new Date(b.date);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'received') cmp = (a.received || 0) - (b.received || 0);
      else if (sortField === 'balanceDue') cmp = a.balanceDue - b.balanceDue;
      else if (sortField === 'ageDays') cmp = a.ageDays - b.ageDays;
      else cmp = a.docNo.localeCompare(b.docNo);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleBucket = (shopId) => {
    setExpandedBuckets(prev => ({ ...prev, [shopId]: !prev[shopId] }));
  };

  // Shop options for SmartCombobox
  const shopOptions = useMemo(() => {
    const routeColors = {
      'Morawaka':      'bg-emerald-100 text-emerald-700',
      'Akuressa':      'bg-blue-100 text-blue-700',
      'Deniyaya':      'bg-purple-100 text-purple-700',
      'Urubokka':      'bg-amber-100 text-amber-700',
      'Kamburupitiya': 'bg-rose-100 text-rose-700',
      'Kotapola':      'bg-cyan-100 text-cyan-700',
      'Hakmana':       'bg-orange-100 text-orange-700',
    };

    return [
      { 
        value: 'all', 
        label: 'All Stores — Consolidated', 
        icon: <Building2 className="w-4 h-4 text-accent-500" />,
        subtitle: `Total ${allShops.length} stores`,
      },
      ...allShops.map(s => ({
        value: String(s.id),
        label: s.name,
        subtitle: `${s.route} • ${s.contact}`,
        icon: (
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${routeColors[s.route] || 'bg-gray-100 text-gray-500'}`}>
            {s.name[0]}
          </div>
        ),
      })),
    ];
  }, [allShops]);

  const handleShopChange = (option) => {
    setSelectedShopId(option.value);
  };

  // NOTE: Never call setTheme() or modify theme state here.
  // All print styling is handled purely by @media print CSS in index.css.
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = useCallback(() => {
    const headers = ['Shop Name', 'Route', 'Contact', '#', 'Posting Date', 'Document No', 'Description', 'Payment Mode', 'Cheque No', 'Bank', 'Amount', 'Balance Due', 'Age (Days)'];
    const csvRows = [headers.join(',')];
    
    let idx = 1;
    shopGroups.filter(g => (g.totalOutstanding || 0) > 0).forEach(group => {
      getSortedInvoices(group.invoices).forEach(inv => {
        csvRows.push([
          `"${group.shopName}"`,
          `"${group.shop?.route || ''}"`,
          `"${group.shop?.contact || ''}"`,
          idx++,
          inv.date,
          inv.docNo,
          `"${inv.description || ''}"`,
          `"${inv.paymentMode || ''}"`,
          `"${inv.chequeNo || ''}"`,
          `"${inv.bankName || ''}"`,
          inv.amount,
          inv.balanceDue,
          inv.ageDays,
        ].join(','));
      });
      csvRows.push(['', '', '', '', '', '', `"${group.shopName} Outstanding: ${formatCurrency(group.totalOutstanding)}"`, '', '', '', '', '', ''].join(','));
    });
    
    csvRows.push(['', '', '', '', '', '', `"TOTAL MARKET OUTSTANDING: ${formatCurrency(Math.round(totalMarketOutstanding))}"`, '', '', '', '', '', ''].join(','));
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shopGroups, totalMarketOutstanding, getSortedInvoices]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-gray-400 ml-1 opacity-0 group-hover:opacity-100 dark:text-slate-500" />;
    return (
      <ChevronDown
        size={12}
        className={`ml-1 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`}
      />
    );
  };

  const activeShopsCount = allShops.filter(s => s.active).length;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="glass-card p-4 sm:p-5 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <SmartCombobox
                value={selectedShopId}
                onSelect={handleShopChange}
                options={shopOptions}
                placeholder="Search store..."
                showSearchIcon={true}
                renderTrigger={(selected) => {
                  if (!selected) return null;
                  const shop = allShops.find(s => String(s.id) === selected.value);
                  if (selected.value === 'all') {
                    return (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-accent-500" />
                        <span className="text-sm font-medium">All Stores — Consolidated</span>
                      </div>
                    );
                  }
                  if (shop) {
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-accent-100 flex items-center justify-center text-[10px] font-bold text-accent-600">
                          {shop.name[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{shop.name}</span>
                          <span className="text-[10px] text-gray-500 ml-2">{shop.route}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={handleExportCSV} className="btn-secondary text-xs flex-1 sm:flex-initial">
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={handlePrint} className="btn-primary text-xs flex-1 sm:flex-initial">
              <Printer size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-700">
                Market Total
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Total Market Outstanding</p>
            <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">{formatCurrency(Math.round(totalMarketOutstanding))}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                Active
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Active Debtors</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{summary.shopsWithOutstandingCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
              out of {activeShopsCount} active stores
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                Total
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Outstanding Invoices</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{summary.totalInvoiceCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
              totaling {formatCurrency(Math.round(summary.totalInvoiceAmount))}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                Avg
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Avg Outstanding / Debtor</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatCurrency(Math.round(summary.avgOutstanding))}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
              Highest: {formatCurrency(Math.round(summary.highestOutstanding))}
            </p>
          </div>
        </div>
      </div>

      {/* The Report Content */}
      <div id="print-content" className="space-y-4">
        {shopGroups.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">No transactions found for the selected criteria</p>
          </div>
        ) : (
          shopGroups
            .filter(group => (group.totalOutstanding || 0) > 0)
            .map((group) => {
              const sortedInvoices = getSortedInvoices(group.invoices);
              const isExpanded = expandedBuckets[group.shopId] !== false; // default expanded
              
               // ── Per-group pagination ──
               const groupPage = getGroupPage(group.shopId);
               const groupTotalPages = Math.ceil(sortedInvoices.length / rowsPerPage);
               const indexOfLastRow = groupPage * rowsPerPage;
               const indexOfFirstRow = indexOfLastRow - rowsPerPage;
              const paginatedInvoices = sortedInvoices.slice(indexOfFirstRow, indexOfLastRow);
              
              return (
                <div key={group.shopId} className="glass-card overflow-hidden">
                  {/* Shop Header */}
                  <div 
                    className="flex items-center justify-between p-4 sm:px-5 sm:py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-700/30"
                    onClick={() => toggleBucket(group.shopId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-100 to-orange-50 dark:from-accent-900/40 dark:to-orange-900/30 flex items-center justify-center text-sm font-bold text-accent-600 dark:text-accent-400">
                        {group.shopName[0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{group.shopName}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                          {group.shop?.route && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {group.shop.route}
                            </span>
                          )}
                          {group.shop?.contact && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {group.shop.contact}
                            </span>
                          )}
                          {group.shop?.salesPerson && (
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {group.shop.salesPerson}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">Outstanding</p>
                        <p className="text-lg font-bold text-accent-600 dark:text-accent-400">{formatCurrency(group.totalOutstanding)}</p>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Invoices Table */}
                  {isExpanded && (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="table-header-row">
                              <th className="table-header w-8">#</th>
                              <th className="table-header group cursor-pointer select-none w-28" onClick={() => handleSort('date')}>
                                <div className="flex items-center">
                                  Date
                                  <SortIcon field="date" />
                                </div>
                              </th>
                              <th className="table-header group cursor-pointer select-none" onClick={() => handleSort('docNo')}>
                                <div className="flex items-center">
                                  Document No
                                  <SortIcon field="docNo" />
                                </div>
                              </th>
                              <th className="table-header w-24">Doc Type</th>
                              <th className="table-header">Description</th>
                              <th className="table-header group cursor-pointer select-none text-right w-28" onClick={() => handleSort('amount')}>
                                <div className="flex items-center justify-end">
                                  Amount
                                  <SortIcon field="amount" />
                                </div>
                              </th>
                              <th className="table-header group cursor-pointer select-none text-right w-28" onClick={() => handleSort('received')}>
                                <div className="flex items-center justify-end">
                                  Received
                                  <SortIcon field="received" />
                                </div>
                              </th>
                              <th className="table-header group cursor-pointer select-none text-right w-28" onClick={() => handleSort('balanceDue')}>
                                <div className="flex items-center justify-end">
                                  Balance Due
                                  <SortIcon field="balanceDue" />
                                </div>
                              </th>
                              <th className="table-header group cursor-pointer select-none text-center w-20" onClick={() => handleSort('ageDays')}>
                                <div className="flex items-center justify-center">
                                  Age
                                  <SortIcon field="ageDays" />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="table-divide">
                            {paginatedInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
                                  No invoices found
                                </td>
                              </tr>
                            ) : (
                              paginatedInvoices.map((inv, idx) => {
                                const bucket = getAgeBucket(inv.ageDays);
                                const displayReceived = Number(inv.received) || 0;
                                const displayBalanceDue = Math.max(0, (Number(inv.amount) || 0) - displayReceived);
                                return (
                                  <tr 
                                    key={`${inv.docNo}-${idx}`}
                                    className="table-body-row"
                                  >
                                    <td className="table-cell text-gray-500 dark:text-slate-400 text-xs">
                                      {indexOfFirstRow + idx + 1}
                                    </td>
                                    <td className="table-cell">
                                      <div className="flex items-center gap-2">
                                        <CalendarDays size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                                        <span>{formatDate(inv.date)}</span>
                                      </div>
                                    </td>
                                    <td className="table-cell font-mono text-xs text-gray-500 dark:text-slate-400">
                                      {inv.docNo}
                                    </td>
                                    <td className="table-cell">
                                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-700">
                                        {inv.docType || 'Invoice'}
                                      </span>
                                    </td>
                                    <td className="table-cell text-gray-500 dark:text-slate-400 text-xs max-w-[180px] truncate" title={inv.description}>
                                      {inv.description || '—'}
                                    </td>
                                    <td className={`table-cell text-right font-mono text-sm ${
                                      inv.amount > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                      {formatCurrency(inv.amount)}
                                    </td>
                                    <td className="table-cell text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                      {displayReceived > 0 ? formatCurrency(displayReceived) : '—'}
                                    </td>
                                    <td className="table-cell text-right font-mono text-sm font-semibold text-gray-900 dark:text-slate-100">
                                      {formatCurrency(displayBalanceDue)}
                                    </td>
                                    <td className="table-cell text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${bucket.barColor}`} />
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${bucket.color}`}>
                                          {inv.ageDays}d
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Per-group Pagination — only if invoices exceed rowsPerPage */}
                      {sortedInvoices.length > rowsPerPage && (
                        <Pagination
                          currentPage={groupPage}
                          totalPages={groupTotalPages}
                          rowsPerPage={rowsPerPage}
                          onPageChange={(page) => setGroupPage(group.shopId, page)}
                          onRowsPerPageChange={setRowsPerPage}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })
        )}

        {/* Total Market Outstanding Footer */}
        {summary.shopsWithOutstandingCount > 0 && (
          <div className="glass-card border-accent-200 dark:border-accent-700 bg-gradient-to-r from-accent-50 to-orange-50 dark:from-accent-900/30 dark:to-accent-800/20 overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Total Market Outstanding</p>
                  <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-500">
                    Across {summary.shopsWithOutstandingCount} debtor stores • {summary.totalInvoiceCount} outstanding invoices
                  </p>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">
                {formatCurrency(Math.round(totalMarketOutstanding))}
              </p>
            </div>
            <div className="h-1 bg-gradient-to-r from-accent-500 via-orange-500 to-rose-500" />
          </div>
        )}
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-8 text-xs text-gray-500 text-center">
        Generated by Liyanage Distributors — Outstanding Management System | {new Date().toLocaleDateString()}
      </div>

      {/* Inline hidden print overlay */}
      <PrintFullReport isFullReport={true} />
    </div>
  );
}