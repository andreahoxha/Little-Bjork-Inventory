import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Clear existing data
    await prisma.inventoryMovement.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Seed admin user
    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@littlebjork.com",
        passwordHash,
        role: "admin",
      },
    });

    // Seed categories
    const categoryNames = [
      "Bodysuits",
      "Jackets",
      "Pajamas",
      "Dresses",
      "Shoes",
      "Sweaters",
      "Sets",
    ];
    const categories: Record<string, string> = {};
    for (const name of categoryNames) {
      const cat = await prisma.category.create({ data: { name } });
      categories[name] = cat.id;
    }

    // Products data
    const products = [
      {
        name: "Organic Cotton Bodysuit",
        categoryId: categories["Bodysuits"],
        description: "Soft organic cotton bodysuit with snap buttons",
        gender: "unisex",
        season: "all-season",
        baseSku: "LB-BODY-001",
        costPrice: 8,
        sellingPrice: 18,
        variants: [
          { size: "0-3M", color: "white", qty: 12 },
          { size: "0-3M", color: "beige", qty: 8 },
          { size: "3-6M", color: "white", qty: 15 },
          { size: "3-6M", color: "pink", qty: 6 },
          { size: "6-9M", color: "white", qty: 3 },
          { size: "6-9M", color: "blue", qty: 0 },
        ],
      },
      {
        name: "Puffer Jacket",
        categoryId: categories["Jackets"],
        description: "Warm puffer jacket for cold weather",
        gender: "unisex",
        season: "winter",
        baseSku: "LB-JACK-001",
        costPrice: 22,
        sellingPrice: 55,
        variants: [
          { size: "1Y", color: "cream", qty: 4 },
          { size: "2Y", color: "cream", qty: 7 },
          { size: "2Y", color: "gray", qty: 2 },
          { size: "3Y", color: "cream", qty: 9 },
          { size: "4Y", color: "gray", qty: 5 },
        ],
      },
      {
        name: "Floral Dress",
        categoryId: categories["Dresses"],
        description: "Cute floral print dress for little girls",
        gender: "girl",
        season: "spring",
        baseSku: "LB-DRES-001",
        costPrice: 14,
        sellingPrice: 35,
        variants: [
          { size: "1Y", color: "pink", qty: 6 },
          { size: "2Y", color: "pink", qty: 8 },
          { size: "3Y", color: "pink", qty: 4 },
          { size: "3Y", color: "white", qty: 3 },
          { size: "4Y", color: "white", qty: 0 },
          { size: "5Y", color: "pink", qty: 2 },
        ],
      },
      {
        name: "2-Piece Pajama Set",
        categoryId: categories["Pajamas"],
        description: "Cozy cotton pajama set with long sleeves",
        gender: "unisex",
        season: "winter",
        baseSku: "LB-PAJA-001",
        costPrice: 12,
        sellingPrice: 28,
        variants: [
          { size: "0-3M", color: "gray", qty: 10 },
          { size: "3-6M", color: "blue", qty: 7 },
          { size: "6-9M", color: "gray", qty: 5 },
          { size: "9-12M", color: "blue", qty: 3 },
          { size: "1Y", color: "gray", qty: 8 },
          { size: "2Y", color: "blue", qty: 6 },
        ],
      },
      {
        name: "Knit Sweater",
        categoryId: categories["Sweaters"],
        description: "Soft knit sweater with ribbed cuffs",
        gender: "unisex",
        season: "winter",
        baseSku: "LB-SWEA-001",
        costPrice: 16,
        sellingPrice: 40,
        variants: [
          { size: "1Y", color: "cream", qty: 5 },
          { size: "2Y", color: "beige", qty: 4 },
          { size: "3Y", color: "cream", qty: 6 },
          { size: "4Y", color: "beige", qty: 3 },
          { size: "5Y", color: "gray", qty: 7 },
        ],
      },
      {
        name: "Canvas Sneakers",
        categoryId: categories["Shoes"],
        description: "Comfortable canvas sneakers for everyday wear",
        gender: "unisex",
        season: "all-season",
        baseSku: "LB-SHOE-001",
        costPrice: 18,
        sellingPrice: 42,
        variants: [
          { size: "18", color: "white", qty: 4 },
          { size: "19", color: "white", qty: 6 },
          { size: "20", color: "white", qty: 5 },
          { size: "21", color: "white", qty: 3 },
          { size: "22", color: "beige", qty: 2 },
        ],
      },
      {
        name: "Jogger + Hoodie Set",
        categoryId: categories["Sets"],
        description: "Matching jogger and hoodie set in soft fleece",
        gender: "unisex",
        season: "autumn",
        baseSku: "LB-SETS-001",
        costPrice: 20,
        sellingPrice: 48,
        variants: [
          { size: "1Y", color: "gray", qty: 5 },
          { size: "2Y", color: "gray", qty: 8 },
          { size: "2Y", color: "blue", qty: 4 },
          { size: "3Y", color: "blue", qty: 6 },
          { size: "4Y", color: "gray", qty: 3 },
          { size: "5Y", color: "blue", qty: 2 },
        ],
      },
      {
        name: "Short-Sleeve Bodysuit 3-Pack",
        categoryId: categories["Bodysuits"],
        description: "Pack of 3 short-sleeve bodysuits in neutral colors",
        gender: "unisex",
        season: "summer",
        baseSku: "LB-BODY-002",
        costPrice: 15,
        sellingPrice: 32,
        variants: [
          { size: "0-3M", color: "white", qty: 20 },
          { size: "3-6M", color: "white", qty: 16 },
          { size: "6-9M", color: "beige", qty: 10 },
          { size: "9-12M", color: "white", qty: 8 },
        ],
      },
      {
        name: "Denim Jacket",
        categoryId: categories["Jackets"],
        description: "Classic denim jacket with embroidered details",
        gender: "unisex",
        season: "spring",
        baseSku: "LB-JACK-002",
        costPrice: 25,
        sellingPrice: 60,
        variants: [
          { size: "2Y", color: "blue", qty: 3 },
          { size: "3Y", color: "blue", qty: 5 },
          { size: "4Y", color: "blue", qty: 4 },
          { size: "5Y", color: "blue", qty: 2 },
        ],
      },
      {
        name: "Smocked Dress",
        categoryId: categories["Dresses"],
        description: "Elegant smocked dress for special occasions",
        gender: "girl",
        season: "spring",
        baseSku: "LB-DRES-002",
        costPrice: 18,
        sellingPrice: 45,
        variants: [
          { size: "1Y", color: "white", qty: 4 },
          { size: "2Y", color: "white", qty: 6 },
          { size: "3Y", color: "pink", qty: 3 },
          { size: "4Y", color: "pink", qty: 5 },
          { size: "5Y", color: "white", qty: 2 },
        ],
      },
    ];

    const createdVariants: Array<{ id: string; productId: string; quantity: number }> = [];

    for (const p of products) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          categoryId: p.categoryId,
          description: p.description,
          brand: "Little Bjork",
          gender: p.gender,
          season: p.season,
          baseSku: p.baseSku,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          status: "active",
        },
      });

      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i];
        const sku = `${p.baseSku}-${v.size}-${v.color}`.toUpperCase().replace(/\s/g, "-");
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: v.size,
            color: v.color,
            sku,
            quantity: v.qty,
            lowStockThreshold: 5,
          },
        });
        createdVariants.push({ id: variant.id, productId: product.id, quantity: v.qty });
      }
    }

    // Seed some inventory movements
    const movementTypes = ["restock", "sale", "restock", "sale", "restock"];
    for (let i = 0; i < Math.min(20, createdVariants.length * 2); i++) {
      const v = createdVariants[i % createdVariants.length];
      const type = movementTypes[i % movementTypes.length];
      const qty = type === "sale" ? 1 : 5;
      await prisma.inventoryMovement.create({
        data: {
          productId: v.productId,
          variantId: v.id,
          userId: admin.id,
          type,
          quantityChanged: type === "sale" ? -qty : qty,
          previousQuantity: v.quantity,
          newQuantity: type === "sale" ? v.quantity - qty : v.quantity + qty,
          note: `Initial ${type} record`,
        },
      });
    }

    return Response.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        users: 1,
        categories: categoryNames.length,
        products: products.length,
        variants: createdVariants.length,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Seed failed", details: String(err) },
      { status: 500 }
    );
  }
}
