import React, { forwardRef, useMemo } from 'react';
import useAppStore from '../../hooks/useAppStore';

const formatCurrency = (val) =>
  `Rs. ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PAYMENT_MODE_LABEL = {
  credit: 'Credit',
  cash:   'Cash',
  cheque: 'Cheque',
  check:  'Direct Bank Check',
};

/**
 * InvoicePrintView — ERP-style commercial invoice print sheet
 * ════════════════════════════════════════════════════════════
 *
 * Transformed from a basic receipt layout into a full ERP invoice
 * with dedicated metadata grid, accounting table matrix, signature
 * blocks, and professional summary stack.
 */
const InvoicePrintView = forwardRef(({ shop, transaction }, ref) => {
  const routes        = useAppStore((state) => state.routes) || [];
  const salesPersons  = useAppStore((state) => state.salesPersons) || [];

  // ── Derive route display name ────────────────────────────────────────────
  const routeLabel = useMemo(() => {
    if (!shop?.route) return '—';
    const found = routes.find(
      (r) => r.name.toLowerCase() === shop.route.toLowerCase(),
    );
    return found ? found.name : shop.route;
  }, [shop?.route, routes]);

  // ── Derive sales person name ─────────────────────────────────────────────
  const salesPersonLabel = useMemo(() => {
    if (transaction?.salesPerson) return transaction.salesPerson;
    if (shop?.salesPerson) return shop.salesPerson;
    // Try to match from the salesPersons list by shop's assigned salesPerson
    if (shop?.salesPerson) {
      const found = salesPersons.find(
        (sp) => sp.name.toLowerCase() === shop.salesPerson.toLowerCase(),
      );
      return found ? found.name : shop.salesPerson;
    }
    return '—';
  }, [transaction?.salesPerson, shop?.salesPerson, salesPersons]);

  // ── Transaction line item data ────────────────────────────────────────────
  const amount    = transaction?.amount  || 0;
  const modeLabel = PAYMENT_MODE_LABEL[transaction?.paymentMode] || transaction?.paymentMode || 'Credit';

  // Default ERP line-item fields (derived from flat transaction model)
  const lineItemQty   = transaction?.qty   || 1;
  const lineItemPrice = transaction?.price  || amount;
  const lineItemDisc  = transaction?.discount || 0;
  const lineItemValue = (lineItemQty * lineItemPrice) - lineItemDisc;

  const companyName    = 'Liyanage Distributors';
  const companyAddress = 'Hakmana Road, Deiyandara.';
  const companyTel     = '070-5237647 / 071-5944711';

  return (
    <div>
      <style>{`
        @media print {
          @page { margin: 8mm 10mm; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* Ensure white background and black text on every element */
          .erp-invoice-sheet,
          .erp-invoice-sheet * {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .erp-invoice-sheet table thead th {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1a1a2e !important;
            border-bottom: 2px solid #1a1a2e !important;
          }
          .erp-invoice-sheet table thead th * {
            background: transparent !important;
            color: #1a1a2e !important;
          }
          .erp-invoice-sheet .erp-header-banner {
            background: #ffffff !important;
          }
          .erp-invoice-sheet .summary-strip {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1a1a2e !important;
            border-top: 2px solid #1a1a2e !important;
          }
          .erp-invoice-sheet .summary-strip * {
            background: transparent !important;
            color: #1a1a2e !important;
          }
          .erp-invoice-sheet .meta-block {
            background: #ffffff !important;
            border: 1px solid #1a1a2e !important;
          }
          .erp-invoice-sheet .signature-line {
            border-top: 1px solid #000000 !important;
          }
        }

        /* Screen visibility toggle */
        @media screen {
          .erp-invoice-sheet {
            visibility: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            top: 0; left: 0;
            width: 210mm;
            height: 0;
            overflow: hidden;
            z-index: -1;
          }
        }
      `}</style>

      <div
        ref={ref}
        className="erp-invoice-sheet"
        style={{
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          color: '#000000',
          fontSize: '9.5pt',
          lineHeight: '1.35',
          background: '#ffffff',
          padding: '0',
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════╗
            HEADER BANNER — Company Logo + Name + Address  + INVOICE badge
            ╚════════════════════════════════════════════════════════════════╝ */}
        <div className="erp-header-banner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginBottom: '16px',
          borderBottom: '3px solid #1a1a2e',
          background: '#ffffff',
          borderRadius: '6px',
        }}>
          {/* ── LEFT: Logo + Company text in a unified flex row ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1,
            textAlign: 'left',
          }}>
            {/* Logo — FIRST element, no wrapper div, directly in the flex row */}
            <img
              src="/inv_logo.png"
              alt="LHD Logo"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
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

          {/* ── RIGHT: INVOICE badge — dark box with white text ── */}
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
              INVOICE
            </span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════╗
            TWO-COLUMN METADATA GRID  (ERP Style)
            LEFT:   Outlet / Customer info
            RIGHT:  Invoice system details
            ╚════════════════════════════════════════════════════════════════╝ */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '14px',
        }}>
          {/* ── LEFT COLUMN: Customer / Hardware Shop — Clean Vertical Stack ── */}
          <div style={{
            flex: '1 1 55%',
            padding: '8px 10px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {/* Line 1: Shop Name (bold headline) */}
              <div style={{
                fontSize: '12pt',
                fontWeight: 800,
                color: '#1a1a2e',
                lineHeight: 1.2,
              }}>
                {shop?.name || '—'}
              </div>
              {/* Line 2: Address */}
              <div style={{
                fontSize: '8.5pt',
                color: '#444',
                lineHeight: '1.5',
              }}>
                {shop?.address ? `Address: ${shop.address}` : '—'}
              </div>
              {/* Line 3: Route */}
              {routeLabel && (
                <div style={{
                  fontSize: '8.5pt',
                  color: '#444',
                  lineHeight: '1.5',
                }}>
                  Route: {routeLabel}
                </div>
              )}
              {/* Line 4: Phone No */}
              {(shop?.contact || shop?.phone) && (
                <div style={{
                  fontSize: '8.5pt',
                  color: '#444',
                  lineHeight: '1.5',
                }}>
                  Phone No: {shop?.contact || shop?.phone}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Invoice System Details ── */}
          <div className="meta-block" style={{
            flex: '1 1 45%',
            border: '1px solid #1a1a2e',
            borderRadius: '4px',
            padding: '2px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <tbody>
                <tr>
                  <td style={{
                    fontWeight: 600,
                    color: '#444',
                    paddingRight: '8px',
                    whiteSpace: 'nowrap',
                    width: '100px',
                    verticalAlign: 'top',
                  }}>
                    Invoice No:
                  </td>
                  <td style={{
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    color: '#000',
                    verticalAlign: 'top',
                  }}>
                    {transaction?.docNo || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    fontWeight: 600,
                    color: '#444',
                    paddingRight: '8px',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                  }}>
                    Invoice Date:
                  </td>
                  <td style={{ color: '#000', verticalAlign: 'top' }}>
                    {formatDateShort(transaction?.date)} {transaction?.time || ''}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    fontWeight: 600,
                    color: '#444',
                    paddingRight: '8px',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                  }}>
                    Sales Person:
                  </td>
                  <td style={{ color: '#000', verticalAlign: 'top' }}>
                    {salesPersonLabel}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    fontWeight: 600,
                    color: '#444',
                    paddingRight: '8px',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                  }}>
                    Payment Mode:
                  </td>
                  <td style={{ color: '#000', verticalAlign: 'top', fontWeight: 700 }}>
                    {modeLabel}
                    {transaction?.chequeNo && (
                      <span style={{ fontWeight: 400, fontSize: '8pt', marginLeft: '4px' }}>
                        ({transaction.chequeNo}{transaction?.bankName ? ` / ${transaction.bankName}` : ''})
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════╗
            LEDGER ITEMS GRID  — ERP Table Matrix
            Columns: # | Item Code & Description | QTY | Price | Disc (%) | Value (Rs.)
            ╚════════════════════════════════════════════════════════════════╝ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '9pt' }}>
          <thead>
            <tr style={{
              borderTop: '2px solid #1a1a2e',
              borderBottom: '2px solid #1a1a2e',
              backgroundColor: '#ffffff',
            }}>
              <th style={{
                padding: '5px 6px',
                textAlign: 'center',
                fontWeight: 600,
                color: '#1a1a2e',
                width: '30px',
              }}>#</th>
              <th style={{
                padding: '5px 6px',
                textAlign: 'left',
                fontWeight: 600,
                color: '#1a1a2e',
              }}>Item Code & Description</th>
              <th style={{
                padding: '5px 6px',
                textAlign: 'right',
                fontWeight: 600,
                color: '#1a1a2e',
                width: '50px',
              }}>QTY</th>
              <th style={{
                padding: '5px 6px',
                textAlign: 'right',
                fontWeight: 600,
                color: '#1a1a2e',
                width: '90px',
              }}>Price</th>
              <th style={{
                padding: '5px 6px',
                textAlign: 'right',
                fontWeight: 600,
                color: '#1a1a2e',
                width: '65px',
              }}>Disc (%)</th>
              <th style={{
                padding: '5px 6px',
                textAlign: 'right',
                fontWeight: 600,
                color: '#1a1a2e',
                width: '110px',
              }}>Value (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #ccc' }}>
              <td style={{
                padding: '7px 6px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
              }}>1</td>
              <td style={{
                padding: '7px 6px',
              }}>
                <span style={{ fontWeight: 600 }}>
                  {transaction?.description || 'Hardware & Electrical Supplies'}
                </span>
                {transaction?.code && (
                  <span style={{
                    display: 'block',
                    fontSize: '8pt',
                    color: '#555',
                    marginTop: '1px',
                  }}>
                    Code: {transaction.code}
                  </span>
                )}
              </td>
              <td style={{
                padding: '7px 6px',
                textAlign: 'right',
                fontFamily: "'Courier New', monospace",
                fontWeight: 600,
              }}>
                {lineItemQty.toLocaleString()}
              </td>
              <td style={{
                padding: '7px 6px',
                textAlign: 'right',
                fontFamily: "'Courier New', monospace",
              }}>
                {formatCurrency(lineItemPrice)}
              </td>
              <td style={{
                padding: '7px 6px',
                textAlign: 'right',
                fontFamily: "'Courier New', monospace",
                color: lineItemDisc > 0 ? '#c0392b' : '#000',
              }}>
                {lineItemDisc > 0 ? lineItemDisc.toFixed(2) : '0.00'}
              </td>
              <td style={{
                padding: '7px 6px',
                textAlign: 'right',
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                fontSize: '10pt',
              }}>
                {formatCurrency(lineItemValue)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ═════════════════════════════════════════════════════════════════╗
            BOTTOM SECTION — Signature Block (LEFT) + Summary Stack (RIGHT)
            ╚════════════════════════════════════════════════════════════════╝ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '14px',
        }}>
          {/* ── LEFT: Signature block ── */}
          <div style={{
            flex: '1 1 55%',
          }}>
            <p style={{
              fontSize: '8pt',
              color: '#333',
              marginBottom: '14px',
              fontStyle: 'italic',
            }}>
              Accepted above items in order
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '48px',
            }}>
              {['Customer Signature', 'Invoiced By', 'Authorized By'].map((label) => (
                <div key={label} style={{ flex: 1 }}>
                  <div className="signature-line" style={{
                    borderTop: '1px solid #333',
                    paddingTop: '4px',
                    marginBottom: '2px',
                    height: '10px',
                  }} />
                  <p style={{
                    fontSize: '7.5pt',
                    fontWeight: 700,
                    color: '#333',
                    margin: 0,
                    textAlign: 'center',
                  }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Summary Stack — exactly like professional receipts ── */}
          <div style={{
            flex: '0 0 200px',
            border: '1px solid #1a1a2e',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <SummaryRow label="Gross Value"  value={formatCurrency(amount)} />
            <SummaryRow label="Net Value"    value={formatCurrency(amount)} bordered />
            <SummaryRow label="Final Value"  value={formatCurrency(amount)} bordered />
            <div className="summary-strip" style={{
              backgroundColor: '#ffffff',
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                fontWeight: 800,
                fontSize: '9pt',
                color: '#1a1a2e',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
              }}>
                Final Sale
              </span>
              <span style={{
                fontWeight: 800,
                fontSize: '10pt',
                fontFamily: "'Courier New', monospace",
                color: '#1a1a2e',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}>
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

InvoicePrintView.displayName = 'InvoicePrintView';

export default InvoicePrintView;

// ── Summary Row Sub-component ────────────────────────────────────────────────

const SummaryRow = ({ label, value, bordered = false }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
    fontSize: '8.5pt',
    borderTop: bordered ? '1px solid #d0d0d0' : 'none',
    backgroundColor: '#ffffff',
  }}>
    <span style={{ fontWeight: 600, color: '#333' }}>{label}</span>
    <span style={{
      fontWeight: 700,
      fontFamily: "'Courier New', monospace",
      color: '#000',
      fontSize: '9pt',
    }}>
      {value}
    </span>
  </div>
);