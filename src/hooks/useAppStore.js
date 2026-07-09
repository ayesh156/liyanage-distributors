import { create } from 'zustand';
import {
  initialStores,
  initialInvoices,
  monthlyTrend as initialTrend,
  initialRoutes,
  initialSalesPersons,
  bankNames as initialBankNames,
  getNextId,
  getNextDocNo,
  getNextReceiptNo,
  getRouteNames,
} from '../data/mockData';

// ── Pure computation helpers ────────────────────────────────────────────────

function computeDerived(shops, transactions, searchQuery = '') {
  const activeShops = shops.filter((s) => s.active);

  // Net outstanding per shop (Invoice adds amount, Payment subtracts amount)
  const shopOutstanding = {};
  shops.forEach((s) => { shopOutstanding[s.id] = 0; });
  transactions.forEach((t) => {
    if (t.docType === 'Invoice') {
      // Use the received field: Balance Due = amount - received
      const received = t.received || 0;
      shopOutstanding[t.shopId] = (shopOutstanding[t.shopId] || 0) + (t.amount - received);
    } else {
      // Payment records reduce outstanding
      shopOutstanding[t.shopId] = (shopOutstanding[t.shopId] || 0) - t.amount;
    }
  });

  // Ensure no negative outstanding (clamp to 0)
  const grandTotalOutstanding = Object.values(shopOutstanding).reduce(
    (sum, v) => sum + Math.max(0, v), 0,
  );

  const totalActiveDebtors = activeShops.filter(
    (s) => (shopOutstanding[s.id] || 0) > 0,
  ).length;

  // This-month recovered (all payment types)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRecovered = transactions
    .filter((t) => t.docType === 'Payment' && new Date(t.date) >= startOfMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const topOutstandingShops = activeShops
    .map((s) => ({ ...s, outstanding: Math.max(0, shopOutstanding[s.id] || 0) }))
    .filter((s) => s.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 8);

  // ── Payment Mode Distribution ────────────────────────────────────────────
  // Breakdown of all collected payments by mode (cash / cheque / check)
  const paymentDistribution = { cash: 0, cheque: 0, check: 0, total: 0 };
  transactions
    .filter((t) => t.docType === 'Payment')
    .forEach((t) => {
      const mode = t.paymentMode || 'cash';
      if (mode === 'cash')   paymentDistribution.cash   += t.amount;
      else if (mode === 'cheque') paymentDistribution.cheque += t.amount;
      else if (mode === 'check')  paymentDistribution.check  += t.amount;
      paymentDistribution.total += t.amount;
    });

  // ── Monthly aggregation from real transactions ───────────────────────────
  // Groups transactions by calendar month, computes invoiced + recovered
  const monthMap = {};
  transactions.forEach((t) => {
    const dt = new Date(t.date);
    if (isNaN(dt)) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { year: dt.getFullYear(), month: dt.getMonth(), invoiced: 0, recovered: 0 };
    }
    if (t.docType === 'Invoice') monthMap[key].invoiced += t.amount;
    else monthMap[key].recovered += t.amount;
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyBreakdown = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => ({
      month: monthNames[v.month],
      invoiced: v.invoiced,
      recovered: v.recovered,
      outstanding: v.invoiced - v.recovered,
    }));

  // Filtered shops for search
  const filteredShops = !searchQuery
    ? activeShops
    : activeShops.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.route.toLowerCase().includes(q) ||
          s.contact.toLowerCase().includes(q)
        );
      });

  return {
    activeShops,
    shopOutstanding,
    grandTotalOutstanding,
    totalActiveDebtors,
    thisMonthRecovered,
    topOutstandingShops,
    filteredShops,
    paymentDistribution,
    monthlyBreakdown,
  };
}

function computeSelected(shops, transactions, shopOutstanding, selectedShopId) {
  const selectedShop = shops.find((s) => s.id === selectedShopId) || null;
  const selectedShopTransactions = !selectedShopId
    ? []
    : transactions
        .filter((t) => t.shopId === selectedShopId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedShopOutstanding = Math.max(0, shopOutstanding[selectedShopId] || 0);
  return { selectedShop, selectedShopTransactions, selectedShopOutstanding };
}

// ── Zustand Store ───────────────────────────────────────────────────────────

const useAppStore = create((set, get) => {
  const initialDerived = computeDerived(initialStores, initialInvoices, '');
  const initialSelected = computeSelected(
    initialStores, initialInvoices, initialDerived.shopOutstanding, null,
  );

  return {
    // Raw state
    shops: [...initialStores],
    transactions: [...initialInvoices],
    selectedShopId: null,
    searchQuery: '',

    // Derived
    ...initialDerived,
    ...initialSelected,

    // Sales Persons
    salesPersons: [...initialSalesPersons],

    // Static
    routes: initialRoutes,
    routeNames: getRouteNames(initialRoutes),
    bankNames: initialBankNames,
    monthlyTrend: initialTrend,

    // ── Route CRUD Actions ─────────────────────────────────────────────────

    addRoute: (routeData) => {
      set((state) => {
        const newRoutes = [
          ...state.routes,
          { id: getNextId(state.routes), ...routeData },
        ];
        return { ...state, routes: newRoutes, routeNames: getRouteNames(newRoutes) };
      });
    },

    updateRoute: (id, data) => {
      set((state) => {
        const newRoutes = state.routes.map((r) => r.id === id ? { ...r, ...data } : r);
        return { ...state, routes: newRoutes, routeNames: getRouteNames(newRoutes) };
      });
    },

    deleteRoute: (id) => {
      set((state) => {
        const newRoutes = state.routes.filter((r) => r.id !== id);
        return { ...state, routes: newRoutes, routeNames: getRouteNames(newRoutes) };
      });
    },

    // ── Sales Person CRUD Actions ────────────────────────────────────────

    addSalesPerson: (personData) => {
      set((state) => {
        const newPersons = [
          ...state.salesPersons,
          { id: getNextId(state.salesPersons), ...personData },
        ];
        return { ...state, salesPersons: newPersons };
      });
    },

    updateSalesPerson: (id, data) => {
      set((state) => {
        const newPersons = state.salesPersons.map((p) => p.id === id ? { ...p, ...data } : p);
        return { ...state, salesPersons: newPersons };
      });
    },

    deleteSalesPerson: (id) => {
      set((state) => {
        const newPersons = state.salesPersons.filter((p) => p.id !== id);
        return { ...state, salesPersons: newPersons };
      });
    },

    // ── Actions ────────────────────────────────────────────────────────────

    setSelectedShopId: (id) => {
      set((state) => {
        const derived = computeDerived(state.shops, state.transactions, state.searchQuery);
        const selected = computeSelected(state.shops, state.transactions, derived.shopOutstanding, id);
        return { ...state, selectedShopId: id, ...selected };
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        const derived = computeDerived(state.shops, state.transactions, query);
        return { ...state, searchQuery: query, ...derived };
      });
    },

    addShop: (shopData) => {
      set((state) => {
        const newShops = [
          ...state.shops,
          { id: getNextId(state.shops), ...shopData, active: true, totalPayments: 0 },
        ];
        const derived = computeDerived(newShops, state.transactions, state.searchQuery);
        const selected = computeSelected(newShops, state.transactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    updateShop: (id, data) => {
      set((state) => {
        const newShops = state.shops.map((s) => s.id === id ? { ...s, ...data } : s);
        const derived = computeDerived(newShops, state.transactions, state.searchQuery);
        const selected = computeSelected(newShops, state.transactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    deleteShop: (id) => {
      set((state) => {
        const newShops = state.shops.filter((s) => s.id !== id);
        const newTransactions = state.transactions.filter((t) => t.shopId !== id);
        const derived = computeDerived(newShops, newTransactions, state.searchQuery);
        const newSelectedId = state.selectedShopId === id ? null : state.selectedShopId;
        const selected = computeSelected(newShops, newTransactions, derived.shopOutstanding, newSelectedId);
        return { ...state, shops: newShops, transactions: newTransactions, selectedShopId: newSelectedId, ...derived, ...selected };
      });
    },

    toggleShopActive: (id) => {
      set((state) => {
        const newShops = state.shops.map((s) => s.id === id ? { ...s, active: !s.active } : s);
        const derived = computeDerived(newShops, state.transactions, state.searchQuery);
        const selected = computeSelected(newShops, state.transactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    addTransaction: (tData) => {
      set((state) => {
        const docNo = getNextDocNo(tData.docType, state.transactions);
        const receiptNo = tData.docType === 'Payment'
          ? getNextReceiptNo(state.transactions)
          : null;
        const newTransaction = {
          id: getNextId(state.transactions),
          ...tData,
          docNo,
          ...(receiptNo ? { receiptNo } : {}),
          // Ensure new Invoice records default received to 0
          ...(tData.docType === 'Invoice' ? { received: tData.received || 0 } : {}),
        };
        const newTransactions = [
          ...state.transactions,
          newTransaction,
        ];
        const derived = computeDerived(state.shops, newTransactions, state.searchQuery);
        const selected = computeSelected(state.shops, newTransactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, transactions: newTransactions, ...derived, ...selected };
      });
    },

    updateTransaction: (id, data) => {
      set((state) => {
        const newTransactions = state.transactions.map((t) => t.id === id ? { ...t, ...data } : t);
        const derived = computeDerived(state.shops, newTransactions, state.searchQuery);
        const selected = computeSelected(state.shops, newTransactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, transactions: newTransactions, ...derived, ...selected };
      });
    },

    deleteTransaction: (id) => {
      set((state) => {
        const newTransactions = state.transactions.filter((t) => t.id !== id);
        const derived = computeDerived(state.shops, newTransactions, state.searchQuery);
        const selected = computeSelected(state.shops, newTransactions, derived.shopOutstanding, state.selectedShopId);
        return { ...state, transactions: newTransactions, ...derived, ...selected };
      });
    },

    /**
     * generateOutstandingReport: produces per-shop rows with correct running balance
     * computed independently for each shop. When no shopId specified, all shops'
     * transactions are processed but each shop has its OWN running balance.
     *
     * For each Invoice row, balanceDue = amount - received (cumulative per shop).
     */
    generateOutstandingReport: (shopId = null) => {
      const { shops, transactions } = get();

      // Build a map of shop ID to shop name
      const shopMap = {};
      shops.forEach((s) => { shopMap[s.id] = s.name; });

      // Filter transactions by shop if needed
      let filtered = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Group transactions by shopId for per-shop running balance
      const shopTransactions = {};
      filtered.forEach((t) => {
        if (shopId && t.shopId !== shopId) return; // skip if filtering to specific shop
        if (!shopTransactions[t.shopId]) shopTransactions[t.shopId] = [];
        shopTransactions[t.shopId].push(t);
      });

      // Process each shop's transactions independently with its own running balance
      const now = new Date();
      const rows = [];

      // Sort shop IDs for deterministic output
      const sortedShopIds = Object.keys(shopTransactions)
        .map(Number)
        .sort((a, b) => a - b);

      sortedShopIds.forEach((sid) => {
        let runningBalance = 0;
        shopTransactions[sid].forEach((t) => {
          if (t.docType === 'Invoice') {
            // For Invoice: balanceDue = amount - received (cumulative)
            const received = t.received || 0;
            runningBalance += (t.amount - received);
            rows.push({
              date: t.date,
              docNo: t.docNo,
              docType: t.docType,
              chequeNo: t.chequeNo || '—',
              bankName: t.bankName || '—',
              paymentMode: t.paymentMode || '—',
              amount: t.amount,
              received: received,
              balanceDue: runningBalance,
              ageDays: Math.floor((now - new Date(t.date)) / 86400000),
              shopId: t.shopId,
              shopName: shopMap[sid] || 'Unknown',
              description: t.description || '',
            });
          } else {
            // Payment: reduces running balance
            runningBalance -= t.amount;
            rows.push({
              date: t.date,
              docNo: t.docNo,
              docType: t.docType,
              chequeNo: t.chequeNo || '—',
              bankName: t.bankName || '—',
              paymentMode: t.paymentMode || '—',
              amount: -t.amount,
              received: 0,
              balanceDue: runningBalance,
              ageDays: Math.floor((now - new Date(t.date)) / 86400000),
              shopId: t.shopId,
              shopName: shopMap[sid] || 'Unknown',
              description: t.description || '',
            });
          }
        });
      });

      // Total outstanding = sum of all positive per-shop running balances
      const totalOutstanding = rows
        .filter((r) => r.docType === 'Invoice')
        .reduce((sum, r) => sum + Math.max(0, r.balanceDue), 0);

      return { rows, totalOutstanding };
    },
  };
});

export default useAppStore;