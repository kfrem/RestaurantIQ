import { storage } from "./storage";
import { DEFAULT_COST_CATEGORIES } from "@shared/schema";
import { log } from "./index";

export async function seedDatabase() {
  const costCatCount = await storage.getCostCategoryCount();
  if (costCatCount === 0) {
    log("Seeding cost categories...");
    for (const cat of DEFAULT_COST_CATEGORIES) {
      await storage.createCostCategory({ ...cat, isDefault: true });
    }
    log(`Seeded ${DEFAULT_COST_CATEGORIES.length} cost categories`);
  }

  const restaurantCount = await storage.getRestaurantCount();
  if (restaurantCount > 0) {
    log("Database already seeded, skipping restaurant data");

    const restaurant = await storage.getFirstRestaurant();
    if (restaurant) {
      const existingSuppliers = await storage.getSuppliers(restaurant.id);
      if (existingSuppliers.length === 0) {
        await seedDemoSupplierData(restaurant.id);
      }
    }
    return;
  }

  log("Seeding database with demo data...");

  const restaurant = await storage.createRestaurant({
    name: "The Golden Fork",
    type: "Mediterranean",
    location: "London, Shoreditch",
    seatingCapacity: 65,
    avgMonthlyCovers: 2200,
  });

  const monthlyEntries = [
    { restaurantId: restaurant.id, month: "September", year: 2025, revenue: 82000, foodCost: 27060, labourCost: 24600, energyCost: 5740, rentCost: 6500, marketingCost: 2460, suppliesCost: 2050, technologyCost: 820, wasteCost: 3280, deliveryRevenue: 12300, dineInRevenue: 57400, takeawayRevenue: 12300, totalCovers: 2050, avgTicketSize: 28.50, repeatCustomerRate: 32 },
    { restaurantId: restaurant.id, month: "October", year: 2025, revenue: 88500, foodCost: 28320, labourCost: 25665, energyCost: 6195, rentCost: 6500, marketingCost: 3540, suppliesCost: 2210, technologyCost: 885, wasteCost: 2655, deliveryRevenue: 15930, dineInRevenue: 58410, takeawayRevenue: 14160, totalCovers: 2210, avgTicketSize: 29.80, repeatCustomerRate: 34 },
    { restaurantId: restaurant.id, month: "November", year: 2025, revenue: 91200, foodCost: 29184, labourCost: 26448, energyCost: 6384, rentCost: 6500, marketingCost: 3648, suppliesCost: 2280, technologyCost: 912, wasteCost: 2736, deliveryRevenue: 16416, dineInRevenue: 60192, takeawayRevenue: 14592, totalCovers: 2280, avgTicketSize: 30.10, repeatCustomerRate: 36 },
    { restaurantId: restaurant.id, month: "December", year: 2025, revenue: 105000, foodCost: 33600, labourCost: 30450, energyCost: 7350, rentCost: 6500, marketingCost: 4200, suppliesCost: 2625, technologyCost: 1050, wasteCost: 3150, deliveryRevenue: 15750, dineInRevenue: 73500, takeawayRevenue: 15750, totalCovers: 2625, avgTicketSize: 32.00, repeatCustomerRate: 38 },
    { restaurantId: restaurant.id, month: "January", year: 2026, revenue: 78000, foodCost: 26520, labourCost: 23400, energyCost: 6240, rentCost: 6500, marketingCost: 3120, suppliesCost: 1950, technologyCost: 780, wasteCost: 3510, deliveryRevenue: 14040, dineInRevenue: 50700, takeawayRevenue: 13260, totalCovers: 1950, avgTicketSize: 27.50, repeatCustomerRate: 30 },
    { restaurantId: restaurant.id, month: "February", year: 2026, revenue: 84500, foodCost: 28730, labourCost: 24505, energyCost: 5915, rentCost: 6500, marketingCost: 3380, suppliesCost: 2112, technologyCost: 845, wasteCost: 2535, deliveryRevenue: 15210, dineInRevenue: 55770, takeawayRevenue: 13520, totalCovers: 2112, avgTicketSize: 29.20, repeatCustomerRate: 33 },
  ];

  for (const entry of monthlyEntries) {
    await storage.createMonthlyData(entry);
  }

  log(`Seeded database with restaurant and ${monthlyEntries.length} months of data`);
  await seedDemoSupplierData(restaurant.id);
}

async function seedDemoSupplierData(restaurantId: number) {
  log("Seeding demo suppliers, ingredients, and menu items...");

  const s1 = await storage.createSupplier({ restaurantId, name: "Fresh Fields Wholesale", contactInfo: "orders@freshfields.co.uk", category: "produce", isActive: true });
  const s2 = await storage.createSupplier({ restaurantId, name: "Mediterranean Imports Ltd", contactInfo: "sales@medimports.co.uk", category: "specialty", isActive: true });
  const s3 = await storage.createSupplier({ restaurantId, name: "London Meat Co", contactInfo: "info@londonmeat.co.uk", category: "protein", isActive: true });
  const s4 = await storage.createSupplier({ restaurantId, name: "Ocean Harvest Fish", contactInfo: "trade@oceanharvest.co.uk", category: "seafood", isActive: true });
  const s5 = await storage.createSupplier({ restaurantId, name: "Dairy Direct", contactInfo: "wholesale@dairydirect.co.uk", category: "dairy", isActive: true });

  const oliveOil = await storage.createIngredient({ restaurantId, name: "Extra Virgin Olive Oil", unit: "litre", currentPrice: 8.50, previousPrice: 7.20, category: "oils", classification: "direct" });
  const chicken = await storage.createIngredient({ restaurantId, name: "Chicken Breast", unit: "kg", currentPrice: 6.80, previousPrice: 5.90, category: "protein", classification: "direct" });
  const lamb = await storage.createIngredient({ restaurantId, name: "Lamb Shoulder", unit: "kg", currentPrice: 12.50, previousPrice: 11.00, category: "protein", classification: "direct" });
  const seaBass = await storage.createIngredient({ restaurantId, name: "Sea Bass Fillet", unit: "kg", currentPrice: 18.00, previousPrice: 16.50, category: "seafood", classification: "direct" });
  const tomatoes = await storage.createIngredient({ restaurantId, name: "Vine Tomatoes", unit: "kg", currentPrice: 2.80, previousPrice: 2.40, category: "produce", classification: "direct" });
  const feta = await storage.createIngredient({ restaurantId, name: "Feta Cheese", unit: "kg", currentPrice: 9.20, previousPrice: 8.50, category: "dairy", classification: "direct" });
  const halloumi = await storage.createIngredient({ restaurantId, name: "Halloumi", unit: "kg", currentPrice: 11.00, previousPrice: 10.20, category: "dairy", classification: "direct" });
  const pitta = await storage.createIngredient({ restaurantId, name: "Pitta Bread", unit: "pack", currentPrice: 1.80, previousPrice: 1.50, category: "bakery", classification: "direct" });
  const hummus = await storage.createIngredient({ restaurantId, name: "Hummus (made in-house)", unit: "kg", currentPrice: 3.50, previousPrice: 3.20, category: "prepared", classification: "direct" });
  const rice = await storage.createIngredient({ restaurantId, name: "Basmati Rice", unit: "kg", currentPrice: 2.20, previousPrice: 1.90, category: "grains", classification: "direct" });
  const salad = await storage.createIngredient({ restaurantId, name: "Mixed Salad Leaves", unit: "kg", currentPrice: 4.50, previousPrice: 4.00, category: "produce", classification: "direct" });
  const lemon = await storage.createIngredient({ restaurantId, name: "Lemons", unit: "kg", currentPrice: 2.10, previousPrice: 1.80, category: "produce", classification: "direct" });
  const garlic = await storage.createIngredient({ restaurantId, name: "Garlic", unit: "kg", currentPrice: 5.00, previousPrice: 4.50, category: "produce", classification: "direct" });
  const spices = await storage.createIngredient({ restaurantId, name: "Spice Mix (Za'atar)", unit: "kg", currentPrice: 15.00, previousPrice: 13.00, category: "spices", classification: "direct" });
  const onions = await storage.createIngredient({ restaurantId, name: "Red Onions", unit: "kg", currentPrice: 1.20, previousPrice: 1.00, category: "produce", classification: "direct" });

  await storage.createSupplierIngredient({ supplierId: s1.id, ingredientId: tomatoes.id, unitPrice: 2.80, isPreferred: true, leadTimeDays: 1 });
  await storage.createSupplierIngredient({ supplierId: s1.id, ingredientId: salad.id, unitPrice: 4.50, isPreferred: true, leadTimeDays: 1 });
  await storage.createSupplierIngredient({ supplierId: s1.id, ingredientId: lemon.id, unitPrice: 2.10, isPreferred: true, leadTimeDays: 1 });
  await storage.createSupplierIngredient({ supplierId: s1.id, ingredientId: garlic.id, unitPrice: 5.00, isPreferred: true, leadTimeDays: 1 });
  await storage.createSupplierIngredient({ supplierId: s1.id, ingredientId: onions.id, unitPrice: 1.20, isPreferred: true, leadTimeDays: 1 });

  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: oliveOil.id, unitPrice: 8.50, isPreferred: true, leadTimeDays: 3 });
  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: feta.id, unitPrice: 9.20, isPreferred: true, leadTimeDays: 3 });
  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: halloumi.id, unitPrice: 11.00, isPreferred: true, leadTimeDays: 3 });
  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: hummus.id, unitPrice: 3.50, isPreferred: false, leadTimeDays: 3 });
  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: spices.id, unitPrice: 15.00, isPreferred: true, leadTimeDays: 5 });
  await storage.createSupplierIngredient({ supplierId: s2.id, ingredientId: pitta.id, unitPrice: 1.80, isPreferred: true, leadTimeDays: 2 });

  await storage.createSupplierIngredient({ supplierId: s3.id, ingredientId: chicken.id, unitPrice: 6.80, isPreferred: true, leadTimeDays: 1 });
  await storage.createSupplierIngredient({ supplierId: s3.id, ingredientId: lamb.id, unitPrice: 12.50, isPreferred: true, leadTimeDays: 2 });

  await storage.createSupplierIngredient({ supplierId: s4.id, ingredientId: seaBass.id, unitPrice: 18.00, isPreferred: true, leadTimeDays: 1 });

  await storage.createSupplierIngredient({ supplierId: s5.id, ingredientId: feta.id, unitPrice: 9.80, isPreferred: false, leadTimeDays: 2 });
  await storage.createSupplierIngredient({ supplierId: s5.id, ingredientId: halloumi.id, unitPrice: 11.50, isPreferred: false, leadTimeDays: 2 });

  const m1 = await storage.createMenuItem({ restaurantId, name: "Grilled Chicken Souvlaki", category: "main", sellingPrice: 16.50, description: "Marinated chicken skewers with rice and salad", isActive: true });
  const m2 = await storage.createMenuItem({ restaurantId, name: "Lamb Kofta Plate", category: "main", sellingPrice: 18.50, description: "Spiced lamb kofta with hummus and pitta", isActive: true });
  const m3 = await storage.createMenuItem({ restaurantId, name: "Pan-Fried Sea Bass", category: "main", sellingPrice: 22.00, description: "Fresh sea bass with Mediterranean vegetables", isActive: true });
  const m4 = await storage.createMenuItem({ restaurantId, name: "Halloumi Mezze Platter", category: "starter", sellingPrice: 12.50, description: "Grilled halloumi with hummus, pitta, and salad", isActive: true });
  const m5 = await storage.createMenuItem({ restaurantId, name: "Greek Salad", category: "starter", sellingPrice: 9.50, description: "Classic Greek salad with feta and olive oil", isActive: true });
  const m6 = await storage.createMenuItem({ restaurantId, name: "Chicken Shawarma Wrap", category: "main", sellingPrice: 13.50, description: "Spiced chicken in warm pitta with garlic sauce", isActive: true });

  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: chicken.id, quantity: 0.25, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: rice.id, quantity: 0.15, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: salad.id, quantity: 0.08, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: oliveOil.id, quantity: 0.03, unit: "litre" });
  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: lemon.id, quantity: 0.05, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m1.id, ingredientId: spices.id, quantity: 0.01, unit: "kg" });

  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: lamb.id, quantity: 0.22, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: hummus.id, quantity: 0.10, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: pitta.id, quantity: 1, unit: "pack" });
  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: onions.id, quantity: 0.05, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: spices.id, quantity: 0.015, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m2.id, ingredientId: oliveOil.id, quantity: 0.02, unit: "litre" });

  await storage.createMenuItemIngredient({ menuItemId: m3.id, ingredientId: seaBass.id, quantity: 0.20, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m3.id, ingredientId: tomatoes.id, quantity: 0.10, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m3.id, ingredientId: oliveOil.id, quantity: 0.04, unit: "litre" });
  await storage.createMenuItemIngredient({ menuItemId: m3.id, ingredientId: lemon.id, quantity: 0.05, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m3.id, ingredientId: garlic.id, quantity: 0.02, unit: "kg" });

  await storage.createMenuItemIngredient({ menuItemId: m4.id, ingredientId: halloumi.id, quantity: 0.15, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m4.id, ingredientId: hummus.id, quantity: 0.12, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m4.id, ingredientId: pitta.id, quantity: 1, unit: "pack" });
  await storage.createMenuItemIngredient({ menuItemId: m4.id, ingredientId: salad.id, quantity: 0.06, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m4.id, ingredientId: oliveOil.id, quantity: 0.02, unit: "litre" });

  await storage.createMenuItemIngredient({ menuItemId: m5.id, ingredientId: feta.id, quantity: 0.08, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m5.id, ingredientId: tomatoes.id, quantity: 0.12, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m5.id, ingredientId: oliveOil.id, quantity: 0.03, unit: "litre" });
  await storage.createMenuItemIngredient({ menuItemId: m5.id, ingredientId: onions.id, quantity: 0.04, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m5.id, ingredientId: salad.id, quantity: 0.10, unit: "kg" });

  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: chicken.id, quantity: 0.20, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: pitta.id, quantity: 1, unit: "pack" });
  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: garlic.id, quantity: 0.02, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: salad.id, quantity: 0.05, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: spices.id, quantity: 0.01, unit: "kg" });
  await storage.createMenuItemIngredient({ menuItemId: m6.id, ingredientId: oliveOil.id, quantity: 0.02, unit: "litre" });

  await storage.createPromotion({ restaurantId, name: "Lunch Special - 15% Off", discountPercent: 15, menuItemId: null, targetProfit: 50000, isActive: true });
  await storage.createPromotion({ restaurantId, name: "Sea Bass Promo - 10% Off", discountPercent: 10, menuItemId: m3.id, targetProfit: 8000, isActive: true });

  log("Seeded demo suppliers, ingredients, menu items, and promotions");
}
