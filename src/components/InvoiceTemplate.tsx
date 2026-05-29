import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import type { Order, ServiceOrder, InvoiceSettings } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const intPart = Math.floor(num);
  const paisePart = Math.round((num - intPart) * 100);

  let result = '';
  if (intPart >= 10000000) {
    result += convertChunk(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  if (intPart % 10000000 >= 100000) {
    result += convertChunk(Math.floor((intPart % 10000000) / 100000)) + ' Lakh ';
  }
  if (intPart % 100000 >= 1000) {
    result += convertChunk(Math.floor((intPart % 100000) / 1000)) + ' Thousand ';
  }
  if (intPart % 1000 >= 100) {
    result += convertChunk(Math.floor((intPart % 1000) / 100)) + ' Hundred ';
  }
  if (intPart % 100 > 0) {
    result += convertChunk(intPart % 100) + ' ';
  }
  result = 'Rupees ' + result.trim();
  if (paisePart > 0) result += ' and ' + convertChunk(paisePart) + ' Paise';
  return result + ' Only';
}

function formatDateIN(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Invoice Number Generator ─────────────────────────────────────────────────

function getInvoiceNumber(id: string, type: 'product' | 'service') {
  const year = new Date().getFullYear();
  const suffix = id.replace(/\D/g, '').slice(-6).padStart(6, '0');
  return type === 'product' ? `INV-${year}-${suffix}` : `SINV-${year}-${suffix}`;
}

// ── HTML Generator (for print window) ───────────────────────────────────────

export function generateInvoiceHtml(
  order: Order | ServiceOrder,
  invoiceSettings: InvoiceSettings | undefined,
  type: 'product' | 'service'
): string {
  const inv = invoiceSettings ?? {};
  const isProduct = type === 'product';
  const o = order as Order;
  const so = order as ServiceOrder;

  const sellerName = inv.businessName || (isProduct ? o.storeName : so.providerName);
  const gstin = inv.gstin || '—';
  const pan = inv.pan || '—';
  const sellerAddr = [inv.address, inv.city, inv.state, inv.pincode].filter(Boolean).join(', ') || '—';
  const gstRate = inv.gstRate ?? 18;
  const halfGst = gstRate / 2;

  const invoiceNo = getInvoiceNumber(order.id, type);
  const invoiceDate = formatDateIN(order.createdAt);

  // Line items
  let lineItems: Array<{ desc: string; hsn: string; qty: number; unit: string; rate: number; amount: number }> = [];
  let subtotal = 0;

  if (isProduct) {
    lineItems = o.items.map(item => {
      const amount = item.price * item.quantity;
      subtotal += amount;
      return {
        desc: item.productName,
        hsn: inv.hsnCode || '8518',
        qty: item.quantity,
        unit: 'Nos',
        rate: item.price,
        amount,
      };
    });
  } else {
    subtotal = so.amount;
    lineItems = [{
      desc: so.serviceTitle,
      hsn: inv.sacCode || '998600',
      qty: 1,
      unit: 'Job',
      rate: so.amount,
      amount: so.amount,
    }];
  }

  // Tax calculation (amounts are inclusive of GST for simplicity — recalculate base)
  const taxableAmount = parseFloat((subtotal / (1 + gstRate / 100)).toFixed(2));
  const totalGst = parseFloat((subtotal - taxableAmount).toFixed(2));
  const cgst = parseFloat((totalGst / 2).toFixed(2));
  const sgst = totalGst - cgst;
  const grandTotal = subtotal;

  // Customer info
  const customerName = isProduct ? o.customerName : so.customerName;
  const customerEmail = isProduct ? o.customerEmail : so.customerEmail;
  const customerPhone = isProduct ? '' : (so.customerPhone || '');
  const customerAddr = isProduct ? `${o.address}, ${o.city}` : `${so.address}, ${so.city}`;

  const signatory = inv.signatory || sellerName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-logo { width: 42px; height: 42px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 10px;
    display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
  .brand-name { font-size: 20px; font-weight: 800; color: #1e293b; }
  .brand-sub { font-size: 11px; color: #64748b; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
  .invoice-meta p { font-size: 12px; color: #475569; margin-top: 2px; }
  .invoice-meta span { font-weight: 600; color: #1e293b; }

  /* Divider */
  .divider { height: 3px; background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899); border-radius: 2px; margin: 16px 0; }
  .divider-thin { height: 1px; background: #e2e8f0; margin: 12px 0; }

  /* Parties */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .party-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .party-box.buyer { background: #eff6ff; border-color: #bfdbfe; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
    color: #4f46e5; margin-bottom: 6px; }
  .party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .party-detail { font-size: 11px; color: #475569; margin-top: 2px; line-height: 1.5; }
  .party-gstin { font-size: 11px; font-family: monospace; color: #1e293b; font-weight: 600; margin-top: 4px; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table th { background: #1e293b; color: #fff; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 10px; text-align: left; }
  .items-table th.right { text-align: right; }
  .items-table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: middle; }
  .items-table td.right { text-align: right; }
  .items-table td.center { text-align: center; }
  .items-table tr:last-child td { border-bottom: none; }
  .items-table tr:nth-child(even) td { background: #f8fafc; }
  .item-name { font-weight: 600; color: #0f172a; }
  .item-hsn { font-size: 10px; color: #64748b; font-family: monospace; margin-top: 1px; }
  .table-wrapper { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }

  /* Summary */
  .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .summary-row.bold { font-weight: 600; color: #1e293b; }
  .summary-row.total { font-weight: 800; font-size: 15px; color: #4f46e5; border-top: 2px solid #c7d2fe;
    margin-top: 6px; padding-top: 10px; }
  .summary-right { text-align: right; min-width: 90px; }
  .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .layout-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  .layout-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }

  /* Amount words */
  .words-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
  .words-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #16a34a; letter-spacing: 0.5px; margin-bottom: 3px; }
  .words-value { font-size: 12px; font-weight: 600; color: #14532d; font-style: italic; }

  /* Bank details */
  .bank-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; }
  .bank-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #92400e; letter-spacing: 0.5px; margin-bottom: 6px; }
  .bank-row { display: flex; gap: 6px; font-size: 11px; color: #451a03; margin-top: 2px; }
  .bank-key { color: #78350f; font-weight: 600; min-width: 90px; }

  /* Footer */
  .footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .terms-box { flex: 1; margin-right: 24px; }
  .terms-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px; }
  .terms-text { font-size: 10px; color: #475569; line-height: 1.6; }
  .sign-box { text-align: center; min-width: 160px; }
  .sign-area { height: 48px; border-bottom: 1px solid #cbd5e1; margin-bottom: 6px; }
  .sign-label { font-size: 10px; color: #64748b; }
  .sign-name { font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px; }

  /* Status badge */
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
    border-radius: 99px; font-size: 11px; font-weight: 600; }
  .paid { background: #dcfce7; color: #166534; }
  .pending { background: #fef3c7; color: #92400e; }

  /* Watermark */
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 80px; font-weight: 900; color: rgba(79,70,229,0.05); pointer-events: none; z-index: 0; white-space: nowrap; }

  /* Print button */
  .print-bar { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 0 20px; }
  .btn-print { display: inline-flex; align-items: center; gap: 8px; background: #4f46e5; color: white;
    border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.2s; }
  .btn-print:hover { background: #4338ca; }
  .btn-close { display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; color: #475569;
    border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; }

  @media print {
    .print-bar { display: none; }
    .watermark { position: fixed; }
    body { background: white; }
  }
</style>
</head>
<body>

<div class="watermark">AskIndia</div>

<div class="page">

  <!-- Print bar -->
  <div class="print-bar">
    <button class="btn-close" onclick="window.close()">✕ Close</button>
    <button class="btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div>
        <div class="brand-name">AskIndia</div>
        <div class="brand-sub">askindia.shop &nbsp;|&nbsp; GST Marketplace</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">TAX INVOICE</div>
      <p>Invoice No: <span>${invoiceNo}</span></p>
      <p>Invoice Date: <span>${invoiceDate}</span></p>
      <p style="margin-top:6px;">
        <span class="status-badge ${isProduct && (o as Order).paymentStatus === 'paid' ? 'paid' : so.status === 'completed' ? 'paid' : 'pending'}">
          ${isProduct
            ? ((o as Order).paymentStatus === 'paid' ? '✓ PAID' : 'PENDING')
            : (so.status === 'completed' ? '✓ COMPLETED' : so.status.replace('_', ' ').toUpperCase())}
        </span>
      </p>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Seller & Buyer -->
  <div class="parties">
    <div class="party-box">
      <div class="party-label">Bill From (Seller)</div>
      <div class="party-name">${sellerName}</div>
      <div class="party-detail">${sellerAddr}</div>
      ${inv.phone ? `<div class="party-detail">📞 ${inv.phone}</div>` : ''}
      ${inv.email ? `<div class="party-detail">✉ ${inv.email}</div>` : ''}
      <div class="party-gstin">GSTIN: ${gstin}</div>
      <div class="party-gstin">PAN: ${pan}</div>
      ${inv.state ? `<div class="party-detail">State: ${inv.state}${inv.stateCode ? ` (${inv.stateCode})` : ''}</div>` : ''}
    </div>
    <div class="party-box buyer">
      <div class="party-label">Bill To (Buyer)</div>
      <div class="party-name">${customerName}</div>
      <div class="party-detail">${customerAddr}</div>
      ${customerPhone ? `<div class="party-detail">📞 ${customerPhone}</div>` : ''}
      ${customerEmail ? `<div class="party-detail">✉ ${customerEmail}</div>` : ''}
      <div class="party-detail" style="margin-top:4px; font-size:10px; color:#64748b;">
        Order Ref: <strong>${order.id.toUpperCase()}</strong>
      </div>
      ${isProduct && (o as Order).paymentMethod ? `<div class="party-detail">Payment: ${(o as Order).paymentMethod.toUpperCase()}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <div class="table-wrapper">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th>Description of Goods / Services</th>
          <th style="width:80px">HSN/SAC</th>
          <th class="right" style="width:50px">Qty</th>
          <th class="right" style="width:50px">Unit</th>
          <th class="right" style="width:90px">Rate (₹)</th>
          <th class="right" style="width:100px">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map((item, i) => `
        <tr>
          <td class="center" style="color:#94a3b8; font-size:11px">${i + 1}</td>
          <td>
            <div class="item-name">${item.desc}</div>
            <div class="item-hsn">HSN/SAC: ${item.hsn}</div>
          </td>
          <td class="center" style="font-family:monospace; font-size:11px; color:#64748b">${item.hsn}</td>
          <td class="right">${item.qty}</td>
          <td class="right" style="color:#64748b">${item.unit}</td>
          <td class="right">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(item.rate)}</td>
          <td class="right" style="font-weight:600">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(item.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Summary + Tax -->
  <div class="layout-3col">
    <!-- Tax breakdown -->
    <div class="summary-box" style="grid-column: span 1;">
      <div style="font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:8px;">Tax Summary</div>
      <div class="summary-row">
        <span>Taxable Value</span>
        <span class="summary-right">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(taxableAmount)}</span>
      </div>
      <div class="summary-row">
        <span>CGST @ ${halfGst}%</span>
        <span class="summary-right">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(cgst)}</span>
      </div>
      <div class="summary-row">
        <span>SGST @ ${halfGst}%</span>
        <span class="summary-right">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(sgst)}</span>
      </div>
      <div class="divider-thin"></div>
      <div class="summary-row bold">
        <span>Total GST</span>
        <span class="summary-right">${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(totalGst)}</span>
      </div>
    </div>

    <!-- Grand total -->
    <div class="summary-box" style="grid-column: span 2; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:8px;">Invoice Summary</div>
        <div class="summary-row">
          <span style="color:#475569">Sub Total (incl. tax)</span>
          <span class="summary-right">${fmt(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span style="color:#475569">Delivery / Service Charges</span>
          <span class="summary-right" style="color:#16a34a">FREE</span>
        </div>
        <div class="divider-thin"></div>
      </div>
      <div class="summary-row total">
        <span>Grand Total</span>
        <span class="summary-right">${fmt(grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- Amount in words -->
  <div class="words-box">
    <div class="words-label">Amount in Words</div>
    <div class="words-value">${numberToWords(grandTotal)}</div>
  </div>

  <!-- Bank details -->
  ${(inv.bankAccount || inv.upiId) ? `
  <div class="bank-box" style="margin-bottom:16px;">
    <div class="bank-label">Payment Details</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
      ${inv.bankName ? `<div class="bank-row"><span class="bank-key">Bank Name:</span> ${inv.bankName}</div>` : ''}
      ${inv.bankAccount ? `<div class="bank-row"><span class="bank-key">Account No.:</span> ${inv.bankAccount}</div>` : ''}
      ${inv.bankIfsc ? `<div class="bank-row"><span class="bank-key">IFSC Code:</span> ${inv.bankIfsc}</div>` : ''}
      ${inv.bankBranch ? `<div class="bank-row"><span class="bank-key">Branch:</span> ${inv.bankBranch}</div>` : ''}
      ${inv.upiId ? `<div class="bank-row"><span class="bank-key">UPI ID:</span> ${inv.upiId}</div>` : ''}
    </div>
  </div>` : ''}

  <!-- Footer: T&C + Signature -->
  <div class="footer">
    <div class="terms-box">
      <div class="terms-label">Terms & Conditions</div>
      <div class="terms-text">${inv.termsAndConditions || `1. Goods once sold will not be taken back or exchanged.\n2. All disputes are subject to local jurisdiction only.\n3. E. &amp; O.E. (Errors and Omissions Excepted).\n4. This is a computer-generated invoice and does not require a physical signature unless stated otherwise.`}</div>
    </div>
    <div class="sign-box">
      <div class="sign-area"></div>
      <div class="sign-label">For <strong>${sellerName}</strong></div>
      <div class="sign-name">${signatory}</div>
      <div class="sign-label">Authorised Signatory</div>
    </div>
  </div>

  <div class="divider" style="margin-top:20px;"></div>
  <div style="text-align:center; font-size:10px; color:#94a3b8; margin-top:8px; padding-bottom:8px;">
    This invoice was generated by <strong>AskIndia</strong> (askindia.shop) · Thank you for your business!
  </div>

</div>
</body>
</html>`;
}

// ── React Invoice Modal ──────────────────────────────────────────────────────

interface InvoiceModalProps {
  order: Order | ServiceOrder;
  invoiceSettings?: InvoiceSettings;
  type: 'product' | 'service';
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, invoiceSettings, type, onClose }) => {
  const handlePrint = () => {
    const html = generateInvoiceHtml(order, invoiceSettings, type);
    const w = window.open('', '_blank', 'width=900,height=780,scrollbars=yes');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  };

  const isProduct = type === 'product';
  const o = order as Order;
  const so = order as ServiceOrder;
  const inv = invoiceSettings ?? {};
  const gstRate = inv.gstRate ?? 18;
  const halfGst = gstRate / 2;
  const subtotal = isProduct ? o.total : so.amount;
  const taxableAmount = parseFloat((subtotal / (1 + gstRate / 100)).toFixed(2));
  const totalGst = parseFloat((subtotal - taxableAmount).toFixed(2));
  const cgst = parseFloat((totalGst / 2).toFixed(2));
  const sgst = totalGst - cgst;
  const invoiceNo = getInvoiceNumber(order.id, type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Tax Invoice Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Invoice No: <span className="font-mono font-semibold text-indigo-600">{invoiceNo}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print / PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 space-y-5">
          {/* Invoice Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold">AI</div>
              <div>
                <p className="font-bold text-slate-900">AskIndia</p>
                <p className="text-xs text-slate-400">askindia.shop</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-indigo-600 tracking-tight">TAX INVOICE</p>
              <p className="text-xs text-slate-500 mt-1">No: <span className="font-mono font-semibold">{invoiceNo}</span></p>
              <p className="text-xs text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full" />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Bill From (Seller)</p>
              <p className="font-bold text-sm text-slate-900">{inv.businessName || (isProduct ? o.storeName : so.providerName)}</p>
              {inv.address && <p className="text-xs text-slate-500 mt-1">{inv.address}, {inv.city}</p>}
              {inv.gstin && <p className="text-xs font-mono font-semibold text-slate-700 mt-1">GSTIN: {inv.gstin}</p>}
              {inv.pan && <p className="text-xs font-mono font-semibold text-slate-700">PAN: {inv.pan}</p>}
              {!inv.gstin && <p className="text-xs text-slate-400 italic mt-1">No GST details added</p>}
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Bill To (Buyer)</p>
              <p className="font-bold text-sm text-slate-900">{isProduct ? o.customerName : so.customerName}</p>
              <p className="text-xs text-slate-500 mt-1">{isProduct ? `${o.address}, ${o.city}` : `${so.address}, ${so.city}`}</p>
              {!isProduct && so.customerPhone && <p className="text-xs text-slate-500">📞 {so.customerPhone}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold">Item</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold">HSN/SAC</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold">Rate</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isProduct ? o.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.productName}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-mono text-slate-400">{inv.hsnCode || '8518'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(item.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(item.price * item.quantity)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{so.serviceTitle}</p>
                      <p className="text-xs text-slate-400">by {so.providerName}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-mono text-slate-400">{inv.sacCode || '998600'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">1</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(so.amount)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(so.amount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Summary + Grand Total */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tax Breakup (GST {gstRate}%)</p>
              <div className="flex justify-between text-slate-600"><span>Taxable Amount</span><span>{fmt(taxableAmount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>CGST @ {halfGst}%</span><span>{fmt(cgst)}</span></div>
              <div className="flex justify-between text-slate-600"><span>SGST @ {halfGst}%</span><span>{fmt(sgst)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t pt-2"><span>Total GST</span><span>{fmt(totalGst)}</span></div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Invoice Total</p>
                <div className="flex justify-between text-slate-600"><span>Sub Total</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-emerald-600 font-medium"><span>Delivery</span><span>FREE</span></div>
              </div>
              <div className="flex justify-between font-black text-lg text-indigo-700 border-t border-indigo-200 pt-3 mt-3">
                <span>Grand Total</span><span>{fmt(subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Amount in Words</p>
            <p className="text-sm font-semibold text-emerald-800 italic">{numberToWords(subtotal)}</p>
          </div>

          {/* Print CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">Click "Print / PDF" to save this invoice as a PDF file</p>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
