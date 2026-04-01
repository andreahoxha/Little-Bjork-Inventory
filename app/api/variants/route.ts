import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { productId, size, color, sku, quantity, lowStockThreshold } = body;

    if (!productId || !size || !color || !sku) {
      return Response.json(
        { error: "productId, size, color, and sku are required" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size,
        color,
        sku,
        quantity: parseInt(quantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 5,
      },
    });

    // Create initial restock movement if quantity > 0
    if (variant.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId,
          variantId: variant.id,
          userId: user.userId,
          type: "restock",
          quantityChanged: variant.quantity,
          previousQuantity: 0,
          newQuantity: variant.quantity,
          note: "Initial stock",
        },
      });
    }

    return Response.json({ variant }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return Response.json({ error: "SKU already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
