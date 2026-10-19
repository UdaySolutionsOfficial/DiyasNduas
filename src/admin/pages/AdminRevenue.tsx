import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ordersService } from '../../services/orders.service';
import { productsService } from '../../services/products.service';
import { revenueExportService } from '../../services/revenueExport.service';
import { Order } from '../../types/order';
import { Product } from '../../types/product';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { formatINR } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Calendar,
  LineChart,
  BarChart3,
  PieChart,
  DollarSign,
  ChevronDown,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Search,
  Percent,
  Coins,
  Layers,
  Info
} from 'lucide-react';

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
type ChartViewType = 'line' | 'bar' | 'donut';

interface TimePoint {
  label: string;
  shortLabel: string;
  timestamp: number;
  revenue: number;
  cost: number;
  profit: number;
  ordersCount: number;
}

export const AdminRevenue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Time & Visualization Controls
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [chartType, setChartType] = useState<ChartViewType>('line');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Custom Date Range State
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // View Navigation: 'overview' | 'profitability'
  const [viewMode, setViewMode] = useState<'overview' | 'profitability'>('overview');
  const [profitChartType, setProfitChartType] = useState<'trend' | 'category'>('trend');
  const [profitCategoryFilter, setProfitCategoryFilter] = useState<string>('all');
  const [profitSearchQuery, setProfitSearchQuery] = useState<string>('');
  const [profitSortBy, setProfitSortBy] = useState<'profit' | 'revenue' | 'cost' | 'margin' | 'units'>('profit');

  // Interactive Chart Tooltip State
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);
  const [hoveredProfitPointIndex, setHoveredProfitPointIndex] = useState<number | null>(null);
  const [hoveredProfitDonutSlice, setHoveredProfitDonutSlice] = useState<number | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Load Real Data & Subscribe to Live Realtime Updates
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ords, prods] = await Promise.all([
          ordersService.getAllOrders(),
          productsService.getAllProducts()
        ]);
        setOrders(ords);
        setProducts(prods);
      } catch (err) {
        console.warn('[AdminRevenue] Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to RTDB live order updates for instant reactive metrics
    const unsubscribe = ordersService.subscribeToAllOrders((liveOrders) => {
      setOrders(liveOrders);
    });

    return () => unsubscribe();
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Time Boundary Timestamps
  const { periodStart, periodEnd } = useMemo(() => {
    const now = new Date();
    let start = 0;
    let end = now.getTime();

    if (period === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
      const endD = new Date(d);
      endD.setHours(23, 59, 59, 999);
      end = endD.getTime();
    } else if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
    } else if (period === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      start = d.getTime();
    } else if (period === 'year') {
      const d = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      start = d.getTime();
    } else if (period === 'all') {
      start = 0;
    } else if (period === 'custom') {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      start = s.getTime();

      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      end = e.getTime();
    }

    return { periodStart: start, periodEnd: end };
  }, [period, customStart, customEnd]);

  // Filter Orders in Current Period & Calculate Comprehensive Financials (Revenue, Cost, Profit)
  const {
    activeOrders,
    cancelledOrders,
    totalRevenue,
    totalCost,
    totalProfit,
    overallMarginPct,
    overallRoiPct,
    totalOrdersCount,
    aov,
    totalUnitsSold,
    lostValue
  } = useMemo(() => {
    const inRange = orders.filter(o => o.createdAt >= periodStart && o.createdAt <= periodEnd);
    const valid = inRange.filter(o => o.orderStatus !== 'cancelled');
    const cancelled = inRange.filter(o => o.orderStatus === 'cancelled');

    const rev = valid.reduce((sum, o) => sum + (o.total || 0), 0);
    const units = valid.reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const lost = cancelled.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderVal = valid.length > 0 ? Math.round(rev / valid.length) : 0;

    let cost = 0;
    valid.forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId);
          const uCost = (prod && prod.actualCost !== undefined && prod.actualCost !== null) ? Number(prod.actualCost) : 0;
          cost += uCost * it.quantity;
        });
      }
    });

    const profit = rev - cost;
    const marginPct = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    const roiPct = cost > 0 ? Math.round((profit / cost) * 100) : 0;

    return {
      activeOrders: valid,
      cancelledOrders: cancelled,
      totalRevenue: rev,
      totalCost: cost,
      totalProfit: profit,
      overallMarginPct: marginPct,
      overallRoiPct: roiPct,
      totalOrdersCount: valid.length,
      aov: avgOrderVal,
      totalUnitsSold: units,
      lostValue: lost
    };
  }, [orders, products, periodStart, periodEnd]);

  // Aggregate Time Points for Line & Bar Chart (with Revenue, Cost & Profit)
  const timePoints: TimePoint[] = useMemo(() => {
    const computeBucketFinancials = (bOrders: Order[]) => {
      let bRev = 0;
      let bCost = 0;
      bOrders.forEach(o => {
        bRev += (o.total || 0);
        if (o.items) {
          o.items.forEach(it => {
            const prod = products.find(p => p.id === it.productId);
            const uCost = (prod && prod.actualCost !== undefined && prod.actualCost !== null) ? Number(prod.actualCost) : 0;
            bCost += uCost * it.quantity;
          });
        }
      });
      return { bRev, bCost, bProfit: bRev - bCost };
    };

    if (period === 'today') {
      const points: TimePoint[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = today.getTime();

      for (let h = 0; h < 24; h += 3) {
        const bStart = base + h * 3600 * 1000;
        const bEnd = base + (h + 3) * 3600 * 1000 - 1;
        const bOrders = activeOrders.filter(o => o.createdAt >= bStart && o.createdAt <= bEnd);
        const { bRev, bCost, bProfit } = computeBucketFinancials(bOrders);

        const labelHour = `${String(h).padStart(2, '0')}:00`;
        points.push({
          label: `${labelHour} - ${String(h + 3).padStart(2, '0')}:00`,
          shortLabel: labelHour,
          timestamp: bStart,
          revenue: bRev,
          cost: bCost,
          profit: bProfit,
          ordersCount: bOrders.length
        });
      }
      return points;
    }

    if (period === 'week') {
      const points: TimePoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const bStart = d.getTime();
        const bEnd = bStart + 24 * 3600 * 1000 - 1;

        const bOrders = activeOrders.filter(o => o.createdAt >= bStart && o.createdAt <= bEnd);
        const { bRev, bCost, bProfit } = computeBucketFinancials(bOrders);

        const shortDay = d.toLocaleDateString('en-GB', { weekday: 'short' });
        const shortDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        points.push({
          label: `${shortDay}, ${shortDate}`,
          shortLabel: shortDay,
          timestamp: bStart,
          revenue: bRev,
          cost: bCost,
          profit: bProfit,
          ordersCount: bOrders.length
        });
      }
      return points;
    }

    if (period === 'month') {
      const points: TimePoint[] = [];
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weekBuckets = [
        { label: 'Week 1 (Days 1-7)', shortLabel: 'W1', s: 1, e: 7 },
        { label: 'Week 2 (Days 8-14)', shortLabel: 'W2', s: 8, e: 14 },
        { label: 'Week 3 (Days 15-21)', shortLabel: 'W3', s: 15, e: 21 },
        { label: `Week 4 (Days 22-${endOfMonth})`, shortLabel: 'W4', s: 22, e: endOfMonth }
      ];

      weekBuckets.forEach(wb => {
        const bStart = new Date(now.getFullYear(), now.getMonth(), wb.s, 0, 0, 0, 0).getTime();
        const bEnd = new Date(now.getFullYear(), now.getMonth(), wb.e, 23, 59, 59, 999).getTime();

        const bOrders = activeOrders.filter(o => o.createdAt >= bStart && o.createdAt <= bEnd);
        const { bRev, bCost, bProfit } = computeBucketFinancials(bOrders);

        points.push({
          label: wb.label,
          shortLabel: wb.shortLabel,
          timestamp: bStart,
          revenue: bRev,
          cost: bCost,
          profit: bProfit,
          ordersCount: bOrders.length
        });
      });
      return points;
    }

    if (period === 'year') {
      const points: TimePoint[] = [];
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      months.forEach((mName, mIdx) => {
        const bStart = new Date(currentYear, mIdx, 1, 0, 0, 0, 0).getTime();
        const bEnd = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999).getTime();

        const bOrders = activeOrders.filter(o => o.createdAt >= bStart && o.createdAt <= bEnd);
        const { bRev, bCost, bProfit } = computeBucketFinancials(bOrders);

        points.push({
          label: `${mName} ${currentYear}`,
          shortLabel: mName,
          timestamp: bStart,
          revenue: bRev,
          cost: bCost,
          profit: bProfit,
          ordersCount: bOrders.length
        });
      });
      return points;
    }

    // Default / All / Custom
    const points: TimePoint[] = [];
    const minTime = periodStart === 0 && activeOrders.length > 0
      ? Math.min(...activeOrders.map(o => o.createdAt))
      : periodStart;
    const maxTime = periodEnd;
    const interval = Math.max((maxTime - minTime) / 6, 24 * 3600 * 1000);

    for (let i = 0; i < 6; i++) {
      const bStart = minTime + i * interval;
      const bEnd = bStart + interval - 1;
      const bOrders = activeOrders.filter(o => o.createdAt >= bStart && o.createdAt <= bEnd);
      const { bRev, bCost, bProfit } = computeBucketFinancials(bOrders);

      const d = new Date(bStart);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      points.push({
        label: `Interval: ${label}`,
        shortLabel: label,
        timestamp: bStart,
        revenue: bRev,
        cost: bCost,
        profit: bProfit,
        ordersCount: bOrders.length
      });
    }
    return points;
  }, [period, activeOrders, periodStart, periodEnd, products]);

  // Category Breakdown for Donut Chart
  const categoryStats = useMemo(() => {
    const catMap = new Map<string, { revenue: number; units: number }>();

    activeOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId);
          const catName = prod?.categoryName || prod?.categoryId || 'Traditional Diyas';
          const prev = catMap.get(catName) || { revenue: 0, units: 0 };
          catMap.set(catName, {
            revenue: prev.revenue + (it.subtotal || it.unitPrice * it.quantity),
            units: prev.units + it.quantity
          });
        });
      }
    });

    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#8B5CF6'];
    const totalCatRevenue = Array.from(catMap.values()).reduce((sum, c) => sum + c.revenue, 0) || 1;

    return Array.from(catMap.entries()).map(([name, data], idx) => ({
      name,
      revenue: data.revenue,
      units: data.units,
      percentage: Math.round((data.revenue / totalCatRevenue) * 100) || 0,
      ratio: data.revenue / totalCatRevenue,
      color: colors[idx % colors.length]
    }));
  }, [activeOrders, products]);

  // Top Selling Products in Period
  const topProducts = useMemo(() => {
    const prodMap = new Map<string, { name: string; image: string; units: number; revenue: number }>();

    activeOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const prev = prodMap.get(it.productId) || {
            name: it.name,
            image: it.image || '',
            units: 0,
            revenue: 0
          };
          prodMap.set(it.productId, {
            ...prev,
            units: prev.units + it.quantity,
            revenue: prev.revenue + (it.subtotal || it.unitPrice * it.quantity)
          });
        });
      }
    });

    return Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [activeOrders]);

  // Product-Level Detailed Profitability Breakdown
  interface ProductProfitItem {
    productId: string;
    name: string;
    image: string;
    categoryName: string;
    sellingPrice: number;
    actualCost: number;
    hasActualCost: boolean;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPct: number;
  }

  const productProfitStats = useMemo<ProductProfitItem[]>(() => {
    const map = new Map<string, ProductProfitItem>();

    activeOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId);
          const hasActualCost = prod?.actualCost !== undefined && prod?.actualCost !== null && Number(prod.actualCost) > 0;
          const actualCost = hasActualCost ? Number(prod!.actualCost) : 0;
          const sellingPrice = it.unitPrice || prod?.sellingPrice || 0;
          const itemRev = it.subtotal || (sellingPrice * it.quantity);
          const itemCost = actualCost * it.quantity;
          const itemProfit = itemRev - itemCost;
          const cat = prod?.categoryName || prod?.categoryId || 'Traditional Diyas';

          const existing = map.get(it.productId);
          if (existing) {
            existing.unitsSold += it.quantity;
            existing.revenue += itemRev;
            existing.cost += itemCost;
            existing.profit += itemProfit;
            existing.marginPct = existing.revenue > 0 ? Math.round((existing.profit / existing.revenue) * 100) : 0;
          } else {
            map.set(it.productId, {
              productId: it.productId,
              name: it.name || prod?.name || 'Handcrafted Item',
              image: it.image || prod?.images?.[0] || '',
              categoryName: cat,
              sellingPrice,
              actualCost,
              hasActualCost,
              unitsSold: it.quantity,
              revenue: itemRev,
              cost: itemCost,
              profit: itemProfit,
              marginPct: itemRev > 0 ? Math.round((itemProfit / itemRev) * 100) : 0
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [activeOrders, products]);

  // Category Profit Contribution Breakdown
  const categoryProfitStats = useMemo(() => {
    const catMap = new Map<string, { revenue: number; cost: number; profit: number; units: number }>();

    productProfitStats.forEach(p => {
      const prev = catMap.get(p.categoryName) || { revenue: 0, cost: 0, profit: 0, units: 0 };
      catMap.set(p.categoryName, {
        revenue: prev.revenue + p.revenue,
        cost: prev.cost + p.cost,
        profit: prev.profit + p.profit,
        units: prev.units + p.unitsSold
      });
    });

    const colors = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6'];
    const totalProfit = Array.from(catMap.values()).reduce((sum, c) => sum + Math.max(c.profit, 0), 0) || 1;

    return Array.from(catMap.entries()).map(([name, data], idx) => ({
      name,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
      units: data.units,
      marginPct: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0,
      percentage: Math.max(0, Math.round((Math.max(data.profit, 0) / totalProfit) * 100)),
      ratio: Math.max(0, data.profit) / totalProfit,
      color: colors[idx % colors.length]
    }));
  }, [productProfitStats]);

  // Unique Categories for Profit Filter Dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.categoryName) set.add(p.categoryName);
      else if (p.categoryId) set.add(p.categoryId);
    });
    productProfitStats.forEach(p => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [products, productProfitStats]);

  // Filtered & Sorted Product Profitability List
  const filteredProductProfitStats = useMemo(() => {
    let list = [...productProfitStats];

    if (profitCategoryFilter !== 'all') {
      list = list.filter(p => p.categoryName === profitCategoryFilter);
    }

    if (profitSearchQuery.trim()) {
      const q = profitSearchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (profitSortBy === 'profit') return b.profit - a.profit;
      if (profitSortBy === 'revenue') return b.revenue - a.revenue;
      if (profitSortBy === 'cost') return b.cost - a.cost;
      if (profitSortBy === 'margin') return b.marginPct - a.marginPct;
      if (profitSortBy === 'units') return b.unitsSold - a.unitsSold;
      return 0;
    });

    return list;
  }, [productProfitStats, profitCategoryFilter, profitSearchQuery, profitSortBy]);

  const periodLabelText = useMemo(() => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      case 'custom': return `${customStart} to ${customEnd}`;
      default: return 'Period';
    }
  }, [period, customStart, customEnd]);

  if (loading) {
    return <Loading message="Loading Diyas N Duas Revenue Analytics..." />;
  }

  // Chart Max Values & Scaling
  const maxRevenue = Math.max(...timePoints.map(p => p.revenue), 1000);
  const maxOrders = Math.max(...timePoints.map(p => p.ordersCount), 5);

  // SVG Dimension Constants
  const svgWidth = 860;
  const svgHeight = 280;
  const paddingX = 55;
  const paddingY = 40;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Compute SVG Points for Line Chart
  const svgCoords = timePoints.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(timePoints.length - 1, 1)) * plotWidth;
    const y = svgHeight - paddingY - (pt.revenue / maxRevenue) * plotHeight;
    return { x, y, pt };
  });

  // Generate Smooth Bezier SVG Path
  const makeBezierPath = (coords: { x: number; y: number }[]): string => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;

    let path = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePathD = makeBezierPath(svgCoords);
  const areaPathD = svgCoords.length > 0
    ? `${linePathD} L ${svgCoords[svgCoords.length - 1].x},${svgHeight - paddingY} L ${svgCoords[0].x},${svgHeight - paddingY} Z`
    : '';

  // Generate Exact SVG Arc Path for Donut Slices
  const getDonutArc = (cx: number, cy: number, r: number, startAngleDeg: number, endAngleDeg: number): string => {
    const rad = Math.PI / 180;
    const startRad = (startAngleDeg - 90) * rad;
    const endRad = (endAngleDeg - 90) * rad;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const angleDelta = endAngleDeg - startAngleDeg;
    const largeArcFlag = angleDelta > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Profitability Trend SVG Coordinates & Paths
  const maxProfitTrendVal = Math.max(
    ...timePoints.map(p => Math.max(p.revenue, p.cost, Math.max(p.profit, 0))),
    1000
  );

  const profitSvgCoords = timePoints.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(timePoints.length - 1, 1)) * plotWidth;
    const yRev = svgHeight - paddingY - (pt.revenue / maxProfitTrendVal) * plotHeight;
    const yCost = svgHeight - paddingY - (pt.cost / maxProfitTrendVal) * plotHeight;
    const yProfit = svgHeight - paddingY - (Math.max(pt.profit, 0) / maxProfitTrendVal) * plotHeight;
    return { x, yRev, yCost, yProfit, pt };
  });

  const profitRevPathD = makeBezierPath(profitSvgCoords.map(c => ({ x: c.x, y: c.yRev })));
  const profitCostPathD = makeBezierPath(profitSvgCoords.map(c => ({ x: c.x, y: c.yCost })));
  const profitNetPathD = makeBezierPath(profitSvgCoords.map(c => ({ x: c.x, y: c.yProfit })));
  const profitNetAreaD = profitSvgCoords.length > 0
    ? `${profitNetPathD} L ${profitSvgCoords[profitSvgCoords.length - 1].x},${svgHeight - paddingY} L ${profitSvgCoords[0].x},${svgHeight - paddingY} Z`
    : '';

  // Trigger Excel Download
  const handleExport = (type: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom') => {
    setIsExportMenuOpen(false);
    switch (type) {
      case 'today':
        revenueExportService.exportToday(orders);
        break;
      case 'week':
        revenueExportService.exportWeek(orders);
        break;
      case 'month':
        revenueExportService.exportMonth(orders);
        break;
      case 'year':
        revenueExportService.exportYear(orders);
        break;
      case 'all':
        revenueExportService.exportAllTime(orders);
        break;
      case 'custom':
        revenueExportService.exportCustomRange(orders, customStart, customEnd);
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Dynamic Keyframes Styling for High-Performance Chart Animations */}
      <style>{`
        @keyframes chartLineDraw {
          from {
            stroke-dashoffset: 2400;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes chartAreaFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes chartBarGrow {
          from {
            transform: scaleY(0);
            opacity: 0.2;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes chartPointPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.35);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes donutSlicePop {
          0% {
            opacity: 0;
            transform: scale(0.88);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {viewMode === 'overview' ? (
        <>
          {/* Page Header with Period & Excel Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Revenue & Sales Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial performance, interactive trend analytics, and multi-sheet Excel reports.
          </p>
        </div>

        {/* Action Bar (Time Range Filter + Download Dropdown) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Period Selector Pills */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {(['today', 'week', 'month', 'year', 'all', 'custom'] as TimePeriod[]).map((pKey) => {
              const active = period === pKey;
              const labels: Record<TimePeriod, string> = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                year: 'This Year',
                all: 'All Time',
                custom: 'Custom'
              };
              return (
                <button
                  key={pKey}
                  onClick={() => setPeriod(pKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    active
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-102'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[pKey]}
                </button>
              );
            })}
          </div>

          {/* Download Excel Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <Button
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              variant="primary"
              size="md"
              className="font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white border-none"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel Report</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-scale-in">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    Export Multi-Sheet Spreadsheets
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Choose time frame for automated Excel workbook
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleExport('today')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">Today's Transactions</span>
                      <span className="text-[10px] text-slate-400 block">Single-sheet day ledger</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('week')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">This Week (7 Sheets)</span>
                      <span className="text-[10px] text-slate-400 block">Mon–Sun sheets + Weekly Summary</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('month')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">This Month (4 Weeks)</span>
                      <span className="text-[10px] text-slate-400 block">4 Weekly sheets + Monthly Summary</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('year')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">This Year (12 Months)</span>
                      <span className="text-[10px] text-slate-400 block">12 Monthly sheets + Annual Summary</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('all')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">All-Time Master Ledger</span>
                      <span className="text-[10px] text-slate-400 block">Complete historical record</span>
                    </div>
                  </button>

                  {period === 'custom' && (
                    <button
                      onClick={() => handleExport('custom')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 transition-colors group border-t border-slate-100 dark:border-slate-800 pt-2"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold">Custom Range Selected</span>
                        <span className="text-[10px] text-slate-400 block">{customStart} to {customEnd}</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Net Profit & Cost Analysis Button */}
          <Button
            onClick={() => {
              setViewMode('profitability');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            variant="primary"
            size="md"
            className="font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white border-none transition-all hover:scale-102"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Net Profit & Cost Analysis</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Range Picker (Only visible when Custom is active) */}
      {period === 'custom' && (
        <Card glass className="p-4 border-amber-500/30 bg-amber-500/5 animate-scale-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Select Custom Date Window
                </h4>
                <p className="text-[11px] text-slate-500">Pick any custom start and end date to inspect metrics and download tailored spreadsheets.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-slate-400 font-bold self-end pb-2">➔</span>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top High-Impact Financial KPI Cards with Smooth Interactive Hover Animations */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Net Revenue Card */}
        <Card
          glass
          className="group relative overflow-hidden p-4 space-y-2 border-amber-300/60 dark:border-amber-900/60 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/15 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-500 transition-colors">
              Net Revenue
            </span>
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block group-hover:text-amber-500 transition-colors">
              {formatINR(totalRevenue)}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Real Customer Orders</span>
            </span>
          </div>
        </Card>

        {/* Total Orders Card */}
        <Card
          glass
          className="group relative overflow-hidden p-4 space-y-2 border-emerald-300/60 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/15 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-500 transition-colors">
              Active Orders
            </span>
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block group-hover:text-emerald-500 transition-colors">
              {totalOrdersCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Excludes voided
            </span>
          </div>
        </Card>

        {/* Average Order Value (AOV) Card */}
        <Card
          glass
          className="group relative overflow-hidden p-4 space-y-2 border-blue-300/60 dark:border-blue-900/60 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/15 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors">
              Average Order
            </span>
            <div className="p-2 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block group-hover:text-blue-500 transition-colors">
              {formatINR(aov)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Per active cart
            </span>
          </div>
        </Card>

        {/* Units Sold Card */}
        <Card
          glass
          className="group relative overflow-hidden p-4 space-y-2 border-purple-300/60 dark:border-purple-900/60 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/15 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-purple-500 transition-colors">
              Items Sold
            </span>
            <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block group-hover:text-purple-500 transition-colors">
              {totalUnitsSold}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Handcrafted units
            </span>
          </div>
        </Card>

        {/* Cancelled / Lost Value Card */}
        <Card
          glass
          className="group relative overflow-hidden p-4 space-y-2 border-rose-300/60 dark:border-rose-900/60 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent col-span-2 lg:col-span-1 transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/15 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-500 transition-colors">
              Cancelled / Void
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 block">
              {formatINR(lostValue)}
            </span>
            <span className="text-[10px] font-bold text-rose-500/80">
              {cancelledOrders.length} orders voided
            </span>
          </div>
        </Card>
      </div>

      {/* Main Visualized Interactive Chart Container with Entrance Animations */}
      <Card
        key={`${period}-${chartType}`}
        glass
        className="p-4 sm:p-6 space-y-5 border-slate-200 dark:border-slate-800 shadow-xl"
      >
        {/* Chart View Toggle Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>Financial Trajectory & Analytics</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-slate-400">Hover over any data point or segment for exact metrics and order insights.</p>
          </div>

          {/* Visualization Type Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md scale-102'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Trend Line</span>
            </button>

            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md scale-102'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Revenue Bars</span>
            </button>

            <button
              onClick={() => setChartType('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md scale-102'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Distribution</span>
            </button>
          </div>
        </div>

        {/* 1. VIEW A: Smooth Animated SVG Line / Area Chart */}
        {chartType === 'line' && (
          <div className="relative pt-2">
            <div className="w-full overflow-x-auto no-scrollbar">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[650px] h-64 sm:h-72 select-none"
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <defs>
                  {/* Molten Amber Gradient Area Fill */}
                  <linearGradient id="amberAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Golden Line Stroke Gradient */}
                  <linearGradient id="amberLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>

                  {/* High Glow Filter */}
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Horizontal Grid Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = paddingY + pct * plotHeight;
                  const value = Math.round(maxRevenue * (1 - pct));
                  return (
                    <g key={i} className="text-slate-300 dark:text-slate-800">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        strokeOpacity="0.6"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono font-bold"
                      >
                        ₹{value >= 1000 ? `${Math.round(value / 1000)}k` : value}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill with Smooth Fade-in Animation */}
                {areaPathD && (
                  <path
                    d={areaPathD}
                    fill="url(#amberAreaGradient)"
                    style={{
                      animation: 'chartAreaFadeIn 1.3s ease-out forwards'
                    }}
                  />
                )}

                {/* Bezier Line Curve with Smooth Left-to-Right Drawing Animation */}
                {linePathD && (
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="url(#amberLineGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#goldGlow)"
                    style={{
                      strokeDasharray: 2400,
                      animation: 'chartLineDraw 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  />
                )}

                {/* Vertical Cursor Indicator Line on Hover */}
                {hoveredPointIndex !== null && svgCoords[hoveredPointIndex] && (
                  <line
                    x1={svgCoords[hoveredPointIndex].x}
                    y1={paddingY}
                    x2={svgCoords[hoveredPointIndex].x}
                    y2={svgHeight - paddingY}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-pulse"
                  />
                )}

                {/* Interactive Data Points with Staggered Entrance Animation */}
                {svgCoords.map(({ x, y, pt }, idx) => {
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g
                      key={idx}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      style={{
                        transformOrigin: `${x}px ${y}px`,
                        animation: `chartPointPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.3 + idx * 0.08}s both`
                      }}
                    >
                      {/* Invisible wider hit target for touch and mouse */}
                      <circle cx={x} cy={y} r="18" fill="transparent" />

                      {/* Outer Ring */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? '9' : '5'}
                        fill="#F59E0B"
                        fillOpacity={isHovered ? '0.35' : '0.15'}
                        className="transition-all duration-200"
                      />

                      {/* Inner Solid Dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? '6' : '3.5'}
                        fill="#FFFFFF"
                        stroke="#F59E0B"
                        strokeWidth={isHovered ? '3' : '2'}
                        className="transition-all duration-200 shadow-md"
                      />

                      {/* X-Axis Bottom Label */}
                      <text
                        x={x}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className={`text-[10px] font-mono transition-colors ${
                          isHovered
                            ? 'fill-amber-600 dark:fill-amber-400 font-black'
                            : 'fill-slate-400 font-bold'
                        }`}
                      >
                        {pt.shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Glassmorphism Tooltip Card for Line Chart */}
            {hoveredPointIndex !== null && timePoints[hoveredPointIndex] && (
              <div
                className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md text-white shadow-2xl border border-amber-500/30 text-xs space-y-1 transform -translate-x-1/2 -translate-y-full transition-all duration-150 animate-scale-in"
                style={{
                  left: `${(svgCoords[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${(svgCoords[hoveredPointIndex].y / svgHeight) * 100 - 15}%`
                }}
              >
                <div className="font-extrabold text-amber-400 flex items-center gap-1.5 border-b border-slate-700/80 pb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{timePoints[hoveredPointIndex].label}</span>
                </div>
                <div className="flex justify-between gap-4 pt-0.5">
                  <span className="text-slate-400">Net Sales:</span>
                  <span className="font-black text-amber-400 text-sm font-mono">
                    {formatINR(timePoints[hoveredPointIndex].revenue)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Order Count:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {timePoints[hoveredPointIndex].ordersCount} orders
                  </span>
                </div>
                {timePoints[hoveredPointIndex].ordersCount > 0 && (
                  <div className="flex justify-between gap-4 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
                    <span>Average Value:</span>
                    <span className="font-mono text-slate-200">
                      {formatINR(Math.round(timePoints[hoveredPointIndex].revenue / timePoints[hoveredPointIndex].ordersCount))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. VIEW B: Dual-Metric Interactive Bar Chart with Tooltip & Rise Animation */}
        {chartType === 'bar' && (
          <div className="relative pt-2">
            <div className="w-full overflow-x-auto no-scrollbar">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[650px] h-64 sm:h-72 select-none"
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <defs>
                  <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines with Y-Axis Value Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = paddingY + pct * plotHeight;
                  const value = Math.round(maxRevenue * (1 - pct));
                  return (
                    <g key={i} className="text-slate-200 dark:text-slate-800">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono font-bold"
                      >
                        ₹{value >= 1000 ? `${Math.round(value / 1000)}k` : value}
                      </text>
                    </g>
                  );
                })}

                {/* Bars Rendering with Staggered Growth Animation */}
                {timePoints.map((pt, idx) => {
                  const totalSlots = timePoints.length;
                  const slotWidth = plotWidth / totalSlots;
                  const centerX = paddingX + idx * slotWidth + slotWidth / 2;

                  const barWidth = Math.min(slotWidth * 0.35, 26);
                  const revHeight = (pt.revenue / maxRevenue) * plotHeight;
                  const ordHeight = (pt.ordersCount / maxOrders) * (plotHeight * 0.85);

                  const revY = svgHeight - paddingY - revHeight;
                  const ordY = svgHeight - paddingY - ordHeight;

                  const isHovered = hoveredPointIndex === idx;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      style={{
                        transformOrigin: `${centerX}px ${svgHeight - paddingY}px`,
                        animation: `chartBarGrow 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.07}s both`
                      }}
                    >
                      {/* Transparent Hover Hit Box */}
                      <rect
                        x={centerX - slotWidth / 2}
                        y={paddingY}
                        width={slotWidth}
                        height={plotHeight}
                        fill={isHovered ? 'currentColor' : 'transparent'}
                        className="text-amber-500/5 transition-colors"
                      />

                      {/* Revenue Bar (Amber) */}
                      <rect
                        x={centerX - barWidth - 2}
                        y={revY}
                        width={barWidth}
                        height={Math.max(revHeight, 2)}
                        rx="5"
                        fill="url(#goldBarGrad)"
                        className={`transition-all duration-300 ${
                          isHovered ? 'filter drop-shadow-md brightness-115 scale-y-102' : ''
                        }`}
                      />

                      {/* Orders Volume Bar (Emerald) */}
                      <rect
                        x={centerX + 2}
                        y={ordY}
                        width={barWidth}
                        height={Math.max(ordHeight, 2)}
                        rx="5"
                        fill="url(#emeraldBarGrad)"
                        className={`transition-all duration-300 ${
                          isHovered ? 'filter drop-shadow-md brightness-115 scale-y-102' : ''
                        }`}
                      />

                      {/* X-Axis Label */}
                      <text
                        x={centerX}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className={`text-[10px] font-mono transition-colors ${
                          isHovered ? 'fill-amber-500 font-black' : 'fill-slate-400 font-bold'
                        }`}
                      >
                        {pt.shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Glassmorphism Tooltip for Bar Chart */}
            {hoveredPointIndex !== null && timePoints[hoveredPointIndex] && (
              <div
                className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md text-white shadow-2xl border border-amber-500/30 text-xs space-y-1 transform -translate-x-1/2 -translate-y-full transition-all duration-150 animate-scale-in"
                style={{
                  left: `${((paddingX + hoveredPointIndex * (plotWidth / timePoints.length) + (plotWidth / timePoints.length) / 2) / svgWidth) * 100}%`,
                  top: '22%'
                }}
              >
                <div className="font-extrabold text-amber-400 flex items-center gap-1.5 border-b border-slate-700/80 pb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{timePoints[hoveredPointIndex].label}</span>
                </div>
                <div className="flex justify-between gap-4 pt-0.5">
                  <span className="text-slate-400">Net Sales:</span>
                  <span className="font-black text-amber-400 text-sm font-mono">
                    {formatINR(timePoints[hoveredPointIndex].revenue)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Order Volume:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {timePoints[hoveredPointIndex].ordersCount} orders
                  </span>
                </div>
                {timePoints[hoveredPointIndex].ordersCount > 0 && (
                  <div className="flex justify-between gap-4 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
                    <span>Average Value:</span>
                    <span className="font-mono text-slate-200">
                      {formatINR(Math.round(timePoints[hoveredPointIndex].revenue / timePoints[hoveredPointIndex].ordersCount))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bar Chart Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shadow-xs" />
                <span>Net Sales Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-xs" />
                <span>Orders Volume</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. VIEW C: Donut Distribution Chart (100% Seamless Complete 360-degree Circle) */}
        {chartType === 'donut' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
            {/* SVG Donut Circle with Perfect Chained Slices and Interactive Center */}
            <div className="flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 240 240" className="w-60 h-60 select-none">
                {/* Background Track Circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="78"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-slate-100 dark:text-slate-800/80"
                />

                {/* Slices rendering with mathematically exact SVG geometry & vivid colors */}
                {categoryStats.map((cat, idx) => {
                  let accumulatedRatio = 0;
                  for (let i = 0; i < idx; i++) {
                    accumulatedRatio += categoryStats[i].ratio;
                  }

                  const radius = 78;
                  const isHovered = hoveredDonutSlice === idx;

                  // If single category exists or this category is 100%, render a complete circle
                  if (categoryStats.length === 1 || cat.ratio >= 0.999) {
                    return (
                      <circle
                        key={idx}
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="none"
                        stroke={cat.color}
                        strokeWidth={isHovered ? 26 : 20}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          transformOrigin: '120px 120px',
                          animation: 'donutSlicePop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both'
                        }}
                        onMouseEnter={() => setHoveredDonutSlice(idx)}
                        onMouseLeave={() => setHoveredDonutSlice(null)}
                      />
                    );
                  }

                  const startAngle = accumulatedRatio * 360;
                  const endAngle = (accumulatedRatio + cat.ratio) * 360;
                  // Subtle separation gap for multi-slice donut
                  const gap = 2;
                  const actualStart = startAngle + gap / 2;
                  const actualEnd = Math.max(actualStart + 0.1, endAngle - gap / 2);

                  return (
                    <path
                      key={idx}
                      d={getDonutArc(120, 120, radius, actualStart, actualEnd)}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth={isHovered ? 26 : 20}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        transformOrigin: '120px 120px',
                        animation: `donutSlicePop 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s both`
                      }}
                      onMouseEnter={() => setHoveredDonutSlice(idx)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                    />
                  );
                })}
              </svg>

              {/* Dynamic Interactive Center in Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredDonutSlice !== null && categoryStats[hoveredDonutSlice] ? (
                  <div className="space-y-0.5 animate-scale-in">
                    <span
                      className="text-[11px] font-black uppercase tracking-wider block truncate max-w-[120px]"
                      style={{ color: categoryStats[hoveredDonutSlice].color }}
                    >
                      {categoryStats[hoveredDonutSlice].name}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono block">
                      {formatINR(categoryStats[hoveredDonutSlice].revenue)}
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-500 font-mono block">
                      {categoryStats[hoveredDonutSlice].percentage}% of total
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Total Sales
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono block">
                      {formatINR(totalRevenue)}
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                      {period.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown Interactive Legend Table */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Revenue Contribution by Category
              </h4>
              {categoryStats.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No order items recorded in this period.</p>
              ) : (
                categoryStats.map((cat, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDonutSlice(idx)}
                    onMouseLeave={() => setHoveredDonutSlice(null)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      hoveredDonutSlice === idx
                        ? 'border-amber-500 bg-amber-500/10 scale-102 shadow-lg -translate-x-1'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shadow-xs transition-transform"
                        style={{
                          backgroundColor: cat.color,
                          transform: hoveredDonutSlice === idx ? 'scale(1.25)' : 'scale(1)'
                        }}
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cat.units} units ordered
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block">
                        {formatINR(cat.revenue)}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-500 font-mono">
                        {cat.percentage}% share
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Top Performing Handcrafted Products in Current Time Window */}
      <Card glass className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Top Revenue Generating Products</span>
            </h3>
            <p className="text-xs text-slate-400">Most ordered handcrafted diyas and festive brass sets during this period.</p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No product orders recorded for this period.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 text-xs sm:text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-black text-amber-500 text-sm w-5">{idx + 1}.</span>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</h5>
                    <span className="text-slate-400 text-[11px]">{p.units} units ordered</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-slate-100 font-mono block sm:text-base">
                    {formatINR(p.revenue)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">Active sales</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
        </>
      ) : (
        /* ========================================================================= */
        /* PROFITABILITY & NET MARGINS ANALYTICS VIEW                                */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          {/* Header with Back Button, Period Selector & Profitability Excel Export */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setViewMode('overview');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white font-bold text-xs transition-all shadow-xs group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Overview</span>
                </button>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Profitability & Margins Analytics
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 pl-1">
                Executive intelligence analyzing acquisition costs, realized margins, and net profits across {periodLabelText}.
              </p>
            </div>

            {/* Actions: Period Selector + Profitability Excel Export */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Period Selector Pills */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                {(['today', 'week', 'month', 'year', 'all', 'custom'] as TimePeriod[]).map((pKey) => {
                  const active = period === pKey;
                  const labels: Record<TimePeriod, string> = {
                    today: 'Today',
                    week: 'This Week',
                    month: 'This Month',
                    year: 'This Year',
                    all: 'All Time',
                    custom: 'Custom'
                  };
                  return (
                    <button
                      key={pKey}
                      onClick={() => setPeriod(pKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        active
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-102'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {labels[pKey]}
                    </button>
                  );
                })}
              </div>

              {/* Profitability Excel Report Button */}
              <Button
                onClick={() => revenueExportService.exportProfitabilityReport(activeOrders, products, periodLabelText)}
                variant="primary"
                size="md"
                className="font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white border-none"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Profitability Excel</span>
              </Button>
            </div>
          </div>

          {/* Custom Date Range Panel (if custom) */}
          {period === 'custom' && (
            <Card glass className="p-4 border-emerald-500/30 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Custom Profitability Date Range
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-slate-400 font-bold self-end pb-2">➔</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 5 Executive Financial & Profitability KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Gross Revenue */}
            <Card
              glass
              className="group relative overflow-hidden p-4 space-y-2 border-amber-300/60 dark:border-amber-900/60 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/15"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-500 transition-colors">
                  Gross Revenue
                </span>
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block group-hover:text-amber-500 transition-colors">
                  {formatINR(totalRevenue)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {totalUnitsSold} units sold
                </span>
              </div>
            </Card>

            {/* Total Cost Spent */}
            <Card
              glass
              className="group relative overflow-hidden p-4 space-y-2 border-rose-300/60 dark:border-rose-900/60 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/15"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-500 transition-colors">
                  Actual Cost Spent
                </span>
                <div className="p-2 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 block">
                  {formatINR(totalCost)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {totalRevenue > 0 ? `${((totalCost / totalRevenue) * 100).toFixed(1)}%` : '0%'} of revenue
                </span>
              </div>
            </Card>

            {/* Net Realized Profit */}
            <Card
              glass
              className="group relative overflow-hidden p-4 space-y-2 border-emerald-400/80 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/25 ring-2 ring-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Net Profits Earned
                </span>
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                  {formatINR(totalProfit)}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Gross Rev − Actual Spend</span>
                </span>
              </div>
            </Card>

            {/* Net Margin % */}
            <Card
              glass
              className="group relative overflow-hidden p-4 space-y-2 border-blue-300/60 dark:border-blue-900/60 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/15"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors">
                  Net Margin %
                </span>
                <div className="p-2 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 block">
                  {overallMarginPct}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Realized margin on sales
                </span>
              </div>
            </Card>

            {/* Return on Product Spend (ROI) */}
            <Card
              glass
              className="group relative overflow-hidden p-4 space-y-2 border-purple-300/60 dark:border-purple-900/60 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/15"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-purple-500 transition-colors">
                  Spend ROI
                </span>
                <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 block">
                  {overallRoiPct}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Profit per ₹100 spend
                </span>
              </div>
            </Card>
          </div>

          {/* Actual Cost Audit Tip */}
          {productProfitStats.some(p => !p.hasActualCost) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200 animate-fade-in">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice on Cost Calculation:</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Some products sold in this period do not have an <strong>Actual Cost</strong> specified by the admin. For those items, acquisition cost is tracked at ₹0. To maintain 100% precision in profit margins, set the <strong>Actual Cost (₹)</strong> field when editing products in the Products tab.
                </p>
              </div>
            </div>
          )}

          {/* Animated Profitability Diagrams Section */}
          <Card glass className="p-4 sm:p-6 space-y-6">
            {/* Diagram Type Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span>
                    {profitChartType === 'trend'
                      ? 'Financial Trends (Revenue vs Cost vs Profit)'
                      : 'Category Net Profit Contribution'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {profitChartType === 'trend'
                    ? 'Interactive timeline comparing Gross Revenue, Actual Spend, and Realized Profits with smooth vector animations.'
                    : 'Visual breakdown showing how each handcrafted category contributes to your bottom-line profits.'}
                </p>
              </div>

              {/* Chart Switcher Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setProfitChartType('trend')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    profitChartType === 'trend'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Financial Trends</span>
                </button>
                <button
                  onClick={() => setProfitChartType('category')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    profitChartType === 'category'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Category Profit</span>
                </button>
              </div>
            </div>

            {/* View 1: Multi-Metric Trend Chart */}
            {profitChartType === 'trend' && (
              <div className="space-y-4">
                {/* Visual Legend */}
                <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                    <span className="text-slate-600 dark:text-slate-300">Gross Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                    <span className="text-slate-600 dark:text-slate-300">Actual Cost Spent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-500/30" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">Net Realized Profit</span>
                  </div>
                </div>

                {/* SVG Line / Area Graph */}
                <div className="relative w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto min-w-[620px] overflow-visible"
                  >
                    <defs>
                      <linearGradient id="profitNetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="profitRevGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                      <linearGradient id="profitCostGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#E11D48" />
                      </linearGradient>
                      <linearGradient id="profitNetGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines & Y-Axis Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const yPos = svgHeight - paddingY - pct * plotHeight;
                      const val = Math.round(pct * maxProfitTrendVal);
                      return (
                        <g key={idx}>
                          <line
                            x1={paddingX}
                            y1={yPos}
                            x2={svgWidth - paddingX}
                            y2={yPos}
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="1"
                            strokeDasharray={idx === 0 ? '0' : '4 4'}
                          />
                          <text
                            x={paddingX - 10}
                            y={yPos + 3}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="bold"
                            className="fill-slate-400 font-mono"
                          >
                            ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Profit Area Fill */}
                    {profitNetAreaD && (
                      <path
                        d={profitNetAreaD}
                        fill="url(#profitNetAreaGrad)"
                        style={{
                          animation: 'chartAreaFadeIn 1.2s ease-out forwards'
                        }}
                      />
                    )}

                    {/* Revenue Line */}
                    {profitRevPathD && (
                      <path
                        d={profitRevPathD}
                        fill="none"
                        stroke="url(#profitRevGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2400"
                        strokeDashoffset="2400"
                        style={{
                          animation: 'chartLineDraw 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                      />
                    )}

                    {/* Cost Line */}
                    {profitCostPathD && (
                      <path
                        d={profitCostPathD}
                        fill="none"
                        stroke="url(#profitCostGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2400"
                        strokeDashoffset="2400"
                        style={{
                          animation: 'chartLineDraw 1.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                      />
                    )}

                    {/* Net Profit Line */}
                    {profitNetPathD && (
                      <path
                        d={profitNetPathD}
                        fill="none"
                        stroke="url(#profitNetGrad)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2400"
                        strokeDashoffset="2400"
                        style={{
                          animation: 'chartLineDraw 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.35))'
                        }}
                      />
                    )}

                    {/* Vertical Guideline on Hover */}
                    {hoveredProfitPointIndex !== null && profitSvgCoords[hoveredProfitPointIndex] && (
                      <g>
                        <line
                          x1={profitSvgCoords[hoveredProfitPointIndex].x}
                          y1={paddingY}
                          x2={profitSvgCoords[hoveredProfitPointIndex].x}
                          y2={svgHeight - paddingY}
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        {/* Dot on Revenue */}
                        <circle
                          cx={profitSvgCoords[hoveredProfitPointIndex].x}
                          cy={profitSvgCoords[hoveredProfitPointIndex].yRev}
                          r="5"
                          fill="#F59E0B"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* Dot on Cost */}
                        <circle
                          cx={profitSvgCoords[hoveredProfitPointIndex].x}
                          cy={profitSvgCoords[hoveredProfitPointIndex].yCost}
                          r="5"
                          fill="#F43F5E"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* Dot on Profit */}
                        <circle
                          cx={profitSvgCoords[hoveredProfitPointIndex].x}
                          cy={profitSvgCoords[hoveredProfitPointIndex].yProfit}
                          r="6.5"
                          fill="#10B981"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                      </g>
                    )}

                    {/* Interactive Vertical Hover Slices */}
                    {profitSvgCoords.map((coord, idx) => {
                      const sliceW = plotWidth / Math.max(profitSvgCoords.length, 1);
                      const xStart = coord.x - sliceW / 2;
                      return (
                        <g key={idx}>
                          <rect
                            x={xStart}
                            y={paddingY}
                            width={sliceW}
                            height={plotHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredProfitPointIndex(idx)}
                            onMouseLeave={() => setHoveredProfitPointIndex(null)}
                          />
                          {/* X-Axis Interval Label */}
                          <text
                            x={coord.x}
                            y={svgHeight - paddingY + 22}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            className="fill-slate-500 font-sans"
                          >
                            {coord.pt.shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating Interactive Tooltip */}
                  {hoveredProfitPointIndex !== null && timePoints[hoveredProfitPointIndex] && (
                    <div
                      className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2"
                      style={{
                        left: `${((profitSvgCoords[hoveredProfitPointIndex]?.x || 0) / svgWidth) * 100}%`,
                        top: '12px'
                      }}
                    >
                      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700/60 min-w-[200px] space-y-1 text-xs">
                        <div className="text-[11px] font-black text-slate-300 border-b border-slate-800 pb-1">
                          {timePoints[hoveredProfitPointIndex].label}
                        </div>
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span>Revenue:</span>
                          <span className="font-mono">{formatINR(timePoints[hoveredProfitPointIndex].revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-400 font-bold">
                          <span>Cost Spent:</span>
                          <span className="font-mono">{formatINR(timePoints[hoveredProfitPointIndex].cost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400 font-black pt-1 border-t border-slate-800">
                          <span>Net Profit:</span>
                          <span className="font-mono">{formatINR(timePoints[hoveredProfitPointIndex].profit)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right pt-0.5">
                          Margin:{' '}
                          <span className="text-emerald-400 font-black">
                            {timePoints[hoveredProfitPointIndex].revenue > 0
                              ? `${Math.round((timePoints[hoveredProfitPointIndex].profit / timePoints[hoveredProfitPointIndex].revenue) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Category Profit Contribution Donut */}
            {profitChartType === 'category' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
                {/* SVG Donut Centerpiece */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                    <svg viewBox="0 0 280 280" className="w-full h-full transform -rotate-90 overflow-visible">
                      {(() => {
                        let cumDeg = 0;
                        return categoryProfitStats.map((cat, idx) => {
                          const startDeg = cumDeg;
                          const sliceDeg = cat.ratio * 360;
                          cumDeg += sliceDeg;
                          const endDeg = Math.min(cumDeg, 359.99);
                          const isHovered = hoveredProfitDonutSlice === idx;
                          const arcPath = getDonutArc(140, 140, isHovered ? 98 : 92, startDeg, endDeg);

                          return (
                            <path
                              key={idx}
                              d={arcPath}
                              fill="none"
                              stroke={cat.color}
                              strokeWidth={isHovered ? 38 : 30}
                              strokeLinecap="round"
                              className="cursor-pointer transition-all duration-300"
                              onMouseEnter={() => setHoveredProfitDonutSlice(idx)}
                              onMouseLeave={() => setHoveredProfitDonutSlice(null)}
                              style={{
                                transformOrigin: '140px 140px',
                                animation: 'donutSlicePop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Center KPI Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                      {hoveredProfitDonutSlice !== null && categoryProfitStats[hoveredProfitDonutSlice] ? (
                        <div className="space-y-0.5 animate-scale-in">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate max-w-[140px]">
                            {categoryProfitStats[hoveredProfitDonutSlice].name}
                          </span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                            {formatINR(categoryProfitStats[hoveredProfitDonutSlice].profit)}
                          </span>
                          <span className="text-xs font-black text-amber-500">
                            {categoryProfitStats[hoveredProfitDonutSlice].percentage}% profit share
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5 animate-fade-in">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Total Net Profit
                          </span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                            {formatINR(totalProfit)}
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">
                            {overallMarginPct}% NET MARGIN
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Profit Breakdown Legend Cards */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Net Profit Realized by Category
                  </h4>
                  {categoryProfitStats.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No order items recorded in this period.</p>
                  ) : (
                    categoryProfitStats.map((cat, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredProfitDonutSlice(idx)}
                        onMouseLeave={() => setHoveredProfitDonutSlice(null)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          hoveredProfitDonutSlice === idx
                            ? 'border-emerald-500 bg-emerald-500/10 scale-102 shadow-lg -translate-x-1'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full shadow-xs transition-transform"
                            style={{
                              backgroundColor: cat.color,
                              transform: hoveredProfitDonutSlice === idx ? 'scale(1.25)' : 'scale(1)'
                            }}
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cat.units} units • Cost: {formatINR(cat.cost)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                            {formatINR(cat.profit)}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                            {cat.marginPct}% margin • {cat.percentage}% share
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Product-Level Profitability Breakdown Table */}
          <Card glass className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" />
                  <span>Product Profit Margins & Cost Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Granular unit economics for each product: acquisition cost, store selling price, revenue, and realized profit.
                </p>
              </div>

              {/* Counter Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {filteredProductProfitStats.length} Products Sold
                </span>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {/* Category Filter Dropdown */}
              <div className="relative min-w-[180px]">
                <select
                  value={profitCategoryFilter}
                  onChange={(e) => setProfitCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Categories ({availableCategories.length})</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Search by Product Name */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={profitSearchQuery}
                  onChange={(e) => setProfitSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Sort Order Selector */}
              <div className="relative min-w-[200px]">
                <select
                  value={profitSortBy}
                  onChange={(e) => setProfitSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="profit">Sort by: Highest Net Profit</option>
                  <option value="revenue">Sort by: Highest Revenue</option>
                  <option value="cost">Sort by: Highest Spend</option>
                  <option value="margin">Sort by: Highest Margin %</option>
                  <option value="units">Sort by: Most Units Sold</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            {filteredProductProfitStats.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold">No product sales match your search or category filter in this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Product Name & Category</th>
                      <th className="py-3 px-3 text-center">Units Sold</th>
                      <th className="py-3 px-3 text-right">Selling vs Cost Price</th>
                      <th className="py-3 px-3 text-right">Actual Cost Spent</th>
                      <th className="py-3 px-3 text-right">Gross Revenue</th>
                      <th className="py-3 px-3 text-right">Net Profit</th>
                      <th className="py-3 px-3 text-center">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredProductProfitStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Product Image & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[220px]">
                                {item.name}
                              </span>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.categoryName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Units Sold */}
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {item.unitsSold}
                        </td>

                        {/* Store Selling Price vs Actual Cost */}
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatINR(item.sellingPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: {item.hasActualCost ? formatINR(item.actualCost) : '₹0 (Not set)'}
                          </div>
                        </td>

                        {/* Actual Cost Spent */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatINR(item.cost)}
                        </td>

                        {/* Gross Revenue */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatINR(item.revenue)}
                        </td>

                        {/* Net Profit */}
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {formatINR(item.profit)}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                              item.marginPct >= 35
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : item.marginPct >= 20
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                : item.marginPct >= 10
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.marginPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
export default AdminRevenue;
