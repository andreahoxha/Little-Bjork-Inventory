import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const quantity = parseInt(body.quantity);
    const type = body.type as string;
    const note = body.note || "";

    const validTypes = ["damage", "loss", "return", "correction"];
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: "Type must be one of: damage, loss, return, correction" },
        { status: 400 }
      );
    }

    if (isNaN(quantity) || quantity === 0) {
      return Response.json(
        { error: "Quantity must be a non-zero number" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      return Response.json({ error: "Variant not found" }, { status: 404 });
    }

    const newQuantity = variant.quantity + quantity;
    if (newQuantity < 0) {
      return Response.json(
        { error: `Adjustment would result in negative stock. Available: ${variant.quantity}` },
        { status: 400 }
      );
    }

    const [updatedVariant] = await prisma.$transaction([
      prisma.productVariant.update({
        where: { id },
        data: { quantity: newQuantity },
      }),
      prisma.inventoryMovement.create({
        data: {
          productId: variant.productId,
          variantId: id,
          userId: user.userId,
          type,
          quantityChanged: quantity,
          previousQuantity: variant.quantity,
          newQuantity,
          note: note || null,
        },
      }),
    ]);

    return Response.json({ variant: updatedVariant });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
