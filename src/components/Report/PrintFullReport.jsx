import React from 'react';
import useAppStore from '../../hooks/useAppStore';

/**
 * PrintFullReport — Premium Multi-Shop Outstanding Report
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REFACTORED 2026-07-09 — CRITICAL SYNCHRONISATION
 *   • Header uniformity: matches premium Invoice/Statement Print style
 *     from OutstandingStatementPrintView exactly — logo on immediate left
 *     of horizontal banner row, alongside clean corporate headings.
 *   • One-line shop branding: each hardware store grouped inside the full
 *     report uses a single horizontal descriptive metadata sequence with
 *     clean vertical pipe dividers — no layout split boxes or heavy grids.
 *   • Table constraints: pure itemized ledger grids beneath each shop row.
 *     NO secondary independent cheque-only receipt tables in this layout.
 *   • Shared print layout used by BOTH print paths:
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

  // ── Data source decision ────────────────────────────────────────────────
  const activeShops = shopOverride
    ? [shopOverride]
    : globalShops;

  const activeTransactions = transactionsOverride
    ? transactionsOverride
    : globalTransactions;

  // ── Compute net outstanding per shop (amount minus received) ──────────
  const getNetOutstanding = (shop) => {
    const shopTx = activeTransactions.filter(
      (t) => String(t.shopId) === String(shop.id),
    );
    return shopTx.reduce((sum, t) => {
      return sum + Math.max(0, (Number(t.amount) || 0) - (Number(t.received) || 0));
    }, 0);
  };

  // ── Filter: only render stores with a positive net outstanding ──────────
  const reportShops = shopOverride
    ? activeShops
    : activeShops.filter((shop) => getNetOutstanding(shop) > 0);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 0: Pre-compute all shop-level report data before rendering
  // ═══════════════════════════════════════════════════════════════════════
  const shopReportData = reportShops.map((shop) => {
    const shopTx = activeTransactions.filter(
      (t) => String(t.shopId) === String(shop.id),
    );

    const rawRows = shopTx.map((tx) => {
      // ── Safely parse all monetary values using the new ledger schema ──
      const displayAmount     = Number(tx.amount)     || 0;
      const displayReceived   = Number(tx.received)   || 0;
      const displayBalanceDue = Math.max(0, displayAmount - displayReceived);

      const ageDays = tx.date || tx.postingDate
        ? Math.floor((Date.now() - new Date(tx.date || tx.postingDate).getTime()) / 86400000)
        : '—';

      return {
        ...tx,
        displayAmount,
        displayReceived,
        displayBalanceDue,
        ageDays,
      };
    });

    // ── Only rows where balanceDue > 0 (active outstanding) ────────────
    const statementRows = rawRows.filter(
      (row) => Number(row.displayBalanceDue) > 0,
    );

    const totalOutstanding = statementRows.reduce(
      (sum, row) => sum + row.displayBalanceDue,
      0,
    );

    return { shop, statementRows, totalOutstanding };
  });

  const grandTotal = shopReportData.reduce(
    (sum, data) => sum + data.totalOutstanding,
    0,
  );

  const companyName = 'Liyanage Distributors';
  const companyAddress = 'Hakmana Road, Deiyandara.';
  const companyTel = '070-5237647 / 071-5944711';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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

        @media print {
          @page { margin: 10mm 12mm; size: A4 portrait; }

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
        }
      `}} />

      {/* ── PRINT CANVAS ─────────────────────────────────────────────────── */}
      <div className="mans-lanka-master-print" style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#000000',
        fontSize: '10pt',
        lineHeight: '1.3',
      }}>

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE 1: Document Header — PREMIUM INVOICE/STATEMENT STYLE
            ═══════════════════════════════════════════════════════════════════ */}

        {/* ── 1a. "OUTSTANDING REPORT" bold serif heading ── */}
        {isFullReport && (
          <div style={{
            textAlign: 'center',
            marginBottom: '14px',
            paddingBottom: '10px',
            borderBottom: '2px solid #1a1a2e',
          }}>
            <h1 style={{
              fontFamily: "'Times New Roman', 'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
              fontSize: '18pt',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '1px',
              color: '#1a1a2e',
              textTransform: 'uppercase',
            }}>
              Outstanding Report
            </h1>
          </div>
        )}

        {/* ── 1b. PREMIUM HEADER BANNER — matches Invoice/Statement Print exactly ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginBottom: '20px',
          borderBottom: '3px solid #1a1a2e',
          background: '#ffffff',
          borderRadius: '6px',
        }}>
          {/* LEFT: Logo + Company text in unified row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1,
            textAlign: 'left',
          }}>
            <img
              src="/inv_logo.png"
              alt="Liyanage Distributors"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div>
              <h1 style={{
                fontSize: '16pt',
                fontWeight: 900,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '0.5px',
                color: '#1a1a2e',
              }}>
                {companyName}
              </h1>
              <p style={{
                fontSize: '8pt',
                margin: '2px 0 0 0',
                color: '#333',
                lineHeight: 1.3,
              }}>
                {companyAddress} | Tel: {companyTel}
              </p>
            </div>
          </div>

          {/* RIGHT: REPORT badge (consistent with STATEMENT badge) */}
          <div style={{
            flexShrink: 0,
            textAlign: 'center',
            padding: '4px 14px',
            border: '2px solid #1a1a2e',
            borderRadius: '4px',
            backgroundColor: '#1a1a2e',
          }}>
            <span style={{
              fontSize: '12pt',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}>
              {isFullReport ? 'REPORT' : 'STATEMENT'}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE 2: Per-shop blocks — single-line shop description + table
            ═══════════════════════════════════════════════════════════════════ */}

        {shopReportData.map(({ shop, statementRows, totalOutstanding }) => (
          <div key={shop.id} className="store-page-block">

            {/* ── 2a. ONE-LINE SHOP BRANDING — single horizontal metadata sequence ── */}
            {/*     No split boxes, no matrix grids. Clean pipe-delineated line.      */}
            <div style={{
              padding: '6px 0',
              marginBottom: '10px',
              borderBottom: '1px dashed #888',
              width: '100%',
              lineHeight: '1.6',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              <span style={{
                fontWeight: 800,
                fontSize: '11pt',
                color: '#1a1a2e',
              }}>
                {shop.name || '—'}
              </span>
              <span style={{
                fontSize: '9pt',
                color: '#444',
                marginLeft: '8px',
              }}>
                — {shop.address || shop.route || '—'}
              </span>
              <span style={{
                fontSize: '9pt',
                color: '#555',
                marginLeft: '6px',
              }}>
                | {shop.route || '—'}
              </span>
              <span style={{
                fontSize: '9pt',
                color: '#555',
                marginLeft: '6px',
              }}>
                | Tel: {shop.contact || shop.phone || '—'}
              </span>
            </div>

            {/* ── 2b. Single-store heading + salutation ── */}
            {!isFullReport && (
              <div style={{ marginBottom: '12px' }}>
                <h2 style={{
                  fontSize: '12pt',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textDecoration: 'underline',
                  marginBottom: '6px',
                  color: '#000000',
                }}>
                  Outstanding Statement As At: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <p style={{
                  textAlign: 'justify',
                  lineHeight: '1.5',
                  fontSize: '9pt',
                  color: '#000000',
                  margin: 0,
                }}>
                  Dear Sir, Please find below the outstanding balance as at the above-mentioned
                  date and kindly make arrangements to forward the full payment at your earliest
                  convenience. All cheques should be drawn in favour of{' '}
                  <strong>Liyanage Distributors</strong>.
                </p>
              </div>
            )}

            {/* ── 2c. ITEMIZED LEDGER GRID — pure transactions table ── */}
            {/*     NO secondary cheque-only receipt tables in this layout. */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <thead>
                <tr style={{
                  borderTop: '2px solid #1a1a2e',
                  borderBottom: '2px solid #1a1a2e',
                  backgroundColor: '#1a1a2e',
                  color: '#ffffff',
                }}>
                  <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Posting Date</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Document No</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Doc Type</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Cheque No</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Amount</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Received (Credits)</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Balance Due</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Age (Days)</th>
                </tr>
              </thead>
              <tbody>
                {statementRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '12px 6px', textAlign: 'center', borderBottom: '1px solid #000000' }}>
                      No outstanding transactions
                    </td>
                  </tr>
                ) : (
                  statementRows.map((row, idx) => (
                    <tr key={row.id} style={{
                      borderBottom: '1px solid #ccc',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f7f7f7',
                    }}>
                      <td style={{ padding: '3px 6px' }}>{row.date || row.postingDate || '—'}</td>
                      <td style={{ padding: '3px 6px', fontFamily: "'Courier New', monospace" }}>{row.docNo || row.documentNo || '—'}</td>
                      <td style={{ padding: '3px 6px' }}>{row.docType || 'Invoice'}</td>
                      <td style={{ padding: '3px 6px', fontFamily: "'Courier New', monospace", fontSize: '8pt' }}>
                        {row.chequeNo || '—'}{row.bankName ? ` / ${row.bankName}` : ''}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        padding: '3px 6px',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 600,
                      }}>
                        {Number(row.displayAmount).toLocaleString()}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        padding: '3px 6px',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: row.displayReceived > 0 ? 600 : 400,
                      }}>
                        {row.displayReceived > 0 ? Number(row.displayReceived).toLocaleString() : '—'}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        padding: '3px 6px',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 700,
                      }}>
                        {Number(row.displayBalanceDue).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', padding: '3px 6px' }}>{row.ageDays}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{
                  borderTop: '2px solid #1a1a2e',
                  borderBottom: '2px solid #1a1a2e',
                  backgroundColor: '#1a1a2e',
                  color: '#ffffff',
                }}>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '10pt',
                      padding: '8px 6px',
                      color: '#ffffff',
                    }}
                  >
                    Total Outstanding:
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '10pt',
                      padding: '8px 6px',
                      fontFamily: "'Courier New', monospace",
                      color: '#ffffff',
                    }}
                  >
                    {Number(totalOutstanding).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 6px', color: '#ffffff' }} />
                </tr>
              </tfoot>
            </table>

          </div>
        ))}

        {/* ── FINAL MARKET OUTSTANDING — Grand total ─────────────────────── */}
        {isFullReport && (
          <div className="final-summary-block">
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: '13pt',
              color: '#ffffff',
              backgroundColor: '#1a1a2e',
              borderTop: '3px solid #1a1a2e',
              borderBottom: '3px solid #1a1a2e',
              padding: '14px 12px',
              letterSpacing: '0.02em',
            }}>
              <span>Final Market Outstanding:</span>
              <span style={{ marginLeft: '16px', fontFamily: "'Courier New', monospace" }}>
                Rs. {Number(grandTotal).toLocaleString()}
              </span>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default PrintFullReport;