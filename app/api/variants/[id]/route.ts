import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const { size, color, sku, lowStockThreshold } = body;

    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(size && { size }),
        ...(color && { color }),
        ...(sku && { sku }),
        ...(lowStockThreshold !== undefined && {
          lowStockThreshold: parseInt(lowStockThreshold),
        }),
      },
    });

    return Response.json({ variant });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.inventoryMovement.deleteMany({ where: { variantId: id } });
    await prisma.productVariant.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
