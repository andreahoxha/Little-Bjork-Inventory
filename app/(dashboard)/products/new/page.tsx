"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const variantSchema = z.object({
  size: z.string().min(1, "Size required"),
  color: z.string().min(1, "Color required"),
  sku: z.string().min(1, "SKU required"),
  quantity: z.string().optional(),
  lowStockThreshold: z.string().optional(),
});

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
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });
  const categories = categoriesData?.categories ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      brand: "Little Bjork",
      status: "active",
      costPrice: "0",
      sellingPrice: "0",
      variants: [{ size: "", color: "", sku: "", quantity: "0", lowStockThreshold: "5" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const baseSku = watch("baseSku");

  async function onSubmit(data: ProductFormData) {
    try {
      // Create product
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          categoryId: data.categoryId || null,
          description: data.description,
          brand: data.brand,
          gender: data.gender,
          season: data.season,
          baseSku: data.baseSku,
          barcode: data.barcode,
          costPrice: parseFloat(data.costPrice || "0"),
          sellingPrice: parseFloat(data.sellingPrice || "0"),
          status: data.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create product");

      const productId = json.product.id;

      // Create variants
      for (const v of data.variants) {
        const vRes = await fetch("/api/variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...v,
            productId,
            quantity: parseInt(v.quantity || "0"),
            lowStockThreshold: parseInt(v.lowStockThreshold || "5"),
          }),
        });
        const vJson = await vRes.json();
        if (!vRes.ok) throw new Error(vJson.error || "Failed to create variant");
      }

      addToast("Product created successfully", "success");
      router.push("/products");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  }

  function autoFillSku(index: number) {
    const v = watch(`variants.${index}`);
    if (baseSku && v.size && v.color) {
      const sku = `${baseSku}-${v.size}-${v.color}`.toUpperCase().replace(/\s/g, "-");
      setValue(`variants.${index}.sku`, sku);
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Fill in the product details and add variants
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Product Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Product Name *
              </label>
              <Input {...register("name")} placeholder="e.g. Organic Cotton Bodysuit" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Base SKU *
              </label>
              <Input {...register("baseSku")} placeholder="e.g. LB-BODY-001" />
              {errors.baseSku && <p className="mt-1 text-xs text-red-600">{errors.baseSku.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <Select {...register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Brand
              </label>
              <Input {...register("brand")} placeholder="Little Bjork" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Barcode
              </label>
              <Input {...register("barcode")} placeholder="EAN / UPC" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Gender
              </label>
              <Select {...register("gender")}>
                <option value="">Select gender</option>
                <option value="unisex">Unisex</option>
                <option value="girl">Girl</option>
                <option value="boy">Boy</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Season
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cost Price (€)
              </label>
              <Input type="number" step="0.01" min="0" {...register("costPrice")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Selling Price (€)
              </label>
              <Input type="number" step="0.01" min="0" {...register("sellingPrice")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <Select {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 resize-none"
                placeholder="Product description..."
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Variants</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ size: "", color: "", sku: "", quantity: "0", lowStockThreshold: "5" })
              }
            >
              <Plus size={14} />
              Add Variant
            </Button>
          </div>

          {errors.variants?.root && (
            <p className="text-xs text-red-600 mb-3">{errors.variants.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Size *</label>
                  <Input
                    {...register(`variants.${i}.size`)}
                    placeholder="e.g. 3-6M"
                    onBlur={() => autoFillSku(i)}
                  />
                  {errors.variants?.[i]?.size && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.variants[i]?.size?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Color *</label>
                  <Input
                    {...register(`variants.${i}.color`)}
                    placeholder="e.g. white"
                    onBlur={() => autoFillSku(i)}
                  />
                  {errors.variants?.[i]?.color && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.variants[i]?.color?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
                  <Input {...register(`variants.${i}.sku`)} placeholder="Auto-generated" />
                  {errors.variants?.[i]?.sku && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.variants[i]?.sku?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                  <Input type="number" min="0" {...register(`variants.${i}.quantity`)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Low Stock</label>
                  <Input type="number" min="1" {...register(`variants.${i}.lowStockThreshold`)} />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => fields.length > 1 && remove(i)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/products">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
