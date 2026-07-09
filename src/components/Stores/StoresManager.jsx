import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import AddShopModal from './AddShopModal';
import AddInvoiceModal from './AddInvoiceModal';
import HardwareStoresTable from './HardwareStoresTable';
import InvoiceHistory from './InvoiceHistory';
import InvoicePrintView from './InvoicePrintView';
import OutstandingStatementPrintView from './OutstandingStatementPrintView';
import PrintFullReport from '../Report/PrintFullReport';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';

/**
 * StoresManager — master view controller for the Stores domain.
 *
 * HYDRATION GUARD:
 * ─────────────────────────────────────────────────────────────────────────────
 * On a hard browser refresh at /stores/:id, React renders this component
 * synchronously BEFORE the useEffect in App.jsx fires setSelectedShopId().
 * This means on the first render: urlShopId is present but selectedShopId is
 * still null and selectedShop is undefined.
 *
 * Fix: viewMode is initialized from urlShopId (passed directly from the URL
 * param) on mount — using a lazy useState initializer that reads the prop.
 * This guarantees the InvoiceHistory shell renders immediately, even before
 * the store has hydrated selectedShop. The InvoiceHistory component itself
 * renders a skeleton loader inside the table content area if `shop` is null,
 * keeping the full header/button architecture persistent.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function StoresManager({
  shops,
  allShops,
  shopOutstanding,
  selectedShopId,
  setSelectedShopId,
  selectedShop,
  selectedShopTransactions,
  selectedShopOutstanding,
  searchQuery,
  setSearchQuery,
  addShop,
  updateShop,
  deleteShop,
  addInvoice,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  routes,
  urlShopId,   // ← raw URL param passed synchronously from App.jsx
}) {
  const navigate = useNavigate();

  // ── viewMode — initialized synchronously from URL to prevent hydration flicker ──
  // If the URL has a shop id (urlShopId), start directly in 'invoiceHistory' view.
  // This means on hard refresh the shell never falls back to 'list'.
  const [viewMode, setViewMode] = useState(() =>
    urlShopId ? 'invoiceHistory' : 'list',
  );

  // Track whether we're in the initial hydration window (selectedShop not yet loaded)
  const isHydrating = viewMode === 'invoiceHistory' && urlShopId && !selectedShop;

  // UI state
  const [showAddShop,  setShowAddShop]  = useState(false);
  const [showAddTx,    setShowAddTx]    = useState(false);
  const [editingShop,  setEditingShop]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Print state
  const [printInvoice,     setPrintInvoice]     = useState(null);
  const [printOutstanding, setPrintOutstanding] = useState(false);

  // ── Keep viewMode in sync when URL param changes via navigation ──────────
  // We use a ref to track the previous urlShopId so we only update on actual
  // URL changes, not store re-renders.
  const prevUrlShopId = useRef(urlShopId);
  useEffect(() => {
    if (prevUrlShopId.current !== urlShopId) {
      prevUrlShopId.current = urlShopId;
      setViewMode(urlShopId ? 'invoiceHistory' : 'list');
    }
  }, [urlShopId]);

  // ── Shop CRUD handlers ─────────────────────────────────────────────────

  const handleSaveShop = (data) => {
    if (data.id) updateShop(data.id, data);
    else addShop(data);
    setShowAddShop(false);
    setEditingShop(null);
  };

  const handleEditShop = (shop) => {
    setEditingShop(shop || selectedShop);
    setShowAddShop(true);
  };

  const handleDeleteShopRequest = (shop) => setDeleteTarget(shop);

  const handleDeleteShopConfirm = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    deleteShop(id);
    setDeleteTarget(null);
    if (selectedShopId === id) {
      setSelectedShopId(null);
      setViewMode('list');
      navigate('/stores');
    }
  };

  const handleAddShop = () => {
    setEditingShop(null);
    setShowAddShop(true);
  };

  // ── Invoice handlers ───────────────────────────────────────────────────

  const handleAddInvoice = (data) => {
    addInvoice({ ...data, shopId: selectedShopId });
    setShowAddTx(false);
  };

  const handleUpdateInvoice = (id, data) => updateTransaction(id, data);

  // ── Navigation ─────────────────────────────────────────────────────────

  const handleViewInvoiceHistory = (shopId) => {
    setSelectedShopId(shopId);
    setViewMode('invoiceHistory');
    navigate(`/stores/${shopId}`);
  };

  const handleBackFromInvoiceHistory = () => {
    setSelectedShopId(null);
    setViewMode('list');
    navigate('/stores');
  };

  // ── Print ──────────────────────────────────────────────────────────────
  // Never set theme state here. All print styling via @media print in index.css.

  const handlePrintReceipt = (transaction) => {
    setPrintInvoice(transaction);
    setPrintOutstanding(false);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const handlePrintOutstanding = (shopId) => {
    setSelectedShopId(shopId);
    setPrintOutstanding(true);
    setPrintInvoice(null);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  useEffect(() => {
    const handler = () => { setPrintInvoice(null); setPrintOutstanding(false); };
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  // Print portal — portaled to body to escape Layout's print:hidden
  const printContent = (printOutstanding || printInvoice) && (
    <div className="print-portal-content">
      <style>{`
        .print-portal-content { display: none !important; }
        @media print {
          .print-portal-content { display: block !important; }
          body > #root, header, aside, .screen-content, .no-print { display: none !important; }
        }
      `}</style>
      {printOutstanding && selectedShop && (
        <OutstandingStatementPrintView
          shop={selectedShop}
          transactions={selectedShopTransactions}
          outstanding={selectedShopOutstanding}
          currentDate={new Date().toISOString().split('T')[0]}
        />
      )}
      {printInvoice && selectedShop && (
        <InvoicePrintView shop={selectedShop} transaction={printInvoice} />
      )}
    </div>
  );

  // ── Skeleton header — rendered while store is hydrating on hard refresh ──
  // Preserves the full layout shell (back button, shop name area, action
  // buttons, column headers) while the table body shows a spinner.
  const hydrationShopPlaceholder = isHydrating ? {
    id: urlShopId,
    name: '···',
    route: '···',
    contact: '···',
  } : null;

  return (
    <>
      <div className="screen-content print:hidden">

        {/* ── Invoice History view — guards against hydration gap ──────── */}
        {viewMode === 'invoiceHistory' ? (
          <>
            <InvoiceHistory
              // During hydration, pass placeholder shop so shell stays intact.
              // InvoiceHistory renders a spinner in the table body when shop.id
              // is present but transactions are empty and isHydrating is true.
              shop={selectedShop || hydrationShopPlaceholder}
              transactions={selectedShopTransactions}
              outstanding={selectedShopOutstanding}
              isHydrating={isHydrating}
              onBack={handleBackFromInvoiceHistory}
              onAddTransaction={() => setShowAddTx(true)}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteTransaction={deleteTransaction}
              onPrintReceipt={handlePrintReceipt}
              onPrintOutstanding={handlePrintOutstanding}
              onEditShop={() => handleEditShop(selectedShop)}
            />
            {/* AddInvoiceModal always mounted in invoiceHistory mode */}
            <AddInvoiceModal
              isOpen={showAddTx}
              onClose={() => setShowAddTx(false)}
              onSave={handleAddInvoice}
              shopName={selectedShop?.name}
              shopSalesPerson={selectedShop?.salesPerson}
            />
          </>
        ) : (
          /* ── Store List view ─────────────────────────────────── */
          <>
            <HardwareStoresTable
              shops={shops}
              shopOutstanding={shopOutstanding}
              onViewInvoiceHistory={handleViewInvoiceHistory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddShop={handleAddShop}
              onEditShop={handleEditShop}
              onDeleteShop={handleDeleteShopRequest}
            />
            <AddShopModal
              isOpen={showAddShop}
              onClose={() => { setShowAddShop(false); setEditingShop(null); }}
              onSave={handleSaveShop}
              routes={routes}
              editShop={editingShop}
            />
          </>
        )}
      </div>

      {/* Edit Shop modal — available from InvoiceHistory header */}
      {viewMode === 'invoiceHistory' && (
        <AddShopModal
          isOpen={showAddShop}
          onClose={() => { setShowAddShop(false); setEditingShop(null); }}
          onSave={handleSaveShop}
          routes={routes}
          editShop={editingShop}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteShopConfirm}
        entityType="store"
        entityName={deleteTarget?.name || ''}
        extraMessage={
          deleteTarget
            ? `All transactions and invoice history for this store will also be permanently removed.`
            : null
        }
      />

      {/* Print portal */}
      {printContent && createPortal(printContent, document.body)}
    </>
  );
}
