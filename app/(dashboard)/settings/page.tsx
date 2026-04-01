"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { addToast } = useToast();
  const [lowStockDefault, setLowStockDefault] = useState("5");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  async function onPasswordSubmit(data: PasswordFormData) {
    // In a real app: call an API to change password
    await new Promise((r) => setTimeout(r, 800));
    addToast("Password change feature requires additional implementation", "info");
    reset();
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your store preferences</p>
      </div>

      <div className="space-y-6">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store Information</CardTitle>
            <CardDescription>Basic details about your brand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Brand Name
              </label>
              <Input defaultValue="Little Bjork" disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400 mt-1">Contact support to change the brand name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                defaultValue="Premium baby & kids clothing for the modern family"
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Preferences</CardTitle>
            <CardDescription>Configure default inventory settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Default Low Stock Threshold
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min="1"
                  value={lowStockDefault}
                  onChange={(e) => setLowStockDefault(e.target.value)}
                  className="w-28"
                />
                <Button
                  onClick={() => addToast(`Default threshold set to ${lowStockDefault}`, "success")}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                New variants will default to this threshold value
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Current Password
                </label>
                <Input type="password" {...register("currentPassword")} />
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <Input type="password" {...register("newPassword")} />
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <Input type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Seed Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer Tools</CardTitle>
            <CardDescription>For development and testing only</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/api/seed">
              <Button variant="outline" type="button">
                Seed Sample Data
              </Button>
            </a>
            <p className="text-xs text-slate-400 mt-2">
              ⚠️ This will reset and re-seed the database with sample products and an admin user
              (admin@littlebjork.com / admin123)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
