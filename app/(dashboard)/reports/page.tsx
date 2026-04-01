import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, TrendingDown } from "lucide-react";

async function getReportsData() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
    },
    orderBy: { name: "asc" },
  });

  const topMoved = await prisma.inventoryMovement.groupBy({
    by: ["productId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const topMovedWithProduct = topMoved.map((m) => ({
    product: productMap.get(m.productId),
    count: m._count.id,
  })).filter((m) => m.product);

  const totalValue = products.reduce((sum, p) => {
    const qty = p.variants.reduce((s, v) => s + v.quantity, 0);
    return sum + qty * p.costPrice;
  }, 0);

  const totalItems = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.quantity, 0),
    0
  );

  const outOfStockCount = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.quantity === 0).length,
    0
  );

  return { products, topMovedWithProduct, totalValue, totalItems, outOfStockCount };
}

export default async function ReportsPage() {
  const user = await getUser();
  const data = await getReportsData();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Inventory summary and analytics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Items</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalItems}</p>
                <p className="text-xs text-slate-400 mt-1">Units in stock</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inventory Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(data.totalValue)}
                </p>
                <p className="text-xs text-slate-400 mt-1">At cost price</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{data.outOfStockCount}</p>
                <p className="text-xs text-slate-400 mt-1">Variants with 0 qty</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Products Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    {["Product", "Variants", "Qty", "Value"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.products.map((p) => {
                    const totalQty = p.variants.reduce((s, v) => s + v.quantity, 0);
                    const value = totalQty * p.costPrice;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-slate-900">{p.name}</p>
                          {p.category && (
                            <Badge variant="outline" className="mt-0.5 text-xs">
                              {p.category.name}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {p.variants.length}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {totalQty}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Most Moved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Moved Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topMovedWithProduct.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No movement data yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                      {["Product", "Category", "Movements"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topMovedWithProduct.map((m, i) => (
                      <tr key={m.product!.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-4">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {m.product!.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {m.product!.category?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {m.count}
                          </span>
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
    </div>
  );
}
