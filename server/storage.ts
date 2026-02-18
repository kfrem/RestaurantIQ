import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  restaurants, monthlyData, costCategories, restaurantCostItems,
  suppliers, ingredients, supplierIngredients, menuItems, menuItemIngredients, promotions,
  type Restaurant, type InsertRestaurant,
  type MonthlyData, type InsertMonthlyData,
  type CostCategory, type InsertCostCategory,
  type RestaurantCostItem, type InsertRestaurantCostItem,
  type Supplier, type InsertSupplier,
  type Ingredient, type InsertIngredient,
  type SupplierIngredient, type InsertSupplierIngredient,
  type MenuItem, type InsertMenuItem,
  type MenuItemIngredient, type InsertMenuItemIngredient,
  type Promotion, type InsertPromotion,
  type User, type InsertUser,
} from "@shared/schema";

export interface IStorage {
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getFirstRestaurant(): Promise<Restaurant | undefined>;
  createRestaurant(data: InsertRestaurant): Promise<Restaurant>;
  getAllRestaurants(): Promise<Restaurant[]>;

  getMonthlyData(restaurantId: number): Promise<MonthlyData[]>;
  getAllMonthlyData(): Promise<MonthlyData[]>;
  createMonthlyData(data: InsertMonthlyData): Promise<MonthlyData>;

  getMonthlyDataCount(): Promise<number>;
  getRestaurantCount(): Promise<number>;

  getAllCostCategories(): Promise<CostCategory[]>;
  createCostCategory(data: InsertCostCategory): Promise<CostCategory>;
  getCostCategoryCount(): Promise<number>;

  getRestaurantCostItems(restaurantId: number): Promise<RestaurantCostItem[]>;
  createRestaurantCostItem(data: InsertRestaurantCostItem): Promise<RestaurantCostItem>;
  updateRestaurantCostItem(id: number, data: Partial<InsertRestaurantCostItem>): Promise<RestaurantCostItem>;
  deleteRestaurantCostItems(restaurantId: number): Promise<void>;

  getSuppliers(restaurantId: number): Promise<Supplier[]>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  getIngredients(restaurantId: number): Promise<Ingredient[]>;
  createIngredient(data: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, data: Partial<InsertIngredient>): Promise<Ingredient>;
  deleteIngredient(id: number): Promise<void>;

  getSupplierIngredients(supplierId: number): Promise<SupplierIngredient[]>;
  getSupplierIngredientsByIngredient(ingredientId: number): Promise<SupplierIngredient[]>;
  createSupplierIngredient(data: InsertSupplierIngredient): Promise<SupplierIngredient>;
  deleteSupplierIngredient(id: number): Promise<void>;

  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(data: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;

  getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredient[]>;
  createMenuItemIngredient(data: InsertMenuItemIngredient): Promise<MenuItemIngredient>;
  deleteMenuItemIngredients(menuItemId: number): Promise<void>;

  getPromotions(restaurantId: number): Promise<Promotion[]>;
  createPromotion(data: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, data: Partial<InsertPromotion>): Promise<Promotion>;
  deletePromotion(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [result] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return result;
  }

  async getFirstRestaurant(): Promise<Restaurant | undefined> {
    const [result] = await db.select().from(restaurants).limit(1);
    return result;
  }

  async createRestaurant(data: InsertRestaurant): Promise<Restaurant> {
    const [result] = await db.insert(restaurants).values(data).returning();
    return result;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants);
  }

  async getMonthlyData(restaurantId: number): Promise<MonthlyData[]> {
    return db.select().from(monthlyData).where(eq(monthlyData.restaurantId, restaurantId));
  }

  async getAllMonthlyData(): Promise<MonthlyData[]> {
    return db.select().from(monthlyData);
  }

  async createMonthlyData(data: InsertMonthlyData): Promise<MonthlyData> {
    const [result] = await db.insert(monthlyData).values(data).returning();
    return result;
  }

  async getMonthlyDataCount(): Promise<number> {
    const result = await db.select().from(monthlyData);
    return result.length;
  }

  async getRestaurantCount(): Promise<number> {
    const result = await db.select().from(restaurants);
    return result.length;
  }

  async getAllCostCategories(): Promise<CostCategory[]> {
    return db.select().from(costCategories);
  }

  async createCostCategory(data: InsertCostCategory): Promise<CostCategory> {
    const [result] = await db.insert(costCategories).values(data).returning();
    return result;
  }

  async getCostCategoryCount(): Promise<number> {
    const result = await db.select().from(costCategories);
    return result.length;
  }

  async getRestaurantCostItems(restaurantId: number): Promise<RestaurantCostItem[]> {
    return db.select().from(restaurantCostItems).where(eq(restaurantCostItems.restaurantId, restaurantId));
  }

  async createRestaurantCostItem(data: InsertRestaurantCostItem): Promise<RestaurantCostItem> {
    const [result] = await db.insert(restaurantCostItems).values(data).returning();
    return result;
  }

  async updateRestaurantCostItem(id: number, data: Partial<InsertRestaurantCostItem>): Promise<RestaurantCostItem> {
    const [result] = await db.update(restaurantCostItems).set(data).where(eq(restaurantCostItems.id, id)).returning();
    return result;
  }

  async deleteRestaurantCostItems(restaurantId: number): Promise<void> {
    await db.delete(restaurantCostItems).where(eq(restaurantCostItems.restaurantId, restaurantId));
  }

  async getSuppliers(restaurantId: number): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.restaurantId, restaurantId));
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(data).returning();
    return result;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const [result] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return result;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(supplierIngredients).where(eq(supplierIngredients.supplierId, id));
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getIngredients(restaurantId: number): Promise<Ingredient[]> {
    return db.select().from(ingredients).where(eq(ingredients.restaurantId, restaurantId));
  }

  async createIngredient(data: InsertIngredient): Promise<Ingredient> {
    const [result] = await db.insert(ingredients).values(data).returning();
    return result;
  }

  async updateIngredient(id: number, data: Partial<InsertIngredient>): Promise<Ingredient> {
    const [result] = await db.update(ingredients).set(data).where(eq(ingredients.id, id)).returning();
    return result;
  }

  async deleteIngredient(id: number): Promise<void> {
    await db.delete(supplierIngredients).where(eq(supplierIngredients.ingredientId, id));
    await db.delete(menuItemIngredients).where(eq(menuItemIngredients.ingredientId, id));
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  async getSupplierIngredients(supplierId: number): Promise<SupplierIngredient[]> {
    return db.select().from(supplierIngredients).where(eq(supplierIngredients.supplierId, supplierId));
  }

  async getSupplierIngredientsByIngredient(ingredientId: number): Promise<SupplierIngredient[]> {
    return db.select().from(supplierIngredients).where(eq(supplierIngredients.ingredientId, ingredientId));
  }

  async createSupplierIngredient(data: InsertSupplierIngredient): Promise<SupplierIngredient> {
    const [result] = await db.insert(supplierIngredients).values(data).returning();
    return result;
  }

  async deleteSupplierIngredient(id: number): Promise<void> {
    await db.delete(supplierIngredients).where(eq(supplierIngredients.id, id));
  }

  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
    const [result] = await db.insert(menuItems).values(data).returning();
    return result;
  }

  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [result] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    return result;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.delete(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, id));
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  async getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredient[]> {
    return db.select().from(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, menuItemId));
  }

  async createMenuItemIngredient(data: InsertMenuItemIngredient): Promise<MenuItemIngredient> {
    const [result] = await db.insert(menuItemIngredients).values(data).returning();
    return result;
  }

  async deleteMenuItemIngredients(menuItemId: number): Promise<void> {
    await db.delete(menuItemIngredients).where(eq(menuItemIngredients.menuItemId, menuItemId));
  }

  async getPromotions(restaurantId: number): Promise<Promotion[]> {
    return db.select().from(promotions).where(eq(promotions.restaurantId, restaurantId));
  }

  async createPromotion(data: InsertPromotion): Promise<Promotion> {
    const [result] = await db.insert(promotions).values(data).returning();
    return result;
  }

  async updatePromotion(id: number, data: Partial<InsertPromotion>): Promise<Promotion> {
    const [result] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning();
    return result;
  }

  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }
}

export const storage = new DatabaseStorage();
