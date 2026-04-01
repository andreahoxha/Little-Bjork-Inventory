"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const productSchema = z.object({
  name: z.string().min(1, "Name required"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  gender: z.string().optional(),
  season: z.string().optional(),
  baseSku: z.string().min(1, "Base SKU required"),
  barcode: z.string().optional(),
  costPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  status: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });
  const categories = categoriesData?.categories ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      reset({
        name: p.name,
        categoryId: p.categoryId ?? "",
        description: p.description ?? "",
        brand: p.brand,
        gender: p.gender ?? "",
        season: p.season ?? "",
        baseSku: p.baseSku,
        barcode: p.barcode ?? "",
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        status: p.status,
      });
    }
  }, [data, reset]);

  async function onSubmit(formData: ProductFormData) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          costPrice: parseFloat(formData.costPrice || "0"),
          sellingPrice: parseFloat(formData.sellingPrice || "0"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast("Product updated successfully", "success");
      router.push("/products");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/products"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Update product information. To manage variants, use the products list.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Product Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Product Name *
              </label>
              <Input {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Base SKU *</label>
              <Input {...register("baseSku")} />
              {errors.baseSku && <p className="mt-1 text-xs text-red-600">{errors.baseSku.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <Select {...register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand</label>
              <Input {...register("brand")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Barcode</label>
              <Input {...register("barcode")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
              <Select {...register("gender")}>
                <option value="">Select gender</option>
                <option value="unisex">Unisex</option>
                <option value="girl">Girl</option>
                <option value="boy">Boy</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Season</label>
              <Select {...register("season")}>
                <option value="">Select season</option>
                <option value="all-season">All Season</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cost Price (€)</label>
              <Input type="number" step="0.01" min="0" {...register("costPrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price (€)</label>
              <Input type="number" step="0.01" min="0" {...register("sellingPrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <Select {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/products">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
