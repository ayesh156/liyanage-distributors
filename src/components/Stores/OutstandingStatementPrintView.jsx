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
      runningBalance += isInvoice ? amount : -amount;
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

  return (
    <div
      className="print-statement-root print:fixed print:inset-0 print:bg-white print:text-black print:p-8 font-mono text-xs block print:z-[9999]"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '10pt',
        lineHeight: '1.3',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '0',
      }}
    >
      {/* CRITICAL: Inline @media print CSS — forces black/white, hides all screen UI */}
      <style>{`
        @media print {
          @page { margin: 12mm 15mm; size: A4 portrait; }
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
        }
      `}</style>

      {/* ===== TWO-COLUMN HEADER BOX ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
        <tbody>
          <tr>
            {/* Left Box: From */}
            <td style={{ width: '50%', verticalAlign: 'top', padding: '6px', border: '1px solid #000000' }}>
              <div style={{ fontWeight: 700, fontSize: '9pt', marginBottom: '2px' }}>From:</div>
              <div style={{ fontWeight: 700, fontSize: '9pt' }}>Liyanage Distributors</div>
              <div style={{ fontSize: '8pt' }}>Hakmana Road, Deiyandara.</div>
              <div style={{ fontSize: '8pt' }}>Phone: 070-5237647 / 071-5944711</div>
            </td>
            {/* Right Box: To */}
            <td style={{ width: '50%', verticalAlign: 'top', padding: '6px', border: '1px solid #000000', textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '9pt', marginBottom: '2px' }}>To:</div>
              <div style={{ fontWeight: 700, fontSize: '9pt' }}>{shop?.name || '—'}</div>
              <div style={{ fontSize: '8pt' }}>{shop?.address || '—'}</div>
              <div style={{ fontSize: '8pt' }}>Tel: {shop?.contact || '—'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== STATEMENT TITLE ===== */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '11pt', textDecoration: 'underline', margin: '0' }}>
          Outstanding Statement As At : {statementDate}
        </div>
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
          <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Posting Date</th>
            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Document No</th>
            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Document Type</th>
            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Cheque No</th>
            <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
            <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>Balance Due</th>
            <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>Age (Days)</th>
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
              <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{formatDate(row.date)}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{row.docNo}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{row.docType}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{row.chequeNo}{row.bankName ? ` / ${row.bankName}` : ''}</td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                  {row.amount >= 0
                    ? formatCurrency(row.amount)
                    : `(${formatCurrency(Math.abs(row.amount))})`}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(row.balanceDue)}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{row.ageDays}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ padding: '6px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid #000000' }}>
              Total Outstanding
            </td>
            <td colSpan={2} style={{ padding: '6px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid #000000' }}>
              {formatCurrency(totalOutstanding)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ===== POST DATED CHEQUES SECTION ===== */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '9pt', marginBottom: '6px' }}>
          Post Dated Cheques in hand:
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Cheque No</th>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Bank Branch</th>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700 }}>Cheque Date</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {shopCheques.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #000000' }}>
                  No post-dated cheques available
                </td>
              </tr>
            ) : (
              shopCheques.map((cheque) => (
                <tr key={cheque.id} style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '3px 6px', textAlign: 'left' }}>{cheque.chequeNo}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'left' }}>{cheque.bankName || cheque.bankBranch || '—'}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'left' }}>{formatDate(cheque.chequeDate)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right' }}>{formatCurrency(cheque.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ borderTop: '2px solid #000000', paddingTop: '10px', marginTop: '20px', textAlign: 'center', fontSize: '8pt' }}>
        <div style={{ fontWeight: 700 }}>Liyanage Distributors</div>
        <div>Hakmana Road, Deiyandara</div>
        <div>Phone: 070-5237647 / 071-5944711</div>
      </div>
    </div>
  );
}