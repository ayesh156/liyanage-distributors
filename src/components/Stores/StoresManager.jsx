import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ShopDetail from './ShopDetail';
import AddShopModal from './AddShopModal';
import AddTransactionModal from './AddTransactionModal';
import HardwareStoresTable from './HardwareStoresTable';
import InvoiceHistory from './InvoiceHistory';
import InvoicePrintView from './InvoicePrintView';
import PrintFullReport from '../Report/PrintFullReport';

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

  const handleDeleteShop = (id) => {
    deleteShop(id);
    setShowAddShop(false);
    setEditingShop(null);
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

  const handlePrintReceipt = (transaction) => {
    setPrintInvoice(transaction);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintOutstanding = (shopId) => {
    setSelectedShopId(shopId);
    setPrintOutstanding(true);
    setTimeout(() => window.print(), 100);
  };

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
              onDelete={handleDeleteShop}
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
              onDeleteShop={handleDeleteShop}
            />
            <AddShopModal
              isOpen={showAddShop}
              onClose={() => { setShowAddShop(false); setEditingShop(null); }}
              onSave={handleSaveShop}
              onDelete={handleDeleteShop}
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

      {/* Print portal */}
      {printContent && createPortal(printContent, document.body)}
    </>
  );
}
