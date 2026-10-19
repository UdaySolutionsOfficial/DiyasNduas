import * as XLSX from 'xlsx';
import { Order } from '../types/order';
import { Product } from '../types/product';
import { Coupon } from '../types/coupon';
import { formatDate } from '../utils/formatters';

/**
 * Sanitizes sheet names to conform with Excel requirements:
 * - Max 31 characters
 * - No characters from: [ \ / ? * [ ] : ]
 */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, '-').trim();
  return cleaned.slice(0, 31) || 'Sheet';
}

/**
 * Standard column headers for Diyas N Duas order exports.
 */
const EXCEL_HEADERS = [
  'Order ID',
  'Date & Time',
  'Customer Name',
  'Phone Number',
  'Delivery Address',
  'Items Summary',
  'Total Items',
  'Subtotal (INR)',
  'Promo Code',
  'Discount (INR)',
  'Tax (INR)',
  'Delivery Fee (INR)',
  'Total Amount (INR)',
  'Order Status'
];

/**
 * Converts an Order object into a formatted row array.
 */
function formatOrderToRow(order: Order): (string | number)[] {
  const itemsSummary = order.items
    ? order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')
    : `${order.itemCount} items`;

  const address = order.customerInfo
    ? `${order.customerInfo.address || ''}, ${order.customerInfo.city || ''} ${order.customerInfo.pincode || ''}`.trim()
    : 'N/A';

  const promoCodeDisplay = order.couponCode && order.couponCode.trim()
    ? order.couponCode.trim().toUpperCase()
    : 'No promo code used';

  return [
    order.orderId,
    formatDate(order.createdAt),
    order.customerInfo?.fullName || 'N/A',
    order.customerInfo?.phone || 'N/A',
    address,
    itemsSummary,
    order.itemCount || 0,
    order.subtotal || 0,
    promoCodeDisplay,
    order.discountAmount || 0,
    order.taxAmount || 0,
    order.deliveryFee || 0,
    order.total || 0,
    (order.orderStatus || 'pending').toUpperCase()
  ];
}

/**
 * Builds a worksheet for a given list of orders with headers and a summary totals row.
 */
function createWorksheetForOrders(orders: Order[], sheetTitle?: string): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Title Row if provided
  if (sheetTitle) {
    rows.push([`DIYAS N DUAS — ${sheetTitle.toUpperCase()}`]);
    rows.push([`Generated On: ${formatDate(Date.now())}`]);
    rows.push([]);
  }

  // Header Row
  rows.push(EXCEL_HEADERS);

  if (!orders || orders.length === 0) {
    rows.push(['No order transactions recorded for this period.', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = EXCEL_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 16) }));
    return ws;
  }

  // Data Rows
  let totalUnits = 0;
  let totalSubtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalDelivery = 0;
  let totalRevenue = 0;

  orders.forEach(order => {
    rows.push(formatOrderToRow(order));

    // Only add to financial totals if not cancelled
    if (order.orderStatus !== 'cancelled') {
      totalUnits += order.itemCount || 0;
      totalSubtotal += order.subtotal || 0;
      totalDiscount += order.discountAmount || 0;
      totalTax += order.taxAmount || 0;
      totalDelivery += order.deliveryFee || 0;
      totalRevenue += order.total || 0;
    }
  });

  // Empty separator
  rows.push([]);

  // Summary Totals Row
  rows.push([
    'NET TOTALS (Active Orders)',
    `Orders Count: ${orders.filter(o => o.orderStatus !== 'cancelled').length}`,
    `Cancelled Count: ${orders.filter(o => o.orderStatus === 'cancelled').length}`,
    '',
    '',
    '',
    totalUnits,
    totalSubtotal,
    '', // Empty for Promo Code
    totalDiscount,
    totalTax,
    totalDelivery,
    totalRevenue,
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths based on content
  const colWidths = EXCEL_HEADERS.map((header, idx) => {
    let maxLen = header.length;
    rows.forEach(row => {
      const cellVal = row[idx];
      if (cellVal !== undefined && cellVal !== null) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 14), 50) };
  });

  ws['!cols'] = colWidths;
  return ws;
}

/**
 * Triggers browser download of a workbook.
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string): void {
  XLSX.writeFile(workbook, fileName, { compression: true });
}

export const revenueExportService = {
  /**
   * 1. Export Today's Single-Sheet Report
   */
  exportToday(orders: Order[]): void {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = orders.filter(
      o => o.createdAt >= todayStart.getTime() && o.createdAt <= todayEnd.getTime()
    );

    const wb = XLSX.utils.book_new();
    const sheetName = sanitizeSheetName(`Today_${todayStart.toLocaleDateString('en-GB').replace(/\//g, '-')}`);
    const ws = createWorksheetForOrders(todayOrders, "Today's Order & Revenue Ledger");

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    downloadWorkbook(wb, `DND_Today_Revenue_Report_${todayStart.toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * 2. Export This Week Multi-Sheet Report (Last 7 days, Mon–Sun)
   */
  exportWeek(orders: Order[]): void {
    const wb = XLSX.utils.book_new();

    // 7 Days list from 6 days ago up to today
    const days: { date: Date; start: number; end: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();

      const endD = new Date(d);
      endD.setHours(23, 59, 59, 999);
      const end = endD.getTime();

      const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const label = `${dayName} ${dayDate}`; // e.g. "Fri 16-Oct"

      days.push({ date: d, start, end, label });
    }

    // 1. Overview Sheet (Weekly Summary)
    const summaryRows: (string | number)[][] = [
      ['DIYAS N DUAS — WEEKLY REVENUE EXECUTIVE SUMMARY'],
      [`Period: ${days[0].label} to ${days[days.length - 1].label}`],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      ['Day & Date', 'Total Orders', 'Active Orders', 'Cancelled Orders', 'Net Revenue (INR)', 'Cancelled Lost Value (INR)']
    ];

    let grandOrders = 0;
    let grandRevenue = 0;
    let grandCancelledValue = 0;

    const dayOrdersMap = new Map<string, Order[]>();

    days.forEach(day => {
      const dayOrders = orders.filter(o => o.createdAt >= day.start && o.createdAt <= day.end);
      dayOrdersMap.set(day.label, dayOrders);

      const active = dayOrders.filter(o => o.orderStatus !== 'cancelled');
      const cancelled = dayOrders.filter(o => o.orderStatus === 'cancelled');
      const netRev = active.reduce((sum, o) => sum + (o.total || 0), 0);
      const lostRev = cancelled.reduce((sum, o) => sum + (o.total || 0), 0);

      grandOrders += active.length;
      grandRevenue += netRev;
      grandCancelledValue += lostRev;

      summaryRows.push([
        day.label,
        dayOrders.length,
        active.length,
        cancelled.length,
        netRev,
        lostRev
      ]);
    });

    summaryRows.push([]);
    summaryRows.push([
      'TOTAL (7-DAY PERIOD)',
      summaryRows.slice(5, 12).reduce((sum, r) => sum + Number(r[1]), 0),
      grandOrders,
      summaryRows.slice(5, 12).reduce((sum, r) => sum + Number(r[3]), 0),
      grandRevenue,
      grandCancelledValue
    ]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 16 },
      { wch: 20 },
      { wch: 24 }
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, sanitizeSheetName('Weekly Summary'));

    // 2. Individual Daily Sheets for each of the 7 days
    days.forEach(day => {
      const dayOrders = dayOrdersMap.get(day.label) || [];
      const dayWs = createWorksheetForOrders(dayOrders, `Daily Ledger — ${day.label}`);
      XLSX.utils.book_append_sheet(wb, dayWs, sanitizeSheetName(day.label));
    });

    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_Weekly_MultiSheet_Report_${todayStr}.xlsx`);
  },

  /**
   * 3. Export This Month Multi-Sheet Report (4 Weekly Breakdown Sheets + Monthly Summary)
   */
  exportMonth(orders: Order[]): void {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const monthName = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    // Define 4 weeks of the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const totalDaysInMonth = endOfMonth.getDate();

    const weeks = [
      { name: 'Week 1 (Days 1-7)', startDay: 1, endDay: 7 },
      { name: 'Week 2 (Days 8-14)', startDay: 8, endDay: 14 },
      { name: 'Week 3 (Days 15-21)', startDay: 15, endDay: 21 },
      { name: `Week 4 (Days 22-${totalDaysInMonth})`, startDay: 22, endDay: totalDaysInMonth }
    ];

    // Summary Sheet
    const summaryRows: (string | number)[][] = [
      [`DIYAS N DUAS — MONTHLY REVENUE REPORT (${monthName.toUpperCase()})`],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      ['Week Period', 'Total Orders', 'Active Orders', 'Cancelled Orders', 'Net Revenue (INR)', 'Lost Value (INR)']
    ];

    let monthlyNet = 0;
    let monthlyOrders = 0;

    weeks.forEach(w => {
      const wStart = new Date(now.getFullYear(), now.getMonth(), w.startDay, 0, 0, 0, 0).getTime();
      const wEnd = new Date(now.getFullYear(), now.getMonth(), w.endDay, 23, 59, 59, 999).getTime();

      const weekOrders = orders.filter(o => o.createdAt >= wStart && o.createdAt <= wEnd);
      const active = weekOrders.filter(o => o.orderStatus !== 'cancelled');
      const cancelled = weekOrders.filter(o => o.orderStatus === 'cancelled');
      const net = active.reduce((sum, o) => sum + (o.total || 0), 0);
      const lost = cancelled.reduce((sum, o) => sum + (o.total || 0), 0);

      monthlyNet += net;
      monthlyOrders += active.length;

      summaryRows.push([
        w.name,
        weekOrders.length,
        active.length,
        cancelled.length,
        net,
        lost
      ]);
    });

    summaryRows.push([]);
    summaryRows.push(['MONTHLY TOTAL', '', monthlyOrders, '', monthlyNet, '']);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [{ wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 16 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, sanitizeSheetName('Monthly Summary'));

    // 4 Weekly Sheets
    weeks.forEach(w => {
      const wStart = new Date(now.getFullYear(), now.getMonth(), w.startDay, 0, 0, 0, 0).getTime();
      const wEnd = new Date(now.getFullYear(), now.getMonth(), w.endDay, 23, 59, 59, 999).getTime();
      const weekOrders = orders.filter(o => o.createdAt >= wStart && o.createdAt <= wEnd);

      const weekWs = createWorksheetForOrders(weekOrders, `Weekly Breakdown — ${w.name}`);
      XLSX.utils.book_append_sheet(wb, weekWs, sanitizeSheetName(w.name));
    });

    const fileMonth = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    downloadWorkbook(wb, `DND_Monthly_Report_${fileMonth}.xlsx`);
  },

  /**
   * 4. Export This Year Multi-Sheet Report (12 Month Sheets + Annual Summary)
   */
  exportYear(orders: Order[]): void {
    const wb = XLSX.utils.book_new();
    const currentYear = new Date().getFullYear();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const summaryRows: (string | number)[][] = [
      [`DIYAS N DUAS — ANNUAL REVENUE REPORT (${currentYear})`],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      ['Month', 'Total Orders', 'Active Orders', 'Cancelled Orders', 'Net Revenue (INR)', 'Average Order Value (INR)']
    ];

    let annualRevenue = 0;
    let annualOrders = 0;

    monthNames.forEach((name, mIdx) => {
      const mStart = new Date(currentYear, mIdx, 1, 0, 0, 0, 0).getTime();
      const mEnd = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999).getTime();

      const mOrders = orders.filter(o => o.createdAt >= mStart && o.createdAt <= mEnd);
      const active = mOrders.filter(o => o.orderStatus !== 'cancelled');
      const cancelled = mOrders.filter(o => o.orderStatus === 'cancelled');
      const net = active.reduce((sum, o) => sum + (o.total || 0), 0);
      const aov = active.length > 0 ? Math.round(net / active.length) : 0;

      annualRevenue += net;
      annualOrders += active.length;

      summaryRows.push([
        `${String(mIdx + 1).padStart(2, '0')} - ${name}`,
        mOrders.length,
        active.length,
        cancelled.length,
        net,
        aov
      ]);
    });

    summaryRows.push([]);
    summaryRows.push([
      'ANNUAL TOTAL',
      '',
      annualOrders,
      '',
      annualRevenue,
      annualOrders > 0 ? Math.round(annualRevenue / annualOrders) : 0
    ]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 16 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, sanitizeSheetName('Annual Summary'));

    // 12 Monthly sheets
    monthNames.forEach((name, mIdx) => {
      const mStart = new Date(currentYear, mIdx, 1, 0, 0, 0, 0).getTime();
      const mEnd = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999).getTime();
      const mOrders = orders.filter(o => o.createdAt >= mStart && o.createdAt <= mEnd);

      const mWs = createWorksheetForOrders(mOrders, `Monthly Ledger — ${name} ${currentYear}`);
      XLSX.utils.book_append_sheet(wb, mWs, sanitizeSheetName(`${String(mIdx + 1).padStart(2, '0')}-${name}`));
    });

    downloadWorkbook(wb, `DND_Annual_12Months_Report_${currentYear}.xlsx`);
  },

  /**
   * 5. Export All-Time Master Ledger
   */
  exportAllTime(orders: Order[]): void {
    const wb = XLSX.utils.book_new();

    const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled');

    // Sheet 1: Master Active Orders Ledger
    const activeWs = createWorksheetForOrders(activeOrders, 'All-Time Valid Orders Ledger');
    XLSX.utils.book_append_sheet(wb, activeWs, sanitizeSheetName('Active Orders Ledger'));

    // Sheet 2: Cancelled Orders Ledger
    const cancelledWs = createWorksheetForOrders(cancelledOrders, 'Cancelled & Voided Orders Ledger');
    XLSX.utils.book_append_sheet(wb, cancelledWs, sanitizeSheetName('Cancelled Orders'));

    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_All_Time_Complete_Ledger_${todayStr}.xlsx`);
  },

  /**
   * 6. Export Custom Date Range Report
   */
  exportCustomRange(orders: Order[], startDateStr: string, endDateStr: string): void {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const filtered = orders.filter(o => o.createdAt >= start.getTime() && o.createdAt <= end.getTime());

    const wb = XLSX.utils.book_new();
    const ws = createWorksheetForOrders(
      filtered,
      `Custom Range (${start.toLocaleDateString('en-GB')} to ${end.toLocaleDateString('en-GB')})`
    );

    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName('Custom Range Orders'));
    downloadWorkbook(wb, `DND_Custom_Revenue_Report_${startDateStr}_to_${endDateStr}.xlsx`);
  },

  /**
   * 7. Export Orders Ledger for Admin Orders page
   */
  exportOrdersLedger(orders: Order[], filterLabel?: string): void {
    const wb = XLSX.utils.book_new();
    const sheetTitle = filterLabel ? `Orders Ledger (${filterLabel})` : 'Orders Management Ledger';
    const ws = createWorksheetForOrders(orders, sheetTitle);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName('Orders Ledger'));
    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_Orders_Ledger_${todayStr}.xlsx`);
  },

  /**
   * 8. Export Products Catalog & Inventory for Admin Products page
   * Generates a comprehensive multi-sheet workbook with:
   * - Master "All Products" inventory sheet (complete catalog)
   * - Category-wise dedicated breakdown sheets for every category
   */
  exportProductsCatalog(products: Product[]): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Product ID',
      'Product Name',
      'Category Name',
      'Original Price (INR)',
      'Selling Price (INR)',
      'Actual Cost (INR)',
      'Est. Unit Profit (INR)',
      'Discount (%)',
      'Stock Quantity',
      'Inventory Status',
      'Listing Status',
      'Featured',
      'Badge Tag',
      'Date Added'
    ];

    const buildProductRows = (list: Product[], titleText: string, totalLabel: string) => {
      const rows: (string | number)[][] = [
        [`DIYAS N DUAS — ${titleText.toUpperCase()}`],
        [`Export Date: ${formatDate(Date.now())}`],
        [],
        headers
      ];

      let totalStockUnits = 0;
      let totalInventoryValue = 0;
      let totalCostValue = 0;

      list.forEach(p => {
        const discountPct = p.originalPrice > p.sellingPrice
          ? `${Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100)}%`
          : '0%';

        const stockStatus = p.stockQuantity === 0
          ? 'OUT OF STOCK'
          : p.stockQuantity <= 10
          ? 'LOW STOCK'
          : 'IN STOCK';

        const cost = p.actualCost || 0;
        const estProfit = cost > 0 ? p.sellingPrice - cost : 0;

        totalStockUnits += p.stockQuantity || 0;
        totalInventoryValue += (p.stockQuantity || 0) * (p.sellingPrice || 0);
        if (cost > 0) {
          totalCostValue += (p.stockQuantity || 0) * cost;
        }

        rows.push([
          p.id,
          p.name,
          p.categoryName || p.categoryId || 'Traditional Diyas',
          p.originalPrice,
          p.sellingPrice,
          cost > 0 ? cost : 'N/A',
          cost > 0 ? estProfit : 'N/A',
          discountPct,
          p.stockQuantity,
          stockStatus,
          p.isActive ? 'ACTIVE' : 'INACTIVE / DRAFT',
          p.isFeatured ? 'YES' : 'NO',
          p.badge || 'None',
          formatDate(p.createdAt)
        ]);
      });

      rows.push([]);
      rows.push([
        totalLabel,
        `${list.length} Products Listed`,
        '',
        '',
        '',
        totalCostValue > 0 ? `Total Cost: INR ${totalCostValue}` : '',
        totalCostValue > 0 ? `Total Est. Profit: INR ${totalInventoryValue - totalCostValue}` : '',
        '',
        totalStockUnits,
        '',
        `Total Inventory Value: INR ${totalInventoryValue}`,
        '',
        '',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = headers.map((h, idx) => {
        let maxLen = h.length;
        rows.forEach(r => {
          if (r[idx] !== undefined && r[idx] !== null) {
            maxLen = Math.max(maxLen, String(r[idx]).length);
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 14), 45) };
      });

      return ws;
    };

    // 1. Master Sheet: All Products
    const masterWs = buildProductRows(
      products,
      'MASTER PRODUCT CATALOG & INVENTORY LEDGER',
      'TOTAL INVENTORY'
    );
    XLSX.utils.book_append_sheet(wb, masterWs, sanitizeSheetName('All Products'));

    // 2. Category-wise Sheets: One dedicated sheet per category
    const categoryMap = new Map<string, Product[]>();
    products.forEach(p => {
      const catName = p.categoryName || p.categoryId || 'Traditional Diyas';
      const list = categoryMap.get(catName) || [];
      list.push(p);
      categoryMap.set(catName, list);
    });

    const usedSheetNames = new Set<string>(['All Products']);

    // Sort categories alphabetically
    const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    sortedCategories.forEach(([catName, catProducts]) => {
      let sheetName = sanitizeSheetName(catName);
      if (usedSheetNames.has(sheetName)) {
        let counter = 2;
        while (usedSheetNames.has(sanitizeSheetName(`${sheetName.slice(0, 27)}_${counter}`))) {
          counter++;
        }
        sheetName = sanitizeSheetName(`${sheetName.slice(0, 27)}_${counter}`);
      }
      usedSheetNames.add(sheetName);

      const catWs = buildProductRows(
        catProducts,
        `CATEGORY: ${catName} (${catProducts.length} PRODUCTS)`,
        `CATEGORY TOTAL (${catName})`
      );
      XLSX.utils.book_append_sheet(wb, catWs, sheetName);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_Products_Catalog_${todayStr}.xlsx`);
  },

  /**
   * 9. Export Profitability & Margin Analysis Ledger
   */
  exportProfitabilityReport(
    activeOrders: Order[],
    products: Product[],
    periodLabel: string
  ): void {
    const wb = XLSX.utils.book_new();

    // Aggregate Product Profit Stats
    const prodMap = new Map<string, {
      name: string;
      category: string;
      units: number;
      unitPrice: number;
      actualCost: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    activeOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId);
          const cat = prod?.categoryName || prod?.categoryId || 'Traditional Diyas';
          const unitPrice = it.unitPrice || prod?.sellingPrice || 0;
          const cost = prod?.actualCost || 0;
          const qty = it.quantity || 1;
          const itemRev = it.subtotal || (unitPrice * qty);
          const itemCost = cost * qty;

          const prev = prodMap.get(it.productId) || {
            name: it.name || prod?.name || 'Product',
            category: cat,
            units: 0,
            unitPrice,
            actualCost: cost,
            revenue: 0,
            cost: 0,
            profit: 0
          };

          prodMap.set(it.productId, {
            ...prev,
            units: prev.units + qty,
            revenue: prev.revenue + itemRev,
            cost: prev.cost + itemCost,
            profit: prev.profit + (itemRev - itemCost)
          });
        });
      }
    });

    const productList = Array.from(prodMap.values()).sort((a, b) => b.profit - a.profit);

    // Sheet 1: Product Profitability
    const prodHeaders = [
      'Product Name',
      'Category',
      'Units Sold',
      'Avg Selling Price (INR)',
      'Actual Cost / Unit (INR)',
      'Total Revenue (INR)',
      'Total Cost Spent (INR)',
      'Net Profit Earned (INR)',
      'Profit Margin (%)'
    ];

    const prodRows: (string | number)[][] = [
      [`DIYAS N DUAS — PROFITABILITY & NET MARGINS ANALYSIS (${periodLabel.toUpperCase()})`],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      prodHeaders
    ];

    let totalSold = 0;
    let totalRev = 0;
    let totalCost = 0;
    let totalProf = 0;

    productList.forEach(p => {
      totalSold += p.units;
      totalRev += p.revenue;
      totalCost += p.cost;
      totalProf += p.profit;
      const marginPct = p.revenue > 0 ? `${Math.round((p.profit / p.revenue) * 100)}%` : '0%';

      prodRows.push([
        p.name,
        p.category,
        p.units,
        Math.round(p.unitPrice),
        p.actualCost > 0 ? p.actualCost : 'Not Set',
        p.revenue,
        p.cost,
        p.profit,
        marginPct
      ]);
    });

    const overallMargin = totalRev > 0 ? `${Math.round((totalProf / totalRev) * 100)}%` : '0%';
    prodRows.push([]);
    prodRows.push([
      'TOTAL STORE PERFORMANCE',
      `${productList.length} Active Products`,
      totalSold,
      '',
      '',
      totalRev,
      totalCost,
      totalProf,
      overallMargin
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(prodRows);
    ws1['!cols'] = prodHeaders.map((h, idx) => {
      let maxLen = h.length;
      prodRows.forEach(r => {
        if (r[idx] !== undefined && r[idx] !== null) {
          maxLen = Math.max(maxLen, String(r[idx]).length);
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 14), 45) };
    });
    XLSX.utils.book_append_sheet(wb, ws1, sanitizeSheetName('Product Profit Margins'));

    // Sheet 2: Category Profit Margins
    const catMap = new Map<string, { revenue: number; cost: number; profit: number; units: number }>();
    productList.forEach(p => {
      const prev = catMap.get(p.category) || { revenue: 0, cost: 0, profit: 0, units: 0 };
      catMap.set(p.category, {
        revenue: prev.revenue + p.revenue,
        cost: prev.cost + p.cost,
        profit: prev.profit + p.profit,
        units: prev.units + p.units
      });
    });

    const catHeaders = [
      'Category Name',
      'Total Units Sold',
      'Total Revenue (INR)',
      'Total Cost Spent (INR)',
      'Net Profit (INR)',
      'Profit Margin (%)'
    ];

    const catRows: (string | number)[][] = [
      [`DIYAS N DUAS — CATEGORY PROFITABILITY BREAKDOWN (${periodLabel.toUpperCase()})`],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      catHeaders
    ];

    Array.from(catMap.entries()).forEach(([catName, data]) => {
      const mPct = data.revenue > 0 ? `${Math.round((data.profit / data.revenue) * 100)}%` : '0%';
      catRows.push([
        catName,
        data.units,
        data.revenue,
        data.cost,
        data.profit,
        mPct
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(catRows);
    ws2['!cols'] = catHeaders.map(h => ({ wch: Math.max(h.length + 4, 18) }));
    XLSX.utils.book_append_sheet(wb, ws2, sanitizeSheetName('Category Breakdown'));

    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_Profitability_Report_${periodLabel}_${todayStr}.xlsx`);
  },

  /**
   * 10. Export Coupons & Promo Code Performance Report for Admin Taxes & Coupons page
   * Multi-sheet workbook:
   * - Sheet 1: Coupons Performance Summary (Redemption counts, unique customer count, total discount, sales generated)
   * - Sheet 2: Customer Redemptions Log (Detailed breakdown of each customer order where a promo code was used)
   */
  exportCouponsUsageReport(coupons: Coupon[], orders: Order[]): void {
    const wb = XLSX.utils.book_new();

    // Group active orders by normalized coupon code
    const validOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const totalValidOrders = validOrders.length;

    // Collect all unique coupon codes from both the coupons list and orders
    const codeMap = new Map<string, {
      code: string;
      description: string;
      discountOffer: string;
      status: string;
      minOrder: number;
      expiresAt: string;
      orders: Order[];
      uniqueCustomerSet: Set<string>;
      totalDiscount: number;
      totalSales: number;
    }>();

    // Populate all configured coupons first
    coupons.forEach(c => {
      const normCode = c.code.trim().toUpperCase();
      const isExpired = c.expiresAt ? c.expiresAt < Date.now() : false;
      const statusStr = !c.isActive ? 'INACTIVE' : isExpired ? 'EXPIRED' : 'ACTIVE';
      const offerStr = c.discountType === 'percentage'
        ? `${c.discountValue}% OFF${c.maxDiscount ? ` (Max ₹${c.maxDiscount})` : ''}`
        : `₹${c.discountValue} Flat OFF`;

      codeMap.set(normCode, {
        code: normCode,
        description: c.description || 'Promotional Discount',
        discountOffer: offerStr,
        status: statusStr,
        minOrder: c.minOrderValue || 0,
        expiresAt: c.expiresAt ? formatDate(c.expiresAt) : 'No Expiry',
        orders: [],
        uniqueCustomerSet: new Set(),
        totalDiscount: 0,
        totalSales: 0
      });
    });

    // Next, map valid orders that used any promo code
    validOrders.forEach(o => {
      if (o.couponCode && o.couponCode.trim()) {
        const normCode = o.couponCode.trim().toUpperCase();
        let entry = codeMap.get(normCode);
        if (!entry) {
          entry = {
            code: normCode,
            description: 'Custom Promo Code',
            discountOffer: 'Special Discount',
            status: 'ARCHIVED / SPECIAL',
            minOrder: 0,
            expiresAt: 'N/A',
            orders: [],
            uniqueCustomerSet: new Set(),
            totalDiscount: 0,
            totalSales: 0
          };
          codeMap.set(normCode, entry);
        }

        entry.orders.push(o);
        const custKey = o.customerInfo?.phone || o.customerInfo?.fullName || o.id;
        if (custKey) entry.uniqueCustomerSet.add(custKey);
        entry.totalDiscount += (o.discountAmount || o.couponDiscount || 0);
        entry.totalSales += (o.total || 0);
      }
    });

    // Sheet 1: Coupons Performance Summary
    const summaryHeaders = [
      'Promo Code',
      'Discount Offer',
      'Orders Redeemed',
      'Unique Customers',
      'Usage Share (%)',
      'Total Discount Given (INR)',
      'Total Sales Generated (INR)',
      'Min Order Value (INR)',
      'Coupon Status',
      'Expiry Date',
      'Description'
    ];

    const totalRedeemedOrders = Array.from(codeMap.values()).reduce((sum, e) => sum + e.orders.length, 0);
    const totalDiscountAll = Array.from(codeMap.values()).reduce((sum, e) => sum + e.totalDiscount, 0);
    const totalSalesAll = Array.from(codeMap.values()).reduce((sum, e) => sum + e.totalSales, 0);

    const summaryRows: (string | number)[][] = [
      ['DIYAS N DUAS — PROMO CODES & COUPONS PERFORMANCE AUDIT'],
      [`Generated On: ${formatDate(Date.now())}`],
      [
        `Active Store Orders: ${totalValidOrders}`,
        `Total Promo Redemptions: ${totalRedeemedOrders}`,
        `Total Discounts Given: INR ${totalDiscountAll}`,
        `Total Sales Generated: INR ${totalSalesAll}`
      ],
      [],
      summaryHeaders
    ];

    Array.from(codeMap.values())
      .sort((a, b) => b.orders.length - a.orders.length)
      .forEach(entry => {
        const usageShare = totalValidOrders > 0
          ? `${Math.round((entry.orders.length / totalValidOrders) * 100)}% (${entry.orders.length}/${totalValidOrders})`
          : `${entry.orders.length} orders`;

        summaryRows.push([
          entry.code,
          entry.discountOffer,
          entry.orders.length,
          entry.uniqueCustomerSet.size,
          usageShare,
          entry.totalDiscount,
          entry.totalSales,
          entry.minOrder,
          entry.status,
          entry.expiresAt,
          entry.description
        ]);
      });

    // Summary Totals Row
    summaryRows.push([]);
    summaryRows.push([
      'TOTALS',
      '',
      totalRedeemedOrders,
      '',
      '',
      totalDiscountAll,
      totalSalesAll,
      '',
      '',
      '',
      ''
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = summaryHeaders.map((h, idx) => {
      let maxLen = h.length;
      summaryRows.forEach(r => {
        if (r[idx] !== undefined && r[idx] !== null) {
          maxLen = Math.max(maxLen, String(r[idx]).length);
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 15), 45) };
    });
    XLSX.utils.book_append_sheet(wb, ws1, sanitizeSheetName('Coupons Performance'));

    // Sheet 2: Customer Redemptions Log
    const redemptionsHeaders = [
      'Promo Code Used',
      'Order ID',
      'Date & Time',
      'Customer Name',
      'Phone Number',
      'Delivery City',
      'Order Subtotal (INR)',
      'Discount Applied (INR)',
      'Total Paid (INR)',
      'Order Status'
    ];

    const redemptionsRows: (string | number)[][] = [
      ['DIYAS N DUAS — INDIVIDUAL CUSTOMER PROMO CODE REDEMPTIONS'],
      [`Generated On: ${formatDate(Date.now())}`],
      [],
      redemptionsHeaders
    ];

    let hasRedemptions = false;
    Array.from(codeMap.values()).forEach(entry => {
      entry.orders.forEach(o => {
        hasRedemptions = true;
        redemptionsRows.push([
          entry.code,
          o.orderId,
          formatDate(o.createdAt),
          o.customerInfo?.fullName || 'N/A',
          o.customerInfo?.phone || 'N/A',
          o.customerInfo?.city || 'N/A',
          o.subtotal || 0,
          o.discountAmount || o.couponDiscount || 0,
          o.total || 0,
          (o.orderStatus || 'pending').toUpperCase()
        ]);
      });
    });

    if (!hasRedemptions) {
      redemptionsRows.push(['No customer orders have redeemed promo codes yet.', '', '', '', '', '', '', '', '', '']);
    }

    const ws2 = XLSX.utils.aoa_to_sheet(redemptionsRows);
    ws2['!cols'] = redemptionsHeaders.map(h => ({ wch: Math.max(h.length + 3, 16) }));
    XLSX.utils.book_append_sheet(wb, ws2, sanitizeSheetName('Customer Redemptions'));

    const todayStr = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `DND_Coupons_Performance_Report_${todayStr}.xlsx`);
  }
};
