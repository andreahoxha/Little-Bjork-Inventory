import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [
      totalProducts,
      variants,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "active" } }),
      prisma.productVariant.findMany({ select: { quantity: true, lowStockThreshold: true } }),
      prisma.inventoryMovement.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true } },
          variant: { select: { size: true, color: true, sku: true } },
          user: { select: { name: true } },
        },
      }),
    ]);

    const totalStock = variants.reduce((sum, v) => sum + v.quantity, 0);
    const lowStockItems = variants.filter(
      (v) => v.quantity > 0 && v.quantity <= v.lowStockThreshold
    ).length;
    const outOfStockItems = variants.filter((v) => v.quantity === 0).length;

    return Response.json({
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      recentMovements,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
