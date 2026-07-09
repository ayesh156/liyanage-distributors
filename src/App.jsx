import { useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import StoresManager from './components/Stores/StoresManager';
import OutstandingReport from './components/Report/OutstandingReport';
import useAppStore from './hooks/useAppStore';

// ---- Individual primitive selectors (guarantee stable getSnapshot) ----

function StoresView() {
  const { id } = useParams();
  const shops    = useAppStore((s) => s.filteredShops);
  const allShops = useAppStore((s) => s.shops);
  const shopOutstanding = useAppStore((s) => s.shopOutstanding);
  const selectedShopId = useAppStore((s) => s.selectedShopId);
  const setSelectedShopId = useAppStore((s) => s.setSelectedShopId);
  const selectedShop = useAppStore((s) => s.selectedShop);
  const selectedShopTransactions = useAppStore((s) => s.selectedShopTransactions);
  const selectedShopOutstanding = useAppStore((s) => s.selectedShopOutstanding);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const addShop = useAppStore((s) => s.addShop);
  const updateShop = useAppStore((s) => s.updateShop);
  const deleteShop = useAppStore((s) => s.deleteShop);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const routes = useAppStore((s) => s.routes);

  // Sync URL param to store
  useEffect(() => {
    if (id) {
      setSelectedShopId(parseInt(id, 10));
    } else {
      setSelectedShopId(null);
    }
  }, [id, setSelectedShopId]);

  return (
    <StoresManager
      shops={shops}
      allShops={allShops}
      shopOutstanding={shopOutstanding}
      selectedShopId={selectedShopId}
      setSelectedShopId={setSelectedShopId}
      selectedShop={selectedShop}
      selectedShopTransactions={selectedShopTransactions}
      selectedShopOutstanding={selectedShopOutstanding}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      addShop={addShop}
      updateShop={updateShop}
      deleteShop={deleteShop}
      addTransaction={addTransaction}
      deleteTransaction={deleteTransaction}
      updateTransaction={updateTransaction}
      routes={routes}
    />
  );
}

function ReportView() {
  const shops                  = useAppStore((s) => s.filteredShops);
  const allShops               = useAppStore((s) => s.shops);
  const generateOutstandingReport = useAppStore((s) => s.generateOutstandingReport);
  return (
    <OutstandingReport
      shops={shops}
      allShops={allShops}
      generateOutstandingReport={generateOutstandingReport}
    />
  );
}

function DashboardView() {
  const grandTotalOutstanding = useAppStore((s) => s.grandTotalOutstanding);
  const totalActiveDebtors    = useAppStore((s) => s.totalActiveDebtors);
  const thisMonthRecovered    = useAppStore((s) => s.thisMonthRecovered);
  const topOutstandingShops   = useAppStore((s) => s.topOutstandingShops);
  const monthlyTrend          = useAppStore((s) => s.monthlyTrend);
  const monthlyBreakdown      = useAppStore((s) => s.monthlyBreakdown);
  const shops                 = useAppStore((s) => s.shops);
  const shopOutstanding       = useAppStore((s) => s.shopOutstanding);
  const paymentDistribution   = useAppStore((s) => s.paymentDistribution);
  return (
    <Dashboard
      data={{
        grandTotalOutstanding,
        totalActiveDebtors,
        thisMonthRecovered,
        topOutstandingShops,
        monthlyTrend,
        monthlyBreakdown,
        shops,
        shopOutstanding,
        paymentDistribution,
      }}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardView />} />
        <Route path="stores" element={<StoresView />} />
        <Route path="stores/:id" element={<StoresView />} />
        <Route path="full-report" element={<ReportView />} />
      </Route>
    </Routes>
  );
}