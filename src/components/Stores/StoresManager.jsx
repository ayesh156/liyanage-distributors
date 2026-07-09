import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ShopDetail from './ShopDetail';
import AddShopModal from './AddShopModal';
import AddTransactionModal from './AddTransactionModal';
import HardwareStoresTable from './HardwareStoresTable';
import InvoiceHistory from './InvoiceHistory';
import InvoicePrintView from './InvoicePrintView';
import PrintFullReport from '../Report/PrintFullReport';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';

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
  addTransaction,
  deleteTransaction,
  updateTransaction,
  routes,
}) {
  const navigate = useNavigate();

  // UI state
  const [showAddShop,  setShowAddShop]  = useState(false);
  const [showAddTx,    setShowAddTx]    = useState(false);
  const [editingShop,  setEditingShop]  = useState(null);
  const [viewMode,     setViewMode]     = useState('list'); // 'list' | 'invoiceHistory'

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null); // shop object

  // Print state
  const [printInvoice,     setPrintInvoice]     = useState(null);
  const [printOutstanding, setPrintOutstanding] = useState(false);

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

  const handleDeleteShopRequest = (shop) => {
    setDeleteTarget(shop);
  };

  const handleDeleteShopConfirm = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    deleteShop(id);
    setDeleteTarget(null);
    // Navigate back if we deleted the currently-selected shop
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

  // ── Transaction handlers ───────────────────────────────────────────────

  const handleAddTransaction = (data) => {
    addTransaction({ ...data, shopId: selectedShopId });
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
    setViewMode('list');
    navigate('/stores');
  };

  // ── Print ──────────────────────────────────────────────────────────────
  // CRITICAL: printInvoice and printOutstanding are MUTUALLY EXCLUSIVE.
  // Each handler clears the OTHER state before triggering the print dialog,
  // preventing the "OUTSTANDING STATEMENT" container from leaking into the
  // standalone InvoicePrintView layout.

  const handlePrintReceipt = (transaction) => {
    setPrintInvoice(transaction);
    setPrintOutstanding(false);          // ← GUARD: kill outstanding render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  const handlePrintOutstanding = (shopId) => {
    setSelectedShopId(shopId);
    setPrintOutstanding(true);
    setPrintInvoice(null);               // ← GUARD: kill invoice render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  // ── After-print cleanup ──────────────────────────────────────────────
  // Resets both print states once the native print dialog closes so stale
  // portal content never lingers between print sessions.
  useEffect(() => {
    const handler = () => {
      setPrintInvoice(null);
      setPrintOutstanding(false);
    };
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  // Print portal content (portaled to body to escape Layout's print:hidden)
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
        <PrintFullReport
          isFullReport={false}
          shopOverride={selectedShop}
          transactionsOverride={selectedShopTransactions}
        />
      )}
      {printInvoice && selectedShop && (
        <InvoicePrintView shop={selectedShop} transaction={printInvoice} />
      )}
    </div>
  );

  return (
    <>
      {/* Screen content */}
      <div className="screen-content print:hidden">

        {/* ── Invoice History view ─────────────────────────────────── */}
        {viewMode === 'invoiceHistory' && selectedShop ? (
          <InvoiceHistory
            shop={selectedShop}
            transactions={selectedShopTransactions}
            outstanding={selectedShopOutstanding}
            onBack={handleBackFromInvoiceHistory}
            onAddTransaction={() => setShowAddTx(true)}
            onUpdateInvoice={handleUpdateInvoice}
            onDeleteTransaction={deleteTransaction}
            onPrintReceipt={handlePrintReceipt}
            onPrintOutstanding={handlePrintOutstanding}
            onEditShop={() => handleEditShop(selectedShop)}
          />
        ) : selectedShopId && viewMode !== 'invoiceHistory' ? (
          /* ── ShopDetail (legacy – accessible via direct URL) ──── */
          <>
            <ShopDetail
              shop={selectedShop}
              transactions={selectedShopTransactions}
              outstanding={selectedShopOutstanding}
              onBack={() => { setSelectedShopId(null); navigate('/stores'); }}
              onAddTransaction={() => setShowAddTx(true)}
              onDeleteTransaction={deleteTransaction}
              onEditShop={() => handleEditShop(selectedShop)}
            />
            <AddShopModal
              isOpen={showAddShop}
              onClose={() => { setShowAddShop(false); setEditingShop(null); }}
              onSave={handleSaveShop}
              routes={routes}
              editShop={editingShop}
            />
            <AddTransactionModal
              isOpen={showAddTx}
              onClose={() => setShowAddTx(false)}
              onSave={handleAddTransaction}
              shopName={selectedShop?.name}
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

        {/* AddTransactionModal available from InvoiceHistory */}
        {viewMode === 'invoiceHistory' && (
          <AddTransactionModal
            isOpen={showAddTx}
            onClose={() => setShowAddTx(false)}
            onSave={handleAddTransaction}
            shopName={selectedShop?.name}
          />
        )}
      </div>

      {/* Delete Confirmation Modal for Stores */}
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