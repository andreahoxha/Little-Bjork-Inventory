"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle, PackagePlus, Loader2 } from "lucide-react";

interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  product: { id: string; name: string; sellingPrice: number; category: { name: string } | null };
}

export default function LowStockPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [restockModal, setRestockModal] = useState<{ variant: Variant | null; open: boolean }>({
    variant: null,
    open: false,
  });
  const [restockQty, setRestockQty] = useState("5");
  const [restockNote, setRestockNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products-for-low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const restockMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const res = await fetch(`/api/variants/${variantId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(restockQty), note: restockNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Restock failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-for-low-stock"] });
      addToast("Restock completed", "success");
      setRestockModal({ variant: null, open: false });
      setRestockQty("5");
      setRestockNote("");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const products = data?.products ?? [];
  const lowStockVariants: Variant[] = [];

  for (const p of products) {
    for (const v of p.variants) {
      if (v.quantity <= v.lowStockThreshold) {
        lowStockVariants.push({
          ...v,
          product: {
            id: p.id,
            name: p.name,
            sellingPrice: p.sellingPrice,
            category: p.category,
          },
        });
      }
    }
  }

  const outOfStock = lowStockVariants.filter((v) => v.quantity === 0);
  const lowStock = lowStockVariants.filter((v) => v.quantity > 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Low Stock</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Items that need restocking
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700">Out of Stock</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{outOfStock.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-700">Low Stock</p>
          <p className="text-3xl font-bold text-amber-800 mt-1">{lowStock.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : lowStockVariants.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-emerald-400" />
          <p className="font-medium text-slate-600">All stock levels are healthy!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Product", "Variant", "Category", "Stock", "Threshold", "Status", "Action"].map((h) => (
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
                {[...outOfStock, ...lowStock].map((v) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      v.quantity === 0 ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {v.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {v.size} / {v.color}
                      <div className="text-xs text-slate-400">{v.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {v.product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-lg font-bold ${
                          v.quantity === 0 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {v.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{v.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      {v.quantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRestockModal({ variant: v, open: true });
                          setRestockQty("5");
                        }}
                      >
                        <PackagePlus size={13} />
                        Restock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={restockModal.open}
        onClose={() => setRestockModal({ variant: null, open: false })}
      >
        <DialogHeader>
          <DialogTitle>Quick Restock</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {restockModal.variant && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-slate-900">{restockModal.variant.product.name}</p>
                <p className="text-slate-500">
                  {restockModal.variant.size} / {restockModal.variant.color} — Current stock:{" "}
                  <strong>{restockModal.variant.quantity}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Quantity to Add
                </label>
                <Input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Note (optional)
                </label>
                <Input
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. New delivery"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setRestockModal({ variant: null, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              restockModal.variant && restockMutation.mutate(restockModal.variant.id)
            }
            disabled={restockMutation.isPending}
          >
            {restockMutation.isPending ? "Saving…" : "Confirm Restock"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
