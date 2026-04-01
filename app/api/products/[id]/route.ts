import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
      },
    });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json({ product });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const {
      name,
      categoryId,
      description,
      brand,
      gender,
      season,
      baseSku,
      barcode,
      costPrice,
      sellingPrice,
      status,
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        categoryId: categoryId || null,
        description: description || null,
        brand: brand || "Little Bjork",
        gender: gender || null,
        season: season || null,
        baseSku,
        barcode: barcode || null,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        status: status || "active",
      },
      include: { category: true, variants: true },
    });

    return Response.json({ product });
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
    // Delete movements first (no cascade on product for movements)
    await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
