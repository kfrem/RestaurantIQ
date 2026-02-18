import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  seatingCapacity: integer("seating_capacity").notNull(),
  avgMonthlyCovers: integer("avg_monthly_covers").notNull(),
});

export const monthlyData = pgTable("monthly_data", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  revenue: real("revenue").notNull(),
  foodCost: real("food_cost").notNull(),
  labourCost: real("labour_cost").notNull(),
  energyCost: real("energy_cost").notNull(),
  rentCost: real("rent_cost").notNull(),
  marketingCost: real("marketing_cost").notNull(),
  suppliesCost: real("supplies_cost").notNull(),
  technologyCost: real("technology_cost").notNull(),
  wasteCost: real("waste_cost").notNull(),
  deliveryRevenue: real("delivery_revenue").notNull(),
  dineInRevenue: real("dine_in_revenue").notNull(),
  takeawayRevenue: real("takeaway_revenue").notNull(),
  totalCovers: integer("total_covers").notNull(),
  avgTicketSize: real("avg_ticket_size").notNull(),
  repeatCustomerRate: real("repeat_customer_rate").notNull(),
});

export const costCategories = pgTable("cost_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  description: text("description").notNull(),
  defaultPercentage: real("default_percentage").notNull(),
  icon: text("icon").notNull(),
  processStage: text("process_stage").notNull(),
  classification: text("classification").notNull().default("direct"),
  isDefault: boolean("is_default").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const restaurantCostItems = pgTable("restaurant_cost_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  costCategoryId: integer("cost_category_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  customLabel: text("custom_label"),
  customPercentage: real("custom_percentage"),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  currentPrice: real("current_price").notNull(),
  previousPrice: real("previous_price"),
  category: text("category").notNull(),
  classification: text("classification").notNull().default("direct"),
});

export const supplierIngredients = pgTable("supplier_ingredients", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  ingredientId: integer("ingredient_id").notNull(),
  unitPrice: real("unit_price").notNull(),
  isPreferred: boolean("is_preferred").notNull().default(false),
  leadTimeDays: integer("lead_time_days"),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sellingPrice: real("selling_price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuItemIngredients = pgTable("menu_item_ingredients", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  ingredientId: integer("ingredient_id").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  discountPercent: real("discount_percent").notNull(),
  menuItemId: integer("menu_item_id"),
  targetProfit: real("target_profit"),
  isActive: boolean("is_active").notNull().default(true),
});

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true });
export const insertMonthlyDataSchema = createInsertSchema(monthlyData).omit({ id: true });
export const insertCostCategorySchema = createInsertSchema(costCategories).omit({ id: true });
export const insertRestaurantCostItemSchema = createInsertSchema(restaurantCostItems).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export const insertSupplierIngredientSchema = createInsertSchema(supplierIngredients).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertMenuItemIngredientSchema = createInsertSchema(menuItemIngredients).omit({ id: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true });

// Types
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertMonthlyData = z.infer<typeof insertMonthlyDataSchema>;
export type MonthlyData = typeof monthlyData.$inferSelect;
export type CostCategory = typeof costCategories.$inferSelect;
export type InsertCostCategory = z.infer<typeof insertCostCategorySchema>;
export type RestaurantCostItem = typeof restaurantCostItems.$inferSelect;
export type InsertRestaurantCostItem = z.infer<typeof insertRestaurantCostItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type SupplierIngredient = typeof supplierIngredients.$inferSelect;
export type InsertSupplierIngredient = z.infer<typeof insertSupplierIngredientSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItemIngredient = typeof menuItemIngredients.$inferSelect;
export type InsertMenuItemIngredient = z.infer<typeof insertMenuItemIngredientSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const DEFAULT_COST_CATEGORIES: Omit<InsertCostCategory, "isDefault">[] = [
  { name: "Food & Ingredients", key: "foodCost", description: "Raw ingredients, beverages, and consumables", defaultPercentage: 30, icon: "ShoppingCart", processStage: "procurement", classification: "direct", sortOrder: 1 },
  { name: "Labour", key: "labourCost", description: "Staff wages, benefits, and payroll taxes", defaultPercentage: 28, icon: "Users", processStage: "preparation", classification: "direct", sortOrder: 2 },
  { name: "Energy & Utilities", key: "energyCost", description: "Gas, electric, water, and waste disposal", defaultPercentage: 7, icon: "Zap", processStage: "cooking", classification: "indirect", sortOrder: 3 },
  { name: "Rent & Rates", key: "rentCost", description: "Property lease, business rates, insurance", defaultPercentage: 8, icon: "Building2", processStage: "fixed", classification: "overhead", sortOrder: 4 },
  { name: "Marketing", key: "marketingCost", description: "Advertising, social media, promotions", defaultPercentage: 4, icon: "Megaphone", processStage: "aftersales", classification: "overhead", sortOrder: 5 },
  { name: "Supplies & Equipment", key: "suppliesCost", description: "Cleaning, tableware, disposables, small equipment", defaultPercentage: 3, icon: "Package", processStage: "storage", classification: "indirect", sortOrder: 6 },
  { name: "Technology", key: "technologyCost", description: "POS system, booking software, WiFi", defaultPercentage: 1, icon: "Monitor", processStage: "service", classification: "overhead", sortOrder: 7 },
  { name: "Food Waste", key: "wasteCost", description: "Spoilage, over-production, plate waste", defaultPercentage: 3, icon: "Trash2", processStage: "waste", classification: "indirect", sortOrder: 8 },
  { name: "Packaging & Delivery", key: "deliveryCost", description: "Takeaway containers, delivery platform fees", defaultPercentage: 2, icon: "Truck", processStage: "service", classification: "direct", sortOrder: 9 },
  { name: "Training & Development", key: "trainingCost", description: "Staff training, certification, development", defaultPercentage: 1, icon: "GraduationCap", processStage: "preparation", classification: "overhead", sortOrder: 10 },
  { name: "Maintenance & Repairs", key: "maintenanceCost", description: "Equipment servicing, building maintenance", defaultPercentage: 2, icon: "Wrench", processStage: "fixed", classification: "indirect", sortOrder: 11 },
  { name: "Licenses & Compliance", key: "licenseCost", description: "Alcohol license, food hygiene, permits", defaultPercentage: 1, icon: "Shield", processStage: "fixed", classification: "overhead", sortOrder: 12 },
];
