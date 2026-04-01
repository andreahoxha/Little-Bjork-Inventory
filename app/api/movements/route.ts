import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";
    const variantId = searchParams.get("variantId") || "";
    const type = searchParams.get("type") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...(productId && { productId }),
        ...(variantId && { variantId }),
        ...(type && { type }),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        variant: { select: { size: true, color: true, sku: true } },
        user: { select: { name: true } },
      },
    });

    return Response.json({ movements });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
