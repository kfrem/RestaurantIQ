import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MenuItem, Ingredient, MenuItemIngredient } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, ChefHat, TrendingUp, Target, PoundSterling,
  ArrowUpRight, AlertTriangle, UtensilsCrossed,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function MenuCosting() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [targetMonthlyProfit, setTargetMonthlyProfit] = useState(15000);
  const [newItem, setNewItem] = useState({ name: "", category: "main", sellingPrice: "", description: "" });
  const [editingRecipe, setEditingRecipe] = useState<{ ingredientId: number; quantity: string; unit: string }[]>([]);

  const { data: restaurant } = useQuery<any>({ queryKey: ["/api/restaurants/current"] });
  const restaurantId = restaurant?.id || 1;

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items", restaurantId],
  });

  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients", restaurantId],
  });

  const selectedMenuItem = menuItems.find((m) => m.id === selectedItem);

  const { data: recipeIngredients = [] } = useQuery<MenuItemIngredient[]>({
    queryKey: ["/api/menu-item-ingredients", selectedItem],
    enabled: !!selectedItem,
  });

  const createMenuItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/menu-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items", restaurantId] });
      setShowAddDialog(false);
      setNewItem({ name: "", category: "main", sellingPrice: "", description: "" });
      toast({ title: "Menu item created" });
    },
    onError: () => {
      toast({ title: "Failed to create menu item", variant: "destructive" });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/menu-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items", restaurantId] });
      setSelectedItem(null);
      toast({ title: "Menu item deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete menu item", variant: "destructive" });
    },
  });

  const saveRecipeMutation = useMutation({
    mutationFn: (data: { menuItemId: number; ingredients: any[] }) =>
      apiRequest("POST", `/api/menu-item-ingredients/bulk/${data.menuItemId}`, { ingredients: data.ingredients }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-item-ingredients", selectedItem] });
      toast({ title: "Recipe saved" });
    },
    onError: () => {
      toast({ title: "Failed to save recipe", variant: "destructive" });
    },
  });

  const getRecipeCost = (ingredients: MenuItemIngredient[]) => {
    let total = 0;
    for (const ri of ingredients) {
      const ing = allIngredients.find((i) => i.id === ri.ingredientId);
      if (ing) total += ri.quantity * ing.currentPrice;
    }
    return total;
  };

  const selectedCost = getRecipeCost(recipeIngredients);
  const selectedProfit = selectedMenuItem ? selectedMenuItem.sellingPrice - selectedCost : 0;
  const selectedMargin = selectedMenuItem && selectedMenuItem.sellingPrice > 0 ? (selectedProfit / selectedMenuItem.sellingPrice) * 100 : 0;
  const servesNeeded = selectedProfit > 0 ? Math.ceil(targetMonthlyProfit / selectedProfit) : 0;
  const weeklyServesNeeded = Math.ceil(servesNeeded / 4.345);

  const chartData = menuItems.map((item) => {
    return {
      name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
      sellingPrice: item.sellingPrice,
      category: item.category,
    };
  });

  const startEditRecipe = () => {
    setEditingRecipe(
      recipeIngredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity: ri.quantity.toString(),
        unit: ri.unit,
      }))
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-menu-costing">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Menu & Recipe Costing</h1>
          <p className="text-sm text-muted-foreground mt-1">Track ingredient costs per dish and calculate profit per serve</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-menu-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input data-testid="input-menu-name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Dish name" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger data-testid="select-menu-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="drink">Drink</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Selling Price (£)</Label>
                <Input data-testid="input-menu-price" type="number" step="0.01" value={newItem.sellingPrice} onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Description</Label>
                <Input data-testid="input-menu-description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Short description" />
              </div>
              <Button
                className="w-full"
                data-testid="button-save-menu-item"
                disabled={!newItem.name || !newItem.sellingPrice}
                onClick={() => {
                  createMenuItemMutation.mutate({
                    restaurantId,
                    name: newItem.name,
                    category: newItem.category,
                    sellingPrice: parseFloat(newItem.sellingPrice),
                    description: newItem.description || null,
                    isActive: true,
                  });
                }}
              >
                Save Menu Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Menu Items ({menuItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {menuItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No menu items yet. Add your first dish above.</p>
              )}
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`menu-item-${item.id}`}
                  className={`p-3 rounded-md cursor-pointer transition-colors border ${selectedItem === item.id ? "border-primary bg-primary/5" : "border-transparent hover-elevate"}`}
                  onClick={() => {
                    setSelectedItem(item.id);
                    setEditingRecipe([]);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">£{item.sellingPrice.toFixed(2)}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedMenuItem ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base font-semibold">{selectedMenuItem.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedMenuItem.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{selectedMenuItem.category}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid="button-delete-menu-item"
                      onClick={() => setItemToDelete(selectedMenuItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <PoundSterling className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Selling Price</span>
                      <div className="text-lg font-bold" data-testid="text-selling-price">£{selectedMenuItem.sellingPrice.toFixed(2)}</div>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <ChefHat className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Ingredient Cost</span>
                      <div className="text-lg font-bold" data-testid="text-ingredient-cost">£{selectedCost.toFixed(2)}</div>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Profit / Serve</span>
                      <div className={`text-lg font-bold ${selectedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} data-testid="text-profit-per-serve">
                        £{selectedProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Margin</span>
                      <div className={`text-lg font-bold ${selectedMargin >= 60 ? "text-emerald-600 dark:text-emerald-400" : selectedMargin >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500"}`} data-testid="text-margin">
                        {selectedMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-semibold">Recipe Ingredients</CardTitle>
                  {editingRecipe.length === 0 ? (
                    <Button size="sm" variant="outline" data-testid="button-edit-recipe" onClick={startEditRecipe}>
                      Edit Recipe
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRecipe([])}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        data-testid="button-save-recipe"
                        onClick={() => {
                          saveRecipeMutation.mutate({
                            menuItemId: selectedItem!,
                            ingredients: editingRecipe.filter((r) => r.ingredientId > 0 && parseFloat(r.quantity) > 0).map((r) => ({
                              ingredientId: r.ingredientId,
                              quantity: parseFloat(r.quantity),
                              unit: r.unit,
                            })),
                          });
                          setEditingRecipe([]);
                        }}
                      >
                        Save Recipe
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {editingRecipe.length > 0 ? (
                    <div className="space-y-2">
                      {editingRecipe.map((row, i) => {
                        const ing = allIngredients.find((x) => x.id === row.ingredientId);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <Select value={row.ingredientId.toString()} onValueChange={(v) => {
                              const updated = [...editingRecipe];
                              const selIng = allIngredients.find((x) => x.id === parseInt(v));
                              updated[i] = { ...updated[i], ingredientId: parseInt(v), unit: selIng?.unit || row.unit };
                              setEditingRecipe(updated);
                            }}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {allIngredients.map((ing) => (
                                  <SelectItem key={ing.id} value={ing.id.toString()}>{ing.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className="w-20"
                              type="number"
                              step="0.01"
                              value={row.quantity}
                              onChange={(e) => {
                                const updated = [...editingRecipe];
                                updated[i] = { ...updated[i], quantity: e.target.value };
                                setEditingRecipe(updated);
                              }}
                            />
                            <span className="text-xs text-muted-foreground w-12">{row.unit}</span>
                            <span className="text-xs w-14 text-right">£{ing ? (parseFloat(row.quantity || "0") * ing.currentPrice).toFixed(2) : "0.00"}</span>
                            <Button size="icon" variant="ghost" onClick={() => setEditingRecipe(editingRecipe.filter((_, j) => j !== i))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setEditingRecipe([...editingRecipe, { ingredientId: 0, quantity: "", unit: "kg" }])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recipeIngredients.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recipe defined. Click "Edit Recipe" to add ingredients.</p>
                      ) : (
                        <>
                          {recipeIngredients.map((ri) => {
                            const ing = allIngredients.find((x) => x.id === ri.ingredientId);
                            const cost = ing ? ri.quantity * ing.currentPrice : 0;
                            const priceChange = ing && ing.previousPrice ? ((ing.currentPrice - ing.previousPrice) / ing.previousPrice) * 100 : 0;
                            return (
                              <div key={ri.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0" data-testid={`recipe-ingredient-${ri.id}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm truncate">{ing?.name || "Unknown"}</span>
                                  {priceChange > 5 && (
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                      <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                                      +{priceChange.toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-muted-foreground">{ri.quantity} {ri.unit}</span>
                                  <span className="text-sm font-medium">£{cost.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between pt-2 font-semibold text-sm">
                            <span>Total Ingredient Cost</span>
                            <span>£{selectedCost.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target Profit Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Monthly Profit Target (£)</Label>
                      <Input
                        type="number"
                        data-testid="input-target-profit"
                        value={targetMonthlyProfit}
                        onChange={(e) => setTargetMonthlyProfit(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {selectedProfit > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-md bg-muted/50 text-center">
                          <span className="text-xs text-muted-foreground">Monthly Serves Needed</span>
                          <div className="text-xl font-bold" data-testid="text-monthly-serves">{servesNeeded.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-md bg-muted/50 text-center">
                          <span className="text-xs text-muted-foreground">Weekly Serves Needed</span>
                          <div className="text-xl font-bold" data-testid="text-weekly-serves">{weeklyServesNeeded.toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-md bg-muted/50 text-center">
                        <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">
                          {selectedProfit <= 0 ? "This dish has no profit margin. Add recipe ingredients or adjust pricing." : "Set a profit target above."}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Select a menu item to view its recipe, cost breakdown, and profit analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {menuItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Menu Price Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-menu-prices">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`£${value.toFixed(2)}`, "Price"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="sellingPrice" name="Selling Price" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.category === "starter" ? "hsl(200, 70%, 50%)" : entry.category === "main" ? "hsl(24, 95%, 53%)" : "hsl(142, 71%, 45%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => { if (!open) setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this menu item? Its recipe ingredients will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (itemToDelete !== null) {
                  deleteMenuItemMutation.mutate(itemToDelete);
                  setItemToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
