import { useMemo } from 'react';
import { postDatedCheques } from '../../data/mockData';

const formatCurrency = (val) => `Rs. ${(val || 0).toLocaleString('en-US')}`;

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateFull = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function OutstandingStatementPrintView({ shop, transactions, outstanding, currentDate }) {
  // Build statement rows from transactions with running balance
  const statementRows = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const now = currentDate ? new Date(currentDate) : new Date();

    return sorted.map((t) => {
      const isInvoice = t.docType === 'Invoice';
      const amount = t.amount;
      // For Invoice: balance contribution = amount - received
      // For Payment: reduces running balance
      runningBalance += isInvoice ? (amount - (t.received || 0)) : -amount;
      const postingDate = new Date(t.date);
      const ageDays = Math.floor((now - postingDate) / (1000 * 60 * 60 * 24));

      return {
        date: t.date,
        docNo: t.docNo,
        docType: t.docType,
        chequeNo: t.chequeNo || '—',
        bankName: t.bankName || '',
        paymentMode: t.paymentMode || '',
        amount: isInvoice ? amount : -amount,
        balanceDue: runningBalance,
        ageDays,
      };
    });
  }, [transactions, currentDate]);

  const totalOutstanding = statementRows.length > 0
    ? statementRows[statementRows.length - 1].balanceDue
    : 0;

  // Filter post-dated cheques for this shop
  const shopCheques = postDatedCheques.filter((c) => c.shopId === shop?.id);

  // Current date for display
  const now = currentDate ? new Date(currentDate) : new Date();
  const statementDate = formatDateFull(now.toISOString().split('T')[0]);

  // Company info
  const companyName = 'Liyanage Distributors';
  const companyAddress = 'Hakmana Road, Deiyandara.';
  const companyTel = '070-5237647 / 071-5944711';

  return (
    <div
      className="print-statement-root print:fixed print:inset-0 print:bg-white print:text-black print:p-8 block print:z-[9999]"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '10pt',
        lineHeight: '1.3',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '0',
      }}
    >
      {/* CRITICAL: Inline @media print CSS */}
      <style>{`
        @media print {
          @page { margin: 10mm 12mm; size: A4 portrait; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body > :not(.print-statement-root):not(.print-portal-content) {
            display: none !important;
          }
          .print-portal-content {
            display: block !important;
          }
          * { color: #000000 !important; background: transparent !important; }
          .print-statement-root {
            display: block !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {/* ===== CREATIVE HEADER ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        marginBottom: '18px',
        borderBottom: '3px solid #1a1a2e',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '6px',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <img
            src="/inv_logo.png"
            alt="Liyanage Distributors"
            style={{
              height: '58px',
              width: 'auto',
              display: 'block',
              borderRadius: '4px',
            }}
          />
        </div>
        {/* Company Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '18pt',
            fontWeight: 900,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '0.5px',
            color: '#1a1a2e',
          }}>
            {companyName}
          </h1>
          <p style={{
            fontSize: '8.5pt',
            margin: '3px 0 0 0',
            color: '#333',
            lineHeight: 1.4,
          }}>
            {companyAddress}
          </p>
          <p style={{
            fontSize: '8.5pt',
            margin: '1px 0 0 0',
            color: '#333',
            lineHeight: 1.4,
          }}>
            Tel: {companyTel}
          </p>
        </div>
      </div>

      {/* ===== STATEMENT TITLE ===== */}
      <div style={{
        textAlign: 'center',
        marginBottom: '14px',
        padding: '6px 0',
        borderBottom: '1px solid #333',
        borderTop: '1px solid #333',
      }}>
        <h2 style={{
          fontSize: '13pt',
          fontWeight: 800,
          margin: 0,
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          Outstanding Statement
        </h2>
        <p style={{
          fontSize: '9pt',
          margin: '2px 0 0 0',
          color: '#444',
          fontWeight: 600,
        }}>
          As At: {statementDate}
        </p>
      </div>

      {/* ===== SHOP DETAILS - FULL WIDTH ===== */}
      <div style={{
        padding: '10px 14px',
        marginBottom: '14px',
        border: '1px solid #1a1a2e',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, paddingRight: '8px', whiteSpace: 'nowrap', verticalAlign: 'top', width: '1%' }}>
                {shop?.name || '—'}
              </td>
            </tr>
            <tr>
              <td style={{ paddingRight: '8px', color: '#444', verticalAlign: 'top', fontSize: '9pt' }}>
                {shop?.address || '—'}
                {shop?.route ? <span> · Route: {shop.route}</span> : ''}
              </td>
            </tr>
            <tr>
              <td style={{ paddingRight: '8px', color: '#444', verticalAlign: 'top', fontSize: '9pt' }}>
                Tel: {shop?.contact || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== SALUTATION ===== */}
      <div style={{ marginBottom: '12px', fontSize: '9pt', lineHeight: '1.5' }}>
        <span style={{ fontWeight: 700 }}>Dear Sir,</span>{' '}
        Please find below the out-standing balance as at above mentioned date and kindly
        make arrangements to forward the full payment at your earliest convenience.
      </div>

      {/* ===== MAIN FINANCIAL TABLE ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '8.5pt' }}>
        <thead>
          <tr style={{
            borderTop: '2px solid #1a1a2e',
            borderBottom: '2px solid #1a1a2e',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
          }}>
            <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Posting Date</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Document No</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Document Type</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: '#ffffff' }}>Cheque No</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Amount</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Balance Due</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>Age (Days)</th>
          </tr>
        </thead>
        <tbody>
          {statementRows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '12px 6px', textAlign: 'center', borderBottom: '1px solid #000000' }}>
                No transactions found
              </td>
            </tr>
          ) : (
            statementRows.map((row, idx) => (
              <tr key={idx} style={{
                borderBottom: '1px solid #ccc',
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f7f7f7',
              }}>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{formatDate(row.date)}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left', fontFamily: "'Courier New', monospace" }}>{row.docNo}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{row.docType}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left', fontFamily: "'Courier New', monospace", fontSize: '8pt' }}>
                  {row.chequeNo}{row.bankName ? ` / ${row.bankName}` : ''}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                  {row.amount >= 0
                    ? formatCurrency(row.amount)
                    : `(${formatCurrency(Math.abs(row.amount))})`}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                  {formatCurrency(row.balanceDue)}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{row.ageDays}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{
              padding: '8px 6px',
              textAlign: 'right',
              fontWeight: 800,
              fontSize: '10pt',
              borderTop: '2px solid #1a1a2e',
              borderBottom: '2px solid #1a1a2e',
              backgroundColor: '#1a1a2e',
              color: '#ffffff',
            }}>
              Total Outstanding
            </td>
            <td colSpan={2} style={{
              padding: '8px 6px',
              textAlign: 'right',
              fontWeight: 800,
              fontSize: '10pt',
              fontFamily: "'Courier New', monospace",
              borderTop: '2px solid #1a1a2e',
              borderBottom: '2px solid #1a1a2e',
              backgroundColor: '#1a1a2e',
              color: '#ffffff',
            }}>
              {formatCurrency(totalOutstanding)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ===== POST DATED CHEQUES SECTION ===== */}
      {shopCheques.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '9pt',
            marginBottom: '6px',
            padding: '4px 6px',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            display: 'inline-block',
          }}>
            Post Dated Cheques in hand:
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>Cheque No</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>Bank Branch</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>Cheque Date</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {shopCheques.map((cheque) => (
                <tr key={cheque.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '3px 6px', textAlign: 'left', fontFamily: "'Courier New', monospace" }}>{cheque.chequeNo}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'left' }}>{cheque.bankName || cheque.bankBranch || '—'}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'left' }}>{formatDate(cheque.chequeDate)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>{formatCurrency(cheque.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '8pt',
        color: '#555',
        borderTop: '1px solid #ccc',
        paddingTop: '10px',
      }}>
        <div style={{ fontWeight: 700, fontSize: '9pt', color: '#1a1a2e' }}>{companyName}</div>
        <div>{companyAddress}</div>
        <div>Tel: {companyTel}</div>
        <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '7.5pt', color: '#888' }}>
          Thank you for your continued business and support.
        </div>
      </div>
    </div>
  );
}