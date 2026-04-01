import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const products = await prisma.product.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search } },
            { baseSku: { contains: search } },
          ],
        }),
        ...(category && { categoryId: category }),
        ...(status && { status }),
      },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ products });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

    if (!name || !baseSku) {
      return Response.json(
        { error: "Name and SKU are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
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

    return Response.json({ product }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint")
    ) {
      return Response.json({ error: "SKU already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
