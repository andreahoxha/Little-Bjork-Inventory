import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json({ categories });
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
    const { name } = body;
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    const category = await prisma.category.create({ data: { name } });
    return Response.json({ category }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return Response.json({ error: "Category already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
