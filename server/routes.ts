import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRestaurantSchema, insertMonthlyDataSchema, insertCostCategorySchema,
  insertRestaurantCostItemSchema, insertSupplierSchema, insertIngredientSchema,
  insertSupplierIngredientSchema, insertMenuItemSchema, insertMenuItemIngredientSchema,
  insertPromotionSchema,
} from "@shared/schema";
import { seedDatabase } from "./seed";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.get("/api/restaurants/current", async (_req, res) => {
    try {
      const restaurant = await storage.getFirstRestaurant();
      if (!restaurant) {
        return res.status(404).json({ message: "No restaurant found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.get("/api/restaurants", async (_req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      const parsed = insertRestaurantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const restaurant = await storage.createRestaurant(parsed.data);
      res.status(201).json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.get("/api/monthly-data", async (_req, res) => {
    try {
      const data = await storage.getAllMonthlyData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly data" });
    }
  });

  app.get("/api/monthly-data/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      const data = await storage.getMonthlyData(restaurantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly data" });
    }
  });

  app.post("/api/monthly-data", async (req, res) => {
    try {
      const parsed = insertMonthlyDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const entry = await storage.createMonthlyData(parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create monthly data" });
    }
  });

  app.get("/api/cost-categories", async (_req, res) => {
    try {
      const categories = await storage.getAllCostCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost categories" });
    }
  });

  app.post("/api/cost-categories", async (req, res) => {
    try {
      const parsed = insertCostCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const category = await storage.createCostCategory(parsed.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create cost category" });
    }
  });

  app.get("/api/restaurant-cost-items/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      const items = await storage.getRestaurantCostItems(restaurantId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost items" });
    }
  });

  app.post("/api/restaurant-cost-items", async (req, res) => {
    try {
      const parsed = insertRestaurantCostItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const item = await storage.createRestaurantCostItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create cost item" });
    }
  });

  app.put("/api/restaurant-cost-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const item = await storage.updateRestaurantCostItem(id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cost item" });
    }
  });

  app.post("/api/restaurant-cost-items/bulk/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      await storage.deleteRestaurantCostItems(restaurantId);
      const items = req.body.items as any[];
      const created = [];
      for (const item of items) {
        const result = await storage.createRestaurantCostItem({
          ...item,
          restaurantId,
        });
        created.push(result);
      }
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to save cost items" });
    }
  });

  // Suppliers
  app.get("/api/suppliers/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) return res.status(400).json({ message: "Invalid restaurant ID" });
      const data = await storage.getSuppliers(restaurantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const parsed = insertSupplierSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const supplier = await storage.createSupplier(parsed.data);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const supplier = await storage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Ingredients
  app.get("/api/ingredients/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) return res.status(400).json({ message: "Invalid restaurant ID" });
      const data = await storage.getIngredients(restaurantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const parsed = insertIngredientSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const ingredient = await storage.createIngredient(parsed.data);
      res.status(201).json(ingredient);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ingredient" });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const ingredient = await storage.updateIngredient(id, req.body);
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIngredient(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // Supplier-Ingredient links
  app.get("/api/supplier-ingredients/:supplierId", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      if (isNaN(supplierId)) return res.status(400).json({ message: "Invalid supplier ID" });
      const data = await storage.getSupplierIngredients(supplierId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier ingredients" });
    }
  });

  app.get("/api/ingredient-suppliers/:ingredientId", async (req, res) => {
    try {
      const ingredientId = parseInt(req.params.ingredientId);
      if (isNaN(ingredientId)) return res.status(400).json({ message: "Invalid ingredient ID" });
      const data = await storage.getSupplierIngredientsByIngredient(ingredientId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredient suppliers" });
    }
  });

  app.post("/api/supplier-ingredients", async (req, res) => {
    try {
      const parsed = insertSupplierIngredientSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const link = await storage.createSupplierIngredient(parsed.data);
      res.status(201).json(link);
    } catch (error) {
      res.status(500).json({ message: "Failed to link supplier ingredient" });
    }
  });

  app.delete("/api/supplier-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteSupplierIngredient(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier ingredient" });
    }
  });

  // Menu Items
  app.get("/api/menu-items/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) return res.status(400).json({ message: "Invalid restaurant ID" });
      const data = await storage.getMenuItems(restaurantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu-items", async (req, res) => {
    try {
      const parsed = insertMenuItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const menuItem = await storage.createMenuItem(parsed.data);
      res.status(201).json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const menuItem = await storage.updateMenuItem(id, req.body);
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteMenuItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Menu Item Ingredients (recipe)
  app.get("/api/menu-item-ingredients/:menuItemId", async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.menuItemId);
      if (isNaN(menuItemId)) return res.status(400).json({ message: "Invalid menu item ID" });
      const data = await storage.getMenuItemIngredients(menuItemId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/menu-item-ingredients/bulk/:menuItemId", async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.menuItemId);
      if (isNaN(menuItemId)) return res.status(400).json({ message: "Invalid menu item ID" });
      await storage.deleteMenuItemIngredients(menuItemId);
      const items = req.body.ingredients as any[];
      const created = [];
      for (const item of items) {
        const result = await storage.createMenuItemIngredient({
          menuItemId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        });
        created.push(result);
      }
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to save recipe ingredients" });
    }
  });

  // Promotions
  app.get("/api/promotions/:restaurantId", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) return res.status(400).json({ message: "Invalid restaurant ID" });
      const data = await storage.getPromotions(restaurantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const parsed = insertPromotionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const promo = await storage.createPromotion(parsed.data);
      res.status(201).json(promo);
    } catch (error) {
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  app.put("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const promo = await storage.updatePromotion(id, req.body);
      res.json(promo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update promotion" });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deletePromotion(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotion" });
    }
  });

  // Data Import - CSV/Excel
  app.post("/api/import/ingredients", async (req, res) => {
    try {
      const { restaurantId, data } = req.body;
      if (!restaurantId || !Array.isArray(data)) {
        return res.status(400).json({ message: "Missing restaurantId or data array" });
      }
      const created = [];
      for (const row of data) {
        const parsed = insertIngredientSchema.safeParse({
          restaurantId,
          name: row.name,
          unit: row.unit || "kg",
          currentPrice: parseFloat(row.currentPrice || row.price || "0"),
          previousPrice: row.previousPrice ? parseFloat(row.previousPrice) : null,
          category: row.category || "general",
          classification: row.classification || "direct",
        });
        if (parsed.success) {
          const ingredient = await storage.createIngredient(parsed.data);
          created.push(ingredient);
        }
      }
      res.status(201).json({ imported: created.length, items: created });
    } catch (error) {
      res.status(500).json({ message: "Failed to import ingredients" });
    }
  });

  app.post("/api/import/suppliers", async (req, res) => {
    try {
      const { restaurantId, data } = req.body;
      if (!restaurantId || !Array.isArray(data)) {
        return res.status(400).json({ message: "Missing restaurantId or data array" });
      }
      const created = [];
      for (const row of data) {
        const parsed = insertSupplierSchema.safeParse({
          restaurantId,
          name: row.name,
          contactInfo: row.contactInfo || row.contact || null,
          category: row.category || "general",
          isActive: true,
        });
        if (parsed.success) {
          const supplier = await storage.createSupplier(parsed.data);
          created.push(supplier);
        }
      }
      res.status(201).json({ imported: created.length, items: created });
    } catch (error) {
      res.status(500).json({ message: "Failed to import suppliers" });
    }
  });

  app.post("/api/import/menu-items", async (req, res) => {
    try {
      const { restaurantId, data } = req.body;
      if (!restaurantId || !Array.isArray(data)) {
        return res.status(400).json({ message: "Missing restaurantId or data array" });
      }
      const created = [];
      for (const row of data) {
        const parsed = insertMenuItemSchema.safeParse({
          restaurantId,
          name: row.name,
          category: row.category || "main",
          sellingPrice: parseFloat(row.sellingPrice || row.price || "0"),
          description: row.description || null,
          isActive: true,
        });
        if (parsed.success) {
          const menuItem = await storage.createMenuItem(parsed.data);
          created.push(menuItem);
        }
      }
      res.status(201).json({ imported: created.length, items: created });
    } catch (error) {
      res.status(500).json({ message: "Failed to import menu items" });
    }
  });

  return httpServer;
}
