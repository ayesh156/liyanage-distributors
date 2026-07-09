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

function computeDerived(shops, invoices, searchQuery = '') {
  const activeShops = shops.filter((s) => s.active);

  // Net outstanding per shop:
  // For each invoice: contribution = invoice.amount - invoice.received
  const shopOutstanding = {};
  shops.forEach((s) => { shopOutstanding[s.id] = 0; });
  invoices.forEach((inv) => {
    const received = inv.received || 0;
    shopOutstanding[inv.shopId] = (shopOutstanding[inv.shopId] || 0) + (inv.amount - received);
  });

  // Ensure no negative outstanding (clamp to 0)
  const grandTotalOutstanding = Object.values(shopOutstanding).reduce(
    (sum, v) => sum + Math.max(0, v), 0,
  );

  const totalActiveDebtors = activeShops.filter(
    (s) => (shopOutstanding[s.id] || 0) > 0,
  ).length;

  // This-month recovered (all payments from embedded arrays)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let thisMonthRecovered = 0;
  invoices.forEach((inv) => {
    (inv.payments || []).forEach((p) => {
      if (new Date(p.date) >= startOfMonth) {
        thisMonthRecovered += p.amount;
      }
    });
  });

  const topOutstandingShops = activeShops
    .map((s) => ({ ...s, outstanding: Math.max(0, shopOutstanding[s.id] || 0) }))
    .filter((s) => s.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 8);

  // ── Payment Mode Distribution ────────────────────────────────────────────
  const paymentDistribution = { cash: 0, cheque: 0, check: 0, total: 0 };
  invoices.forEach((inv) => {
    (inv.payments || []).forEach((p) => {
      const mode = p.paymentMode || 'cash';
      if (mode === 'cash')   paymentDistribution.cash   += p.amount;
      else if (mode === 'cheque') paymentDistribution.cheque += p.amount;
      else if (mode === 'check')  paymentDistribution.check  += p.amount;
      paymentDistribution.total += p.amount;
    });
  });

  // ── Monthly aggregation from real invoices ───────────────────────────────
  const monthMap = {};
  invoices.forEach((inv) => {
    const dt = new Date(inv.date);
    if (isNaN(dt)) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { year: dt.getFullYear(), month: dt.getMonth(), invoiced: 0, recovered: 0 };
    }
    monthMap[key].invoiced += inv.amount;
    // Sum payments from embedded array
    (inv.payments || []).forEach((p) => {
      const pdt = new Date(p.date);
      if (isNaN(pdt)) return;
      const pKey = `${pdt.getFullYear()}-${String(pdt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[pKey]) {
        monthMap[pKey] = { year: pdt.getFullYear(), month: pdt.getMonth(), invoiced: 0, recovered: 0 };
      }
      monthMap[pKey].recovered += p.amount;
    });
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

function computeSelected(shops, invoices, shopOutstanding, selectedShopId) {
  const selectedShop = shops.find((s) => s.id === selectedShopId) || null;
  const selectedShopInvoices = !selectedShopId
    ? []
    : invoices
        .filter((t) => t.shopId === selectedShopId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedShopOutstanding = Math.max(0, shopOutstanding[selectedShopId] || 0);
  return { selectedShop, selectedShopTransactions: selectedShopInvoices, selectedShopOutstanding };
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
    invoices: [...initialInvoices],
    transactions: [...initialInvoices], // backward-compat alias
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
        const derived = computeDerived(state.shops, state.invoices, state.searchQuery);
        const selected = computeSelected(state.shops, state.invoices, derived.shopOutstanding, id);
        return { ...state, selectedShopId: id, ...selected };
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        const derived = computeDerived(state.shops, state.invoices, query);
        return { ...state, searchQuery: query, ...derived };
      });
    },

    addShop: (shopData) => {
      set((state) => {
        const newShops = [
          ...state.shops,
          { id: getNextId(state.shops), ...shopData, active: true, totalPayments: 0 },
        ];
        const derived = computeDerived(newShops, state.invoices, state.searchQuery);
        const selected = computeSelected(newShops, state.invoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    updateShop: (id, data) => {
      set((state) => {
        const newShops = state.shops.map((s) => s.id === id ? { ...s, ...data } : s);
        const derived = computeDerived(newShops, state.invoices, state.searchQuery);
        const selected = computeSelected(newShops, state.invoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    deleteShop: (id) => {
      set((state) => {
        const newShops = state.shops.filter((s) => s.id !== id);
        const newInvoices = state.invoices.filter((t) => t.shopId !== id);
        const derived = computeDerived(newShops, newInvoices, state.searchQuery);
        const newSelectedId = state.selectedShopId === id ? null : state.selectedShopId;
        const selected = computeSelected(newShops, newInvoices, derived.shopOutstanding, newSelectedId);
        return { ...state, shops: newShops, invoices: newInvoices, transactions: newInvoices, selectedShopId: newSelectedId, ...derived, ...selected };
      });
    },

    toggleShopActive: (id) => {
      set((state) => {
        const newShops = state.shops.map((s) => s.id === id ? { ...s, active: !s.active } : s);
        const derived = computeDerived(newShops, state.invoices, state.searchQuery);
        const selected = computeSelected(newShops, state.invoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, shops: newShops, ...derived, ...selected };
      });
    },

    /**
     * addInvoice: Creates a new pure invoice record with an empty payments array.
     * Accepts custom docNo from form (user-typed Document No).
     * Accepts optional chequeNo for the invoice-level cheque reference.
     */
    addInvoice: (invoiceData) => {
      set((state) => {
        const docNo = invoiceData.docNo || getNextDocNo('Invoice', state.invoices);
        const newInvoice = {
          id: getNextId(state.invoices),
          ...invoiceData,
          docNo,
          docType: 'Invoice',
          paymentMode: 'credit',
          chequeNo: invoiceData.chequeNo || '',
          received: invoiceData.received || 0,
          payments: [],
        };
        const newInvoices = [...state.invoices, newInvoice];
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    /**
     * Backward-compatible addTransaction - delegates to addInvoice for Invoice type
     */
    addTransaction: (tData) => {
      const { getState } = get;
      if (tData.docType === 'Payment') {
        // Legacy Payment records are now handled via addPaymentToInvoice
        return;
      }
      get().addInvoice({
        shopId: tData.shopId,
        date: tData.date,
        amount: tData.amount,
        received: tData.received || 0,
        description: tData.description || '',
        salesPerson: tData.salesPerson || '',
        salesPersonPhone: tData.salesPersonPhone || '',
        route: tData.route || '',
      });
    },

    /**
     * addPaymentToInvoice: Appends a payment entry to an invoice's payments array
     * and updates the received sum accordingly.
     */
    addPaymentToInvoice: (invoiceId, paymentData) => {
      set((state) => {
        const newInvoices = state.invoices.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const newPayments = [
            ...(inv.payments || []),
            {
              id: getNextId(inv.payments || []),
              date: paymentData.date,
              amount: paymentData.amount,
              paymentMode: paymentData.paymentMode || 'cash',
              chequeNo: paymentData.chequeNo || '',
              bankName: paymentData.bankName || '',
              description: paymentData.description || '',
            },
          ];
          const totalReceived = (inv.received || 0) + paymentData.amount;
          return { ...inv, payments: newPayments, received: totalReceived };
        });
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    updateInvoice: (id, data) => {
      set((state) => {
        const newInvoices = state.invoices.map((inv) => {
          if (inv.id !== id) return inv;
          // Preserve payments array when updating other fields
          return { ...inv, ...data, payments: inv.payments };
        });
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    updateTransaction: (id, data) => {
      set((state) => {
        const newInvoices = state.invoices.map((inv) => {
          if (inv.id !== id) return inv;
          return { ...inv, ...data, payments: inv.payments };
        });
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    deleteInvoice: (id) => {
      set((state) => {
        const newInvoices = state.invoices.filter((t) => t.id !== id);
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    deleteTransaction: (id) => {
      set((state) => {
        const newInvoices = state.invoices.filter((t) => t.id !== id);
        const derived = computeDerived(state.shops, newInvoices, state.searchQuery);
        const selected = computeSelected(state.shops, newInvoices, derived.shopOutstanding, state.selectedShopId);
        return { ...state, invoices: newInvoices, transactions: newInvoices, ...derived, ...selected };
      });
    },

    /**
     * generateOutstandingReport: produces per-shop rows with correct running balance.
     * Uses invoice-level balanceDue (amount - received) with cumulative per-shop running balance.
     */
    generateOutstandingReport: (shopId = null) => {
      const { shops, invoices } = get();

      const shopMap = {};
      shops.forEach((s) => { shopMap[s.id] = s.name; });

      let filtered = [...invoices].sort((a, b) => new Date(a.date) - new Date(b.date));

      const shopTransactions = {};
      filtered.forEach((inv) => {
        if (shopId && inv.shopId !== shopId) return;
        if (!shopTransactions[inv.shopId]) shopTransactions[inv.shopId] = [];
        shopTransactions[inv.shopId].push(inv);
      });

      const now = new Date();
      const rows = [];

      const sortedShopIds = Object.keys(shopTransactions)
        .map(Number)
        .sort((a, b) => a - b);

      sortedShopIds.forEach((sid) => {
        let runningBalance = 0;
        shopTransactions[sid].forEach((inv) => {
          const received = inv.received || 0;
          runningBalance += (inv.amount - received);
          rows.push({
            date: inv.date,
            docNo: inv.docNo,
            docType: 'Invoice',
            chequeNo: inv.chequeNo || '—',
            bankName: inv.bankName || '—',
            paymentMode: inv.paymentMode || '—',
            amount: inv.amount,
            received: received,
            balanceDue: runningBalance,
            ageDays: Math.floor((now - new Date(inv.date)) / 86400000),
            shopId: inv.shopId,
            shopName: shopMap[sid] || 'Unknown',
            description: inv.description || '',
          });
        });
      });

      const totalOutstanding = rows
        .filter((r) => r.docType === 'Invoice')
        .reduce((sum, r) => sum + Math.max(0, r.balanceDue), 0);

      return { rows, totalOutstanding };
    },
  };
});

export default useAppStore;
