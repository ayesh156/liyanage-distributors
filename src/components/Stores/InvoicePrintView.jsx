import React, { forwardRef } from 'react';
import { companyInfo } from '../../data/mockData';

const formatCurrency = (val) =>
  `Rs. ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateFull = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PAYMENT_MODE_LABEL = {
  credit: 'Credit',
  cash:   'Cash',
  cheque: 'Cheque',
  check:  'Direct Bank Check',
};

const InvoicePrintView = forwardRef(({ shop, transaction }, ref) => {
  const amount    = transaction?.amount  || 0;
  const modeLabel = PAYMENT_MODE_LABEL[transaction?.paymentMode] || transaction?.paymentMode || 'Credit';
  const hasCheque = (transaction?.paymentMode === 'cheque' || transaction?.paymentMode === 'check')
    && transaction?.chequeNo;

  return (
    <div>
      <style>{`
        @media print {
          @page { margin: 12mm 15mm; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div
        ref={ref}
        className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-6 print:z-[9999] print:w-full print:overflow-auto"
        style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900" style={{ fontSize: '20pt', lineHeight: 1.1 }}>
              LIYANAGE DISTRIBUTORS
            </h1>
            <p className="text-[8pt] text-gray-600 mt-0.5">{companyInfo.address}</p>
            <p className="text-[8pt] text-gray-600">Tel: {companyInfo.tel}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 tracking-wider" style={{ fontSize: '14pt' }}>
              INVOICE / ORIGINAL
            </h2>
            <p className="text-[8pt] text-gray-500 mt-0.5">
              {formatDateFull(transaction?.date || new Date())}
            </p>
          </div>
        </div>

        {/* ── METADATA GRID ── */}
        <div className="grid grid-cols-2 gap-4 mb-5 text-[9pt]">
          {/* Customer / Store info */}
          <div className="border border-gray-300 rounded p-2.5">
            <p className="font-bold text-gray-700 mb-1.5 text-[8.5pt] uppercase tracking-wide">Bill To</p>
            <table className="w-full text-[9pt]">
              <tbody>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 w-28 align-top whitespace-nowrap">Store:</td>
                  <td className="text-gray-900 font-bold">{shop?.name || '—'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Address:</td>
                  <td className="text-gray-900">{shop?.address || '—'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Route:</td>
                  <td className="text-gray-900">{shop?.route || '—'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Phone:</td>
                  <td className="text-gray-900">{shop?.contact || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Invoice details */}
          <div className="border border-gray-300 rounded p-2.5">
            <p className="font-bold text-gray-700 mb-1.5 text-[8.5pt] uppercase tracking-wide">Invoice Details</p>
            <table className="w-full text-[9pt]">
              <tbody>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 w-28 align-top whitespace-nowrap">Invoice No:</td>
                  <td className="text-gray-900 font-mono font-bold">{transaction?.docNo || '—'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Date:</td>
                  <td className="text-gray-900">{formatDateShort(transaction?.date || new Date())}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Sales Rep:</td>
                  <td className="text-gray-900">{transaction?.salesPerson || shop?.salesPerson || '—'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Payment:</td>
                  <td className="text-gray-900">{modeLabel}</td>
                </tr>
                {hasCheque && (
                  <>
                    <tr>
                      <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">
                        {transaction?.paymentMode === 'check' ? 'Check No:' : 'Cheque No:'}
                      </td>
                      <td className="text-gray-900 font-mono">{transaction?.chequeNo}</td>
                    </tr>
                    {transaction?.bankName && (
                      <tr>
                        <td className="font-semibold text-gray-600 pr-2 align-top whitespace-nowrap">Bank:</td>
                        <td className="text-gray-900">{transaction.bankName}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── INVOICE SUMMARY TABLE ── */}
        <table className="w-full border-collapse mb-5 text-[9pt]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-900 px-3 py-2 text-center w-10">#</th>
              <th className="border border-gray-900 px-3 py-2 text-left">Description</th>
              <th className="border border-gray-900 px-3 py-2 text-right w-32">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-3 py-2.5 text-center">1</td>
              <td className="border border-gray-300 px-3 py-2.5">
                <span className="font-medium">{transaction?.description || 'Hardware & Electrical Supplies'}</span>
                {transaction?.route && (
                  <span className="ml-2 text-[8pt] text-gray-500">• Route: {transaction.route}</span>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                {formatCurrency(amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
              <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right text-gray-900 font-bold">
                Invoice Total
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-mono text-gray-900 font-bold text-[10pt]">
                {formatCurrency(amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ── SIGNATURES + NOTES ── */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-1/2 space-y-8 mt-6">
            {['Customer Signature', 'Invoiced By', 'Authorized By'].map((label) => (
              <div key={label}>
                <div className="border-t border-gray-400 pt-1 w-44">&nbsp;</div>
                <p className="text-[8pt] text-gray-700 font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="w-56 text-[8.5pt]">
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50">
              <p className="font-bold text-gray-800 mb-1 text-[9pt]">Terms & Conditions</p>
              <p className="text-gray-600 text-[7.5pt]">All cheques should be drawn in favour of <strong>Liyanage Distributors</strong>.</p>
              <p className="text-gray-600 text-[7.5pt] mt-0.5">Goods once sold cannot be returned.</p>
              <p className="text-gray-600 text-[7.5pt] mt-0.5">Subject to Deiyandara jurisdiction.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[8.5pt] text-gray-600 italic mb-4">
          Accepted above goods / services in good order and condition.
        </p>

        {/* ── FOOTER ── */}
        <div className="border-t-2 border-gray-900 pt-3 text-center">
          <p className="text-[8.5pt] font-bold text-gray-900">{companyInfo.name}</p>
          <p className="text-[7.5pt] text-gray-600">Reg No: {companyInfo.regNo}</p>
          <p className="text-[7.5pt] text-gray-600">{companyInfo.address}</p>
          <p className="text-[7.5pt] text-gray-600">Tel: {companyInfo.tel}</p>
        </div>
      </div>
    </div>
  );
});

InvoicePrintView.displayName = 'InvoicePrintView';
export default InvoicePrintView;
