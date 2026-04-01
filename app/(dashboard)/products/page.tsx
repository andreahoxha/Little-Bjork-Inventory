"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import {
  Plus,
  Search,
  ShoppingCart,
  PackagePlus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

interface Variant {
  id: string;
  size: string;
  color: string;
  quantity: number;
  lowStockThreshold: number;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  baseSku: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  category: Category | null;
  variants: Variant[];
}

function StockBadge({ product }: { product: Product }) {
  const totalQty = product.variants.reduce((s, v) => s + v.quantity, 0);
  const minThreshold = Math.min(...product.variants.map((v) => v.lowStockThreshold), 5);
  const status = product.variants.length === 0
    ? "out-of-stock"
    : getStockStatus(totalQty, minThreshold * product.variants.length);

  const map = {
    "in-stock": { label: "In Stock", variant: "default" as const },
    "low-stock": { label: "Low Stock", variant: "warning" as const },
    "out-of-stock": { label: "Out of Stock", variant: "destructive" as const },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function ProductsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sellModal, setSellModal] = useState<{ product: Product | null; open: boolean }>({ product: null, open: false });
  const [restockModal, setRestockModal] = useState<{ product: Product | null; open: boolean }>({ product: null, open: false });
  const [deleteModal, setDeleteModal] = useState<{ product: Product | null; open: boolean }>({ product: null, open: false });

  const [sellVariantId, setSellVariantId] = useState("");
  const [sellQty, setSellQty] = useState("1");
  const [sellNote, setSellNote] = useState("");
  const [restockVariantId, setRestockVariantId] = useState("");
  const [restockQty, setRestockQty] = useState("1");
  const [restockNote, setRestockNote] = useState("");

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
  });

  const products: Product[] = data?.products ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast("Product deleted successfully", "success");
      setDeleteModal({ product: null, open: false });
    },
    onError: () => addToast("Failed to delete product", "error"),
  });

  const sellMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/variants/${sellVariantId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(sellQty), note: sellNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sell failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast("Sale recorded successfully", "success");
      setSellModal({ product: null, open: false });
      setSellQty("1");
      setSellNote("");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const restockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/variants/${restockVariantId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(restockQty), note: restockNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Restock failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast("Restock completed successfully", "success");
      setRestockModal({ product: null, open: false });
      setRestockQty("1");
      setRestockNote("");
    },
    onError: (err: Error) => addToast(err.message, "error"),
  });

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-xs text-slate-400">{row.original.baseSku}</p>
            {row.original.category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {row.original.category.name}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "variants",
        header: "Variants",
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.variants.length}
          </span>
        ),
      },
      {
        id: "totalStock",
        header: "Total Stock",
        cell: ({ row }) => {
          const total = row.original.variants.reduce((s, v) => s + v.quantity, 0);
          return <span className="text-sm font-medium text-slate-900">{total}</span>;
        },
      },
      {
        accessorKey: "sellingPrice",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatCurrency(row.original.sellingPrice)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StockBadge product={row.original} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSellModal({ product: row.original, open: true });
                setSellVariantId(row.original.variants[0]?.id ?? "");
              }}
              title="Sell"
            >
              <ShoppingCart size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRestockModal({ product: row.original, open: true });
                setRestockVariantId(row.original.variants[0]?.id ?? "");
              }}
              title="Restock"
            >
              <PackagePlus size={14} />
            </Button>
            <Link href={`/products/${row.original.id}/edit`}>
              <Button variant="ghost" size="sm" title="Edit">
                <Pencil size={14} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => setDeleteModal({ product: row.original, open: true })}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your product catalog and inventory
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus size={16} />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <Input
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-36"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">
              <Link href="/products/new" className="text-emerald-600 hover:underline">
                Add your first product
              </Link>
              {" or "}
              <a href="/api/seed" className="text-emerald-600 hover:underline">
                seed sample data
              </a>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 first:pl-6"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sell Modal */}
      <Dialog open={sellModal.open} onClose={() => setSellModal({ product: null, open: false })}>
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {sellModal.product && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{sellModal.product.name}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Variant
                </label>
                <Select
                  value={sellVariantId}
                  onChange={(e) => setSellVariantId(e.target.value)}
                  className="w-full"
                >
                  {sellModal.product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} — Stock: {v.quantity}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  value={sellQty}
                  onChange={(e) => setSellQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Note (optional)
                </label>
                <Input
                  value={sellNote}
                  onChange={(e) => setSellNote(e.target.value)}
                  placeholder="e.g. In-store sale"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSellModal({ product: null, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => sellMutation.mutate()}
            disabled={sellMutation.isPending || !sellVariantId}
          >
            {sellMutation.isPending ? "Saving…" : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Restock Modal */}
      <Dialog open={restockModal.open} onClose={() => setRestockModal({ product: null, open: false })}>
        <DialogHeader>
          <DialogTitle>Restock Inventory</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {restockModal.product && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{restockModal.product.name}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Variant
                </label>
                <Select
                  value={restockVariantId}
                  onChange={(e) => setRestockVariantId(e.target.value)}
                  className="w-full"
                >
                  {restockModal.product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} — Stock: {v.quantity}
                    </option>
                  ))}
                </Select>
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
                  placeholder="e.g. New shipment from supplier"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRestockModal({ product: null, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => restockMutation.mutate()}
            disabled={restockMutation.isPending || !restockVariantId}
          >
            {restockMutation.isPending ? "Saving…" : "Confirm Restock"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModal.open} onClose={() => setDeleteModal({ product: null, open: false })}>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <strong className="text-slate-900">{deleteModal.product?.name}</strong>?
            This will also delete all variants and inventory history.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteModal({ product: null, open: false })}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteModal.product && deleteMutation.mutate(deleteModal.product.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
