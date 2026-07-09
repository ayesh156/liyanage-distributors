import { create } from 'zustand';
import {
  shops as initialShops,
  transactions as initialTransactions,
  monthlyTrend as initialTrend,
  routes as initialRoutes,
  bankNames as initialBankNames,
  getNextId,
  getNextDocNo,
  getNextReceiptNo,
} from '../data/mockData';

// ── Pure computation helpers ────────────────────────────────────────────────

function computeDerived(shops, transactions, searchQuery = '') {
  const activeShops = shops.filter((s) => s.active);

  // Net outstanding per shop (Invoice adds, Payment subtracts)
  const shopOutstanding = {};
  shops.forEach((s) => { shopOutstanding[s.id] = 0; });
  transactions.forEach((t) => {
    const amount = t.docType === 'Invoice' ? t.amount : -t.amount;
    shopOutstanding[t.shopId] = (shopOutstanding[t.shopId] || 0) + amount;
  });

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
    .map((s) => ({ ...s, outstanding: shopOutstanding[s.id] || 0 }))
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
  const selectedShopOutstanding = shopOutstanding[selectedShopId] || 0;
  return { selectedShop, selectedShopTransactions, selectedShopOutstanding };
}

// ── Zustand Store ───────────────────────────────────────────────────────────

const useAppStore = create((set, get) => {
  const initialDerived = computeDerived(initialShops, initialTransactions, '');
  const initialSelected = computeSelected(
    initialShops, initialTransactions, initialDerived.shopOutstanding, null,
  );

  return {
    // Raw state
    shops: [...initialShops],
    transactions: [...initialTransactions],
    selectedShopId: null,
    searchQuery: '',

    // Derived
    ...initialDerived,
    ...initialSelected,

    // Static
    routes: initialRoutes,
    bankNames: initialBankNames,
    monthlyTrend: initialTrend,

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
        const newTransactions = [
          ...state.transactions,
          { id: getNextId(state.transactions), ...tData, docNo, ...(receiptNo ? { receiptNo } : {}) },
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

    generateOutstandingReport: (shopId = null) => {
      const { shops, transactions } = get();
      let filtered = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (shopId) filtered = filtered.filter((t) => t.shopId === shopId);

      let runningBalance = 0;
      const now = new Date();
      const rows = filtered.map((t) => {
        const isInvoice = t.docType === 'Invoice';
        runningBalance += isInvoice ? t.amount : -t.amount;
        return {
          date: t.date,
          docNo: t.docNo,
          docType: t.docType,
          chequeNo: t.chequeNo || '—',
          bankName: t.bankName || '—',
          paymentMode: t.paymentMode || '—',
          amount: isInvoice ? t.amount : -t.amount,
          balanceDue: runningBalance,
          ageDays: Math.floor((now - new Date(t.date)) / 86400000),
          shopId: t.shopId,
          shopName: shops.find((s) => s.id === t.shopId)?.name || 'Unknown',
          description: t.description || '',
        };
      });

      return { rows, totalOutstanding: rows.length > 0 ? rows[rows.length - 1].balanceDue : 0 };
    },
  };
});

export default useAppStore;
