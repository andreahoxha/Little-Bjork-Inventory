"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Search, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

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

interface Movement {
  id: string;
  type: string;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string };
  variant: { size: string; color: string; sku: string };
  user: { name: string };
}

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["movements", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/movements?${params}`);
      return res.json();
    },
  });

  const allMovements: Movement[] = data?.movements ?? [];
  const movements = search
    ? allMovements.filter(
        (m) =>
          m.product.name.toLowerCase().includes(search.toLowerCase()) ||
          m.variant.sku.toLowerCase().includes(search.toLowerCase())
      )
    : allMovements;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory History</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Full log of all stock movements
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={15}
          />
          <Input
            placeholder="Search product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        >
          <option value="">All Types</option>
          <option value="sale">Sale</option>
          <option value="restock">Restock</option>
          <option value="damage">Damage</option>
          <option value="loss">Loss</option>
          <option value="return">Return</option>
          <option value="correction">Correction</option>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium">No movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Date", "Product", "Variant", "Type", "Qty Changed", "Before → After", "User", "Note"].map((h) => (
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
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                      {m.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      <div>{m.variant.size} / {m.variant.color}</div>
                      <div className="text-xs text-slate-400">{m.variant.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <MovementTypeBadge type={m.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          m.quantityChanged > 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {m.quantityChanged > 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        {Math.abs(m.quantityChanged)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {m.previousQuantity} → {m.newQuantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{m.user.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 max-w-[150px] truncate">
                      {m.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
