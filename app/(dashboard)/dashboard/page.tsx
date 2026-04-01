import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency, getStockStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ArrowDown,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const [totalProducts, variants, recentMovements] = await Promise.all([
    prisma.product.count({ where: { status: "active" } }),
    prisma.productVariant.findMany({
      select: { quantity: true, lowStockThreshold: true },
    }),
    prisma.inventoryMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        variant: { select: { size: true, color: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const totalStock = variants.reduce((sum, v) => sum + v.quantity, 0);
  const lowStockItems = variants.filter(
    (v) => v.quantity > 0 && v.quantity <= v.lowStockThreshold
  ).length;
  const outOfStockItems = variants.filter((v) => v.quantity === 0).length;

  return { totalProducts, totalStock, lowStockItems, outOfStockItems, recentMovements };
}

function MovementTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: "default" | "destructive" | "warning" | "secondary" }> = {
    sale: { label: "Sale", variant: "destructive" },
    restock: { label: "Restock", variant: "default" },
    damage: { label: "Damage", variant: "warning" },
    loss: { label: "Loss", variant: "warning" },
    return: { label: "Return", variant: "secondary" },
    correction: { label: "Correction", variant: "secondary" },
  };
  const cfg = map[type] ?? { label: type, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default async function DashboardPage() {
  const user = await getUser();
  const data = await getDashboardData();

  const stats = [
    {
      title: "Total Products",
      value: data.totalProducts,
      description: "Active products in catalog",
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Stock",
      value: data.totalStock,
      description: "Units across all variants",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Low Stock",
      value: data.lowStockItems,
      description: "Variants below threshold",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Out of Stock",
      value: data.outOfStockItems,
      description: "Variants with zero quantity",
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Here&apos;s what&apos;s happening with your inventory today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/products/new"
          className="flex items-center gap-3 p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Package className="h-5 w-5" />
          <span className="font-medium">Add New Product</span>
        </Link>
        <Link
          href="/low-stock"
          className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">View Low Stock Items</span>
        </Link>
        <Link
          href="/reports"
          className="flex items-center gap-3 p-4 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">View Reports</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link
              href="/history"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentMovements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No inventory movements yet.</p>
              <p className="text-xs mt-1">
                <Link href="/api/seed" className="text-emerald-600 hover:underline">
                  Seed sample data
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Product
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Variant
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Qty
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        {m.product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {m.variant.size} / {m.variant.color}
                      </td>
                      <td className="px-4 py-3">
                        <MovementTypeBadge type={m.type} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1 text-sm font-medium ${
                            m.quantityChanged > 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {m.quantityChanged > 0 ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                          {Math.abs(m.quantityChanged)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(m.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
