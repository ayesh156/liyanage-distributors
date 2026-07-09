import React from 'react';
import useAppStore from '../../hooks/useAppStore';

/**
 * PrintFullReport
 * ═══════════════
 *
 * Shared print layout used by BOTH print paths:
 *
 *   1. Full Master Report  (/report page → OutstandingReport.jsx)
 *      <PrintFullReport isFullReport={true} />
 *      • Reads ALL shops from global store (no prop override needed).
 *      • Hides the per-store "Outstanding Statement As At:" heading and
 *        "Dear Sir…" salutation — waste of ink on a bulk internal report.
 *      • Store blocks flow naturally across A4 pages (break-inside: auto).
 *
 *   2. Single Hardware Store Statement  (InvoiceHistory → StoresManager)
 *      <PrintFullReport isFullReport={false} shopOverride={shop} transactionsOverride={txns} />
 *      • Uses the injected shop + transaction arrays instead of the store.
 *      • Shows the heading + salutation for the client letter format.
 *      • Same table layout, same totals, same B&W print styles.
 *
 * Props
 * ─────
 * isFullReport          {boolean}   true = master report, false = single store letter
 * shopOverride          {object}    Single shop object (single-store path only)
 * transactionsOverride  {array}     Transactions for that shop (single-store path only)
 */
const PrintFullReport = ({
  isFullReport = false,
  shopOverride = null,
  transactionsOverride = null,
}) => {
  const globalShops        = useAppStore((state) => state.shops)        || [];
  const globalTransactions = useAppStore((state) => state.transactions) || [];

  // ── Fallback static dataset (matches real distribution workflow shape) ──
  const backupShops = [
    { id: '1', name: 'Metro Electrical House', address: 'Akuressa', phone: '077-3456789' },
    { id: '2', name: 'Moon Light Hardware',    address: 'Akuressa', phone: '072-3456789' },
  ];
  const backupTransactions = [
    { id: 't1', shopId: '1', date: 'May 28, 2026', docNo: 'INV-2026-033', docType: 'Invoice', chequeNo: '-', amount: 45000 },
    { id: 't2', shopId: '1', date: 'Jun 13, 2026', docNo: 'INV-2026-034', docType: 'Invoice', chequeNo: '-', amount: 35000 },
    { id: 't3', shopId: '2', date: 'May 10, 2026', docNo: 'INV-2026-018', docType: 'Invoice', chequeNo: '-', amount: 78000 },
  ];

  // ── Data source decision ────────────────────────────────────────────────
  // Single-store path injects shopOverride + transactionsOverride.
  // Full-report path reads from global store (falls back to static demo).
  const activeShops = shopOverride
    ? [shopOverride]
    : (globalShops.length > 0 ? globalShops : backupShops);

  const activeTransactions = transactionsOverride
    ? transactionsOverride
    : (globalTransactions.length > 0 ? globalTransactions : backupTransactions);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  // ── Compute net outstanding per shop (Invoices minus Payments) ──────────
  const getNetOutstanding = (shop) => {
    const shopTx = activeTransactions.filter(
      (t) => String(t.shopId) === String(shop.id),
    );
    return shopTx.reduce((sum, t) => {
      return t.docType === 'Invoice' ? sum + t.amount : sum - t.amount;
    }, 0);
  };

  // ── Filter: only render stores with a positive net outstanding ──────────
  // For single-store path we always show the shop regardless (override).
  const reportShops = shopOverride
    ? activeShops
    : activeShops.filter((shop) => getNetOutstanding(shop) > 0);

  // ── Grand total across rendered shops ───────────────────────────────────
  const grandTotal = reportShops.reduce(
    (sum, shop) => sum + getNetOutstanding(shop),
    0,
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /*
         * SCREEN: Keep the print canvas in the layout flow so the browser
         * pre-computes its print layout, but hide it visually.
         */
        @media screen {
          .mans-lanka-master-print {
            visibility: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 0 !important;
            overflow: hidden !important;
            z-index: -1 !important;
          }
        }

        /*
         * PRINT: Component-level reinforcement of index.css rules.
         * position:relative keeps the canvas in document flow so all
         * pages render correctly (position:fixed clips after page 1).
         */
        @media print {
          html, body, #root,
          #layout-main, #layout-main > div,
          .min-h-screen,
          div[class*="bg-slate-"],
          div[class*="overflow-"],
          div[class*="space-y-"] {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            position: static !important;
          }

          .mans-lanka-master-print {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            z-index: 9999999 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          /*
           * Per-store blocks — ALLOW natural page breaks.
           * break-inside:auto lets invoice rows split across A4 pages
           * for stores with many entries instead of pushing the whole
           * block to a blank new sheet.
           * margin-bottom:40px keeps stores visually separated.
           */
          .store-page-block {
            display: block !important;
            position: relative !important;
            float: none !important;
            clear: both !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin-bottom: 40px !important;
            padding: 20px 0 0 0 !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Grand total block — keep together, no forced break before */
          .final-summary-block {
            display: block !important;
            position: relative !important;
            float: none !important;
            clear: both !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            page-break-before: auto !important;
            break-before: auto !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .total-footer-row {
            display: table-row !important;
          }
        }
      `}} />

      {/* ── PRINT CANVAS ─────────────────────────────────────────────────── */}
      <div className="mans-lanka-master-print">

        {reportShops.map((shop) => {
          const shopTx = activeTransactions.filter(
            (t) => String(t.shopId) === String(shop.id),
          );
          const totalOutstanding = getNetOutstanding(shop);

          return (
            <div key={shop.id} className="store-page-block">

              {/* ── TWO-COLUMN FROM / TO HEADER BOX ────────────────────── */}
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                border:         '1px solid #000000',
                padding:        '12px',
                marginBottom:   '15px',
                background:     '#ffffff',
              }}>
                <div style={{ width: '50%' }}>
                  <strong>From:</strong><br />
                  Liyanage Distributors,<br />
                  Hakmana Road, Deiyandara.<br />
                  Tel: 070-5237647 / 071-5944711
                </div>
                <div style={{ width: '50%', borderLeft: '1px solid #000000', paddingLeft: '12px' }}>
                  <strong>To:</strong><br />
                  {shop.name}<br />
                  {shop.address || shop.route || 'Deiyandara'}<br />
                  Tel: {shop.phone || shop.contact || '—'}
                </div>
              </div>

              {/*
               * ── CONDITIONAL HEADING + SALUTATION ────────────────────────
               *
               *  isFullReport = true  → HIDDEN  (bulk internal master report)
               *  isFullReport = false → VISIBLE (single-store client letter)
               *
               * The From/To box immediately precedes the data table on the
               * full report, saving paper and keeping the layout compact.
               */}
              {!isFullReport && (
                <div style={{ marginBottom: '15px' }}>
                  <h2 style={{
                    fontSize:       '14px',
                    fontWeight:     'bold',
                    textDecoration: 'underline',
                    marginBottom:   '8px',
                    color:          '#000000',
                  }}>
                    Outstanding Statement As At: {today}
                  </h2>
                  <p style={{
                    textAlign:  'justify',
                    lineHeight: '1.6',
                    fontSize:   '12px',
                    color:      '#000000',
                    margin:     '0',
                  }}>
                    Dear Sir, Please find below the outstanding balance as at the above-mentioned
                    date and kindly make arrangements to forward the full payment at your earliest
                    convenience. All cheques should be drawn in favour of{' '}
                    <strong>Liyanage Distributors</strong>.
                  </p>
                </div>
              )}

              {/* ── TRANSACTIONS TABLE ─────────────────────────────────── */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left',  borderBottom: '1px solid #000', padding: '4px 6px' }}>Posting Date</th>
                    <th style={{ textAlign: 'left',  borderBottom: '1px solid #000', padding: '4px 6px' }}>Document No</th>
                    <th style={{ textAlign: 'left',  borderBottom: '1px solid #000', padding: '4px 6px' }}>Doc Type</th>
                    <th style={{ textAlign: 'left',  borderBottom: '1px solid #000', padding: '4px 6px' }}>Cheque No</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #000', padding: '4px 6px' }}>Amount (Rs.)</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #000', padding: '4px 6px' }}>Balance Due (Rs.)</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #000', padding: '4px 6px' }}>Age (Days)</th>
                  </tr>
                </thead>
                <tbody>
                  {shopTx.map((tx) => {
                    // Invoices carry positive balance; payments show credited amount
                    const individualBalanceDue =
                      tx.docType === 'Invoice' ? tx.amount : -tx.amount;

                    const ageDays = tx.date
                      ? Math.floor((Date.now() - new Date(tx.date).getTime()) / 86400000)
                      : '—';

                    return (
                      <tr key={tx.id}>
                        <td style={{ padding: '4px 6px' }}>{tx.date}</td>
                        <td style={{ padding: '4px 6px' }}>{tx.docNo}</td>
                        <td style={{ padding: '4px 6px' }}>{tx.docType}</td>
                        <td style={{ padding: '4px 6px' }}>{tx.chequeNo || '—'}{tx.bankName ? ` / ${tx.bankName}` : ''}</td>
                        <td style={{ textAlign: 'right', padding: '4px 6px' }}>
                          {tx.amount.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px 6px' }}>
                          {individualBalanceDue.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px 6px' }}>{ageDays}</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total row — aligned under the "Balance Due (Rs.)" column */}
                <tfoot>
                  <tr className="total-footer-row" style={{ borderTop: '2px solid #000000' }}>
                    <td
                      colSpan={5}
                      style={{
                        textAlign:  'right',
                        fontWeight: 'bold',
                        fontSize:   '13px',
                        padding:    '6px 6px 2px 6px',
                        color:      '#000000',
                      }}
                    >
                      Total Outstanding:
                    </td>
                    <td
                      style={{
                        textAlign:  'right',
                        fontWeight: 'bold',
                        fontSize:   '13px',
                        padding:    '6px 6px 2px 6px',
                        color:      '#000000',
                      }}
                    >
                      Rs.&nbsp;{totalOutstanding.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>

              {/* Signature footer — intentionally removed */}

            </div>
          );
        })}

        {/* ── GRAND TOTAL — rendered after all store blocks ───────────── */}
        {/* Only visible on the full consolidated report, hidden for single-store print */}
        {isFullReport && (
          <div className="final-summary-block">
            <div style={{
              display:        'flex',
              justifyContent: 'flex-end',
              alignItems:     'center',
              fontWeight:     'bold',
              fontSize:       '15px',
              color:          '#000000',
              borderTop:      '3px solid #000000',
              borderBottom:   '3px solid #000000',
              padding:        '12px 6px',
              letterSpacing:  '0.02em',
            }}>
              <span>Total Market Outstanding:</span>
              <span style={{ marginLeft: '16px' }}>Rs.&nbsp;{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default PrintFullReport;
