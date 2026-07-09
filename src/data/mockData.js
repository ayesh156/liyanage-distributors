const today = new Date();
const d = (daysAgo) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const companyInfo = {
  name: 'Liyanage Distributors',
  regNo: 'PV-2025-0042',
  address: 'Hakmana Road, Deiyandara',
  tel: '070-5237647 / 071-5944711',
  email: 'info@liyanagedistributors.lk',
  vatNo: 'VAT-1234-5678-9012',
  distributorVatNo: 'DVAT-9876-5432-1098',
};

/**
 * HARDWARE SHOP SCHEMA
 * id, name, route, contact (phone), address, active,
 * salesPerson, salesPersonPhone, totalOutstanding (computed), totalPayments
 */
export const shops = [
  { id: 1,  name: 'Shanthi Electricals',          route: 'Morawaka',      contact: '071-2345678', address: '23 Galle Rd, Morawaka',        active: true,  salesPerson: 'Kamal Perera',       salesPersonPhone: '077-1112233', totalPayments: 150000 },
  { id: 2,  name: 'Moon Light Hardware',           route: 'Akuressa',      contact: '072-3456789', address: '22 Main St, Akuressa',         active: true,  salesPerson: 'Nimal Fernando',     salesPersonPhone: '077-2223344', totalPayments: 205000 },
  { id: 3,  name: 'Samagi Electrical Center',      route: 'Deniyaya',      contact: '077-4567890', address: '22 Matara Rd, Deniyaya',       active: true,  salesPerson: 'Sunil Silva',        salesPersonPhone: '077-3334455', totalPayments: 100000 },
  { id: 4,  name: 'Lanka Lighting House',          route: 'Urubokka',      contact: '071-5678901', address: '45 Colombo Rd, Urubokka',      active: true,  salesPerson: 'Priya Jayawardena',  salesPersonPhone: '077-4445566', totalPayments: 150000 },
  { id: 5,  name: 'Star Engineering Supplies',     route: 'Morawaka',      contact: '075-6789012', address: '78 Temple Rd, Morawaka',       active: true,  salesPerson: 'Rohan Weerasinghe',  salesPersonPhone: '077-5556677', totalPayments:  45000 },
  { id: 6,  name: 'Royal Hardware Mart',           route: 'Akuressa',      contact: '076-7890123', address: '112 Galle Rd, Akuressa',       active: true,  salesPerson: 'Saman Kumara',       salesPersonPhone: '077-6667788', totalPayments:      0 },
  { id: 7,  name: 'Liyanage Electrical Traders',   route: 'Deniyaya',      contact: '071-8901234', address: '5 Lake Rd, Deniyaya',          active: false, salesPerson: 'Upul Rathnayake',    salesPersonPhone: '077-7778899', totalPayments:      0 },
  { id: 8,  name: 'City Light Electricals',        route: 'Urubokka',      contact: '072-9012345', address: '90 Station Rd, Urubokka',      active: true,  salesPerson: 'Lalith Dissanayake', salesPersonPhone: '077-8889900', totalPayments: 100000 },
  { id: 9,  name: 'Sathosa Hardware & Electricals',route: 'Kamburupitiya', contact: '077-0123456', address: '34 Main St, Kamburupitiya',     active: true,  salesPerson: 'Ajith Bandara',      salesPersonPhone: '077-9990011', totalPayments:  50000 },
  { id: 10, name: 'Nimal Electrical Center',       route: 'Kamburupitiya', contact: '075-1234567', address: '12 Church Rd, Kamburupitiya',  active: true,  salesPerson: 'Dinesh Kumara',      salesPersonPhone: '077-1002003', totalPayments:  72000 },
  { id: 11, name: 'Galle Hardware Depot',          route: 'Morawaka',      contact: '091-2345678', address: '56 Beach Rd, Morawaka',        active: false, salesPerson: 'Harsha De Silva',    salesPersonPhone: '077-3004005', totalPayments:      0 },
  { id: 12, name: 'Metro Electrical House',        route: 'Akuressa',      contact: '077-3456789', address: '89 Lake Rd, Akuressa',         active: true,  salesPerson: 'Mahesh Jayasuriya',  salesPersonPhone: '077-5006007', totalPayments: 100000 },
];

/**
 * TRANSACTION SCHEMA (Invoices + Payments/Receipts)
 * id, shopId, date, docType ('Invoice'|'Payment'), docNo,
 * amount, chequeNo, bankName (for cheque/check),
 * description, salesPerson, salesPersonPhone,
 * paymentMode ('credit'|'cash'|'cheque'|'check'), route
 *
 * paymentMode values:
 *   'credit' — goods delivered on credit (Invoice only)
 *   'cash'   — cash collected
 *   'cheque' — standard cheque (has chequeNo + bankName)
 *   'check'  — direct bank check / post-dated check (has chequeNo + bankName)
 */
export const transactions = [
  // ── Shanthi Electricals (id:1) ──
  { id:  1, shopId: 1, date: d(2),  docType: 'Invoice',  docNo: 'INV-2026-001', amount: 185000, chequeNo: '',          bankName: '',                   description: 'Wiring supplies & cables',    salesPerson: 'Kamal Perera', salesPersonPhone: '077-1112233', paymentMode: 'credit', route: 'Morawaka' },
  { id:  2, shopId: 1, date: d(5),  docType: 'Invoice',  docNo: 'INV-2026-004', amount:  42000, chequeNo: '',          bankName: '',                   description: 'Electrical fittings bundle',  salesPerson: 'Kamal Perera', salesPersonPhone: '077-1112233', paymentMode: 'credit', route: 'Morawaka' },
  { id:  3, shopId: 1, date: d(8),  docType: 'Payment',  docNo: 'PAY-2026-001', amount:  50000, chequeNo: 'CHQ-458201',bankName: 'BOC Morawaka',        description: 'Partial payment',             salesPerson: '',             salesPersonPhone: '',            paymentMode: 'cheque', route: '' },
  { id:  4, shopId: 1, date: d(15), docType: 'Invoice',  docNo: 'INV-2026-008', amount:  95000, chequeNo: '',          bankName: '',                   description: 'Switchgears & breakers',      salesPerson: 'Kamal Perera', salesPersonPhone: '077-1112233', paymentMode: 'credit', route: 'Morawaka' },
  { id:  5, shopId: 1, date: d(25), docType: 'Invoice',  docNo: 'INV-2026-012', amount: 250000, chequeNo: '',          bankName: '',                   description: 'Industrial lighting order',   salesPerson: 'Kamal Perera', salesPersonPhone: '077-1112233', paymentMode: 'credit', route: 'Morawaka' },
  { id:  6, shopId: 1, date: d(40), docType: 'Payment',  docNo: 'PAY-2026-003', amount: 100000, chequeNo: 'CHQ-458305',bankName: 'Peoples Bank Morawaka',description: 'Cheque payment',             salesPerson: '',             salesPersonPhone: '',            paymentMode: 'cheque', route: '' },
  { id:  7, shopId: 1, date: d(60), docType: 'Invoice',  docNo: 'INV-2026-018', amount:  78000, chequeNo: '',          bankName: '',                   description: 'Wires & conduits',            salesPerson: 'Kamal Perera', salesPersonPhone: '077-1112233', paymentMode: 'credit', route: 'Morawaka' },

  // ── Moon Light Hardware (id:2) ──
  { id:  8, shopId: 2, date: d(1),  docType: 'Invoice',  docNo: 'INV-2026-002', amount: 125000, chequeNo: '',          bankName: '',                   description: 'Tools & hardware',            salesPerson: 'Nimal Fernando', salesPersonPhone: '077-2223344', paymentMode: 'credit', route: 'Akuressa' },
  { id:  9, shopId: 2, date: d(4),  docType: 'Payment',  docNo: 'PAY-2026-002', amount: 125000, chequeNo: 'CHQ-458202',bankName: 'Sampath Bank Akuressa',description: 'Full payment',               salesPerson: '',               salesPersonPhone: '',            paymentMode: 'cheque', route: '' },
  { id: 10, shopId: 2, date: d(10), docType: 'Invoice',  docNo: 'INV-2026-007', amount:  88000, chequeNo: '',          bankName: '',                   description: 'Plumbing supplies',           salesPerson: 'Nimal Fernando', salesPersonPhone: '077-2223344', paymentMode: 'credit', route: 'Akuressa' },
  { id: 11, shopId: 2, date: d(20), docType: 'Invoice',  docNo: 'INV-2026-010', amount: 165000, chequeNo: '',          bankName: '',                   description: 'Electrical appliances',       salesPerson: 'Nimal Fernando', salesPersonPhone: '077-2223344', paymentMode: 'credit', route: 'Akuressa' },
  { id: 12, shopId: 2, date: d(35), docType: 'Payment',  docNo: 'PAY-2026-005', amount:  80000, chequeNo: 'CHQ-458310',bankName: 'BOC Akuressa',        description: 'Partial payment',             salesPerson: '',               salesPersonPhone: '',            paymentMode: 'cheque', route: '' },

  // ── Samagi Electrical Center (id:3) ──
  { id: 13, shopId: 3, date: d(3),  docType: 'Invoice',  docNo: 'INV-2026-003', amount: 210000, chequeNo: '',          bankName: '',                   description: 'CCTV & security',             salesPerson: 'Sunil Silva', salesPersonPhone: '077-3334455', paymentMode: 'credit', route: 'Deniyaya' },
  { id: 14, shopId: 3, date: d(7),  docType: 'Invoice',  docNo: 'INV-2026-005', amount:  55000, chequeNo: '',          bankName: '',                   description: 'Lighting fixtures',           salesPerson: 'Sunil Silva', salesPersonPhone: '077-3334455', paymentMode: 'credit', route: 'Deniyaya' },
  { id: 15, shopId: 3, date: d(12), docType: 'Payment',  docNo: 'PAY-2026-004', amount: 100000, chequeNo: 'CHQ-458302',bankName: 'BOC Deniyaya',        description: 'Advance payment',             salesPerson: '',            salesPersonPhone: '',            paymentMode: 'cheque', route: '' },
  { id: 16, shopId: 3, date: d(18), docType: 'Invoice',  docNo: 'INV-2026-009', amount: 142000, chequeNo: '',          bankName: '',                   description: 'Cables & switches',           salesPerson: 'Sunil Silva', salesPersonPhone: '077-3334455', paymentMode: 'credit', route: 'Deniyaya' },

  // ── Lanka Lighting House (id:4) ──
  { id: 17, shopId: 4, date: d(6),  docType: 'Invoice',  docNo: 'INV-2026-006', amount: 320000, chequeNo: '',          bankName: '',              description: 'LED panels & bulbs',   salesPerson: 'Priya Jayawardena', salesPersonPhone: '077-4445566', paymentMode: 'credit', route: 'Urubokka' },
  { id: 18, shopId: 4, date: d(14), docType: 'Payment',  docNo: 'PAY-2026-006', amount: 150000, chequeNo: '',          bankName: '',              description: 'Cash payment',         salesPerson: '',                  salesPersonPhone: '',            paymentMode: 'cash',   route: '' },
  { id: 19, shopId: 4, date: d(22), docType: 'Invoice',  docNo: 'INV-2026-011', amount:  98000, chequeNo: '',          bankName: '',              description: 'Decorative lights',    salesPerson: 'Priya Jayawardena', salesPersonPhone: '077-4445566', paymentMode: 'credit', route: 'Urubokka' },
  { id: 35, shopId: 4, date: d(30), docType: 'Payment',  docNo: 'PAY-2026-014', amount:  80000, chequeNo: 'CHK-221001',bankName: 'HNB Urubokka',  description: 'Direct bank check',   salesPerson: '',                  salesPersonPhone: '',            paymentMode: 'check',  route: '' },

  // ── Star Engineering Supplies (id:5) ──
  { id: 20, shopId: 5, date: d(9),  docType: 'Invoice',  docNo: 'INV-2026-013', amount:  45000, chequeNo: '',          bankName: '',              description: 'Tools equipment',     salesPerson: 'Rohan Weerasinghe', salesPersonPhone: '077-5556677', paymentMode: 'credit', route: 'Morawaka' },
  { id: 21, shopId: 5, date: d(16), docType: 'Invoice',  docNo: 'INV-2026-015', amount:  78000, chequeNo: '',          bankName: '',              description: 'Safety gear',         salesPerson: 'Rohan Weerasinghe', salesPersonPhone: '077-5556677', paymentMode: 'credit', route: 'Morawaka' },
  { id: 22, shopId: 5, date: d(28), docType: 'Payment',  docNo: 'PAY-2026-007', amount:  45000, chequeNo: 'CHQ-458315',bankName: 'Peoples Bank Morawaka', description: 'Full settlement', salesPerson: '',                  salesPersonPhone: '',            paymentMode: 'cheque', route: '' },

  // ── Royal Hardware Mart (id:6) ──
  { id: 23, shopId: 6, date: d(11), docType: 'Invoice',  docNo: 'INV-2026-014', amount: 195000, chequeNo: '',          bankName: '',              description: 'Building materials',  salesPerson: 'Saman Kumara', salesPersonPhone: '077-6667788', paymentMode: 'credit', route: 'Akuressa' },
  { id: 24, shopId: 6, date: d(19), docType: 'Invoice',  docNo: 'INV-2026-016', amount:  65000, chequeNo: '',          bankName: '',              description: 'Paint supplies',      salesPerson: 'Saman Kumara', salesPersonPhone: '077-6667788', paymentMode: 'credit', route: 'Akuressa' },
  { id: 36, shopId: 6, date: d(25), docType: 'Payment',  docNo: 'PAY-2026-015', amount:  60000, chequeNo: '',          bankName: '',              description: 'Cash settlement',     salesPerson: '',             salesPersonPhone: '',            paymentMode: 'cash',   route: '' },

  // ── City Light Electricals (id:8) ──
  { id: 25, shopId: 8, date: d(13), docType: 'Invoice',  docNo: 'INV-2026-017', amount: 280000, chequeNo: '',          bankName: '',              description: 'Solar equipment',     salesPerson: 'Lalith Dissanayake', salesPersonPhone: '077-8889900', paymentMode: 'credit', route: 'Urubokka' },
  { id: 26, shopId: 8, date: d(21), docType: 'Payment',  docNo: 'PAY-2026-008', amount: 100000, chequeNo: 'CHQ-458320',bankName: 'Seylan Urubokka',description: 'Installment',         salesPerson: '',                   salesPersonPhone: '',            paymentMode: 'cheque', route: '' },

  // ── Sathosa Hardware & Electricals (id:9) ──
  { id: 27, shopId: 9, date: d(17), docType: 'Invoice',  docNo: 'INV-2026-019', amount: 125000, chequeNo: '',          bankName: '',              description: 'Generator supplies',  salesPerson: 'Ajith Bandara', salesPersonPhone: '077-9990011', paymentMode: 'credit', route: 'Kamburupitiya' },
  { id: 28, shopId: 9, date: d(30), docType: 'Payment',  docNo: 'PAY-2026-009', amount:  50000, chequeNo: '',          bankName: '',              description: 'Cash payment',        salesPerson: '',              salesPersonPhone: '',            paymentMode: 'cash',   route: '' },
  { id: 29, shopId: 9, date: d(45), docType: 'Invoice',  docNo: 'INV-2026-020', amount:  88000, chequeNo: '',          bankName: '',              description: 'Water pumps',         salesPerson: 'Ajith Bandara', salesPersonPhone: '077-9990011', paymentMode: 'credit', route: 'Kamburupitiya' },

  // ── Nimal Electrical Center (id:10) ──
  { id: 30, shopId: 10, date: d(23), docType: 'Invoice', docNo: 'INV-2026-021', amount:  72000, chequeNo: '',          bankName: '',              description: 'Wiring accessories',  salesPerson: 'Dinesh Kumara', salesPersonPhone: '077-1002003', paymentMode: 'credit', route: 'Kamburupitiya' },
  { id: 31, shopId: 10, date: d(38), docType: 'Payment', docNo: 'PAY-2026-010', amount:  72000, chequeNo: 'CHQ-458325',bankName: 'Peoples Bank Kamburupitiya', description: 'Full settlement', salesPerson: '', salesPersonPhone: '',            paymentMode: 'cheque', route: '' },

  // ── Metro Electrical House (id:12) ──
  { id: 32, shopId: 12, date: d(26), docType: 'Invoice', docNo: 'INV-2026-022', amount: 350000, chequeNo: '',          bankName: '',              description: 'Transformer & switchgear', salesPerson: 'Mahesh Jayasuriya', salesPersonPhone: '077-5006007', paymentMode: 'credit', route: 'Akuressa' },
  { id: 33, shopId: 12, date: d(33), docType: 'Payment', docNo: 'PAY-2026-011', amount: 100000, chequeNo: 'CHQ-458330',bankName: 'BOC Akuressa',  description: 'Advance',             salesPerson: '',                  salesPersonPhone: '',            paymentMode: 'cheque', route: '' },
  { id: 34, shopId: 12, date: d(42), docType: 'Invoice', docNo: 'INV-2026-023', amount:  45000, chequeNo: '',          bankName: '',              description: 'Additional cables',   salesPerson: 'Mahesh Jayasuriya', salesPersonPhone: '077-5006007', paymentMode: 'credit', route: 'Akuressa' },
  { id: 37, shopId: 12, date: d(50), docType: 'Payment', docNo: 'PAY-2026-016', amount:  50000, chequeNo: 'CHK-331002',bankName: 'NSB Akuressa',  description: 'Direct check',        salesPerson: '',                  salesPersonPhone: '',            paymentMode: 'check',  route: '' },
];

/**
 * POST-DATED CHEQUES (held in hand, not yet deposited)
 * id, shopId, chequeNo, bankName, chequeDate, amount
 */
export const postDatedCheques = [
  { id: 1, shopId:  1, chequeNo: 'CHQ-458201', bankName: 'BOC Morawaka',              chequeDate: d(1), amount:  50000 },
  { id: 2, shopId:  1, chequeNo: 'CHQ-458305', bankName: 'Peoples Bank Morawaka',     chequeDate: d(3), amount: 100000 },
  { id: 3, shopId:  3, chequeNo: 'CHQ-458302', bankName: 'BOC Deniyaya',              chequeDate: d(5), amount: 100000 },
  { id: 4, shopId:  4, chequeNo: 'CHQ-459010', bankName: 'HNB Urubokka',             chequeDate: d(7), amount: 150000 },
  { id: 5, shopId: 12, chequeNo: 'CHQ-458330', bankName: 'BOC Akuressa',             chequeDate: d(2), amount: 100000 },
];

/** Monthly trend data for dashboard chart */
export const monthlyTrend = [
  { month: 'Feb', outstanding: 820000, recovered: 180000, invoiced: 1000000 },
  { month: 'Mar', outstanding: 915000, recovered: 210000, invoiced: 1125000 },
  { month: 'Apr', outstanding: 788000, recovered: 245000, invoiced: 1033000 },
  { month: 'May', outstanding: 946000, recovered: 195000, invoiced: 1141000 },
  { month: 'Jun', outstanding: 1102000, recovered: 280000, invoiced: 1382000 },
  { month: 'Jul', outstanding: 985000, recovered: 310000, invoiced: 1295000 },
  { month: 'Aug', outstanding: 872000, recovered: 225000, invoiced: 1097000 },
  { month: 'Sep', outstanding: 1025000, recovered: 190000, invoiced: 1215000 },
  { month: 'Oct', outstanding: 958000, recovered: 265000, invoiced: 1223000 },
  { month: 'Nov', outstanding: 1120000, recovered: 240000, invoiced: 1360000 },
  { month: 'Dec', outstanding: 1050000, recovered: 290000, invoiced: 1340000 },
  { month: 'Jan', outstanding: 963000, recovered: 320000, invoiced: 1283000 },
];

/** Available routes for hardware stores */
export const routes = [
  'Morawaka',
  'Akuressa',
  'Deniyaya',
  'Urubokka',
  'Kamburupitiya',
  'Kotapola',
  'Hakmana',
];

/** Available bank names for cheque/check entries */
export const bankNames = [
  'BOC Morawaka',
  'BOC Akuressa',
  'BOC Deniyaya',
  'BOC Kamburupitiya',
  'Peoples Bank Morawaka',
  'Peoples Bank Akuressa',
  'Peoples Bank Kamburupitiya',
  'HNB Urubokka',
  'HNB Akuressa',
  'Sampath Bank Akuressa',
  'Seylan Urubokka',
  'NSB Akuressa',
  'Commercial Bank Akuressa',
  'NTB Kamburupitiya',
];

export const getNextId = (items) => Math.max(...items.map(i => i.id), 0) + 1;

export const getNextDocNo = (type, items) => {
  const prefix = type === 'Invoice' ? 'INV' : 'PAY';
  const year = new Date().getFullYear();
  const existing = items.filter(t => t.docNo && t.docNo.startsWith(`${prefix}-${year}`));
  const maxNum = existing.reduce((max, t) => {
    const parts = t.docNo.split('-');
    const num = parseInt(parts[2], 10);
    return num > max ? num : max;
  }, 0);
  return `${prefix}-${year}-${String(maxNum + 1).padStart(3, '0')}`;
};

/** Generate receipt number in Orange Electric format: OR-YYYY-NNN */
export const getNextReceiptNo = (items) => {
  const year = new Date().getFullYear();
  const existing = items.filter(t => t.receiptNo && t.receiptNo.startsWith(`OR-${year}`));
  const maxNum = existing.reduce((max, t) => {
    const parts = t.receiptNo.split('-');
    const num = parseInt(parts[2], 10);
    return num > max ? num : max;
  }, 0);
  return `OR-${year}-${String(maxNum + 1).padStart(3, '0')}`;
};
