import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Promotion, MenuItem, Ingredient, MenuItemIngredient } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Percent, Target, TrendingDown, TrendingUp,
  Calculator, Tag, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

export default function Promotions() {
  const { toast } = useToast();
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromo, setNewPromo] = useState({ name: "", discountPercent: 10, menuItemId: "", targetProfit: "" });
  const [simDiscount, setSimDiscount] = useState(10);
  const [simMenuItem, setSimMenuItem] = useState<number | null>(null);
  const [simTargetProfit, setSimTargetProfit] = useState(10000);

  const { data: restaurant } = useQuery<any>({ queryKey: ["/api/restaurants/current"] });
  const restaurantId = restaurant?.id || 1;

  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions", restaurantId],
  });
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items", restaurantId],
  });
  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients", restaurantId],
  });

  const createPromoMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/promotions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions", restaurantId] });
      setShowAddPromo(false);
      setNewPromo({ name: "", discountPercent: 10, menuItemId: "", targetProfit: "" });
      toast({ title: "Promotion created" });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions", restaurantId] });
      toast({ title: "Promotion deleted" });
    },
  });

  const simAnalysis = useMemo(() => {
    const item = simMenuItem ? menuItems.find((m) => m.id === simMenuItem) : null;
    if (!item) {
      const avgTicket = menuItems.length > 0 ? menuItems.reduce((s, m) => s + m.sellingPrice, 0) / menuItems.length : 15;
      const avgCostRatio = 0.35;
      const originalPrice = avgTicket;
      const ingredientCost = avgTicket * avgCostRatio;
      const discountedPrice = originalPrice * (1 - simDiscount / 100);
      const profitPerServe = discountedPrice - ingredientCost;
      const originalProfit = originalPrice - ingredientCost;
      const servesNeeded = profitPerServe > 0 ? Math.ceil(simTargetProfit / profitPerServe) : 0;
      const originalServesNeeded = originalProfit > 0 ? Math.ceil(simTargetProfit / originalProfit) : 0;
      const extraServes = servesNeeded - originalServesNeeded;
      return {
        itemName: "Average Menu Item",
        originalPrice,
        discountedPrice,
        ingredientCost,
        originalProfit,
        profitPerServe,
        servesNeeded,
        originalServesNeeded,
        extraServes,
        marginOriginal: (originalProfit / originalPrice) * 100,
        marginDiscounted: profitPerServe > 0 ? (profitPerServe / discountedPrice) * 100 : 0,
      };
    }

    const ingredientCost = item.sellingPrice * 0.30;
    const discountedPrice = item.sellingPrice * (1 - simDiscount / 100);
    const profitPerServe = discountedPrice - ingredientCost;
    const originalProfit = item.sellingPrice - ingredientCost;
    const servesNeeded = profitPerServe > 0 ? Math.ceil(simTargetProfit / profitPerServe) : 0;
    const originalServesNeeded = originalProfit > 0 ? Math.ceil(simTargetProfit / originalProfit) : 0;
    const extraServes = servesNeeded - originalServesNeeded;

    return {
      itemName: item.name,
      originalPrice: item.sellingPrice,
      discountedPrice,
      ingredientCost,
      originalProfit,
      profitPerServe,
      servesNeeded,
      originalServesNeeded,
      extraServes,
      marginOriginal: (originalProfit / item.sellingPrice) * 100,
      marginDiscounted: profitPerServe > 0 ? (profitPerServe / discountedPrice) * 100 : 0,
    };
  }, [simMenuItem, simDiscount, simTargetProfit, menuItems]);

  const discountScenarios = useMemo(() => {
    const scenarios = [5, 10, 15, 20, 25, 30];
    return scenarios.map((disc) => {
      const price = simAnalysis.originalPrice * (1 - disc / 100);
      const profit = price - simAnalysis.ingredientCost;
      const serves = profit > 0 ? Math.ceil(simTargetProfit / profit) : 0;
      return {
        discount: `${disc}%`,
        sellingPrice: price,
        profitPerServe: profit,
        servesNeeded: serves,
      };
    });
  }, [simAnalysis, simTargetProfit]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-promotions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Promotions & Discount Impact</h1>
          <p className="text-sm text-muted-foreground mt-1">Model how discounts affect your bottom line and calculate required order volumes</p>
        </div>
        <Dialog open={showAddPromo} onOpenChange={setShowAddPromo}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-promotion">
              <Plus className="h-4 w-4 mr-2" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Promotion</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Promotion Name</Label>
                <Input data-testid="input-promo-name" value={newPromo.name} onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })} placeholder="e.g., Summer Special" />
              </div>
              <div>
                <Label>Discount: {newPromo.discountPercent}%</Label>
                <Slider value={[newPromo.discountPercent]} onValueChange={([v]) => setNewPromo({ ...newPromo, discountPercent: v })} min={1} max={50} step={1} className="mt-2" />
              </div>
              <div>
                <Label>Apply to Menu Item (optional)</Label>
                <Select value={newPromo.menuItemId} onValueChange={(v) => setNewPromo({ ...newPromo, menuItemId: v })}>
                  <SelectTrigger><SelectValue placeholder="All items" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Menu Items</SelectItem>
                    {menuItems.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.name} (£{m.sellingPrice.toFixed(2)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Monthly Profit (£)</Label>
                <Input type="number" value={newPromo.targetProfit} onChange={(e) => setNewPromo({ ...newPromo, targetProfit: e.target.value })} />
              </div>
              <Button className="w-full" disabled={!newPromo.name} onClick={() => {
                createPromoMutation.mutate({
                  restaurantId,
                  name: newPromo.name,
                  discountPercent: newPromo.discountPercent,
                  menuItemId: newPromo.menuItemId && newPromo.menuItemId !== "all" ? parseInt(newPromo.menuItemId) : null,
                  targetProfit: newPromo.targetProfit ? parseFloat(newPromo.targetProfit) : null,
                  isActive: true,
                });
              }}>Create Promotion</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {promotions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Active Promotions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {promotions.map((promo) => {
              const item = promo.menuItemId ? menuItems.find((m) => m.id === promo.menuItemId) : null;
              return (
                <div key={promo.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`promotion-${promo.id}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{promo.name}</span>
                      <Badge variant="secondary">
                        <Percent className="h-3 w-3 mr-0.5" />
                        {promo.discountPercent}% off
                      </Badge>
                      {item && <Badge variant="outline">{item.name}</Badge>}
                      {!item && <Badge variant="outline">All Items</Badge>}
                    </div>
                    {promo.targetProfit && (
                      <span className="text-xs text-muted-foreground">Target: £{promo.targetProfit.toLocaleString()}/month</span>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this promotion?")) deletePromoMutation.mutate(promo.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Discount Impact Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Menu Item</Label>
              <Select value={simMenuItem?.toString() || "avg"} onValueChange={(v) => setSimMenuItem(v === "avg" ? null : parseInt(v))}>
                <SelectTrigger data-testid="select-sim-item"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="avg">Average of All Items</SelectItem>
                  {menuItems.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name} (£{m.sellingPrice.toFixed(2)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount: {simDiscount}%</Label>
              <Slider value={[simDiscount]} onValueChange={([v]) => setSimDiscount(v)} min={1} max={50} step={1} className="mt-2" data-testid="slider-sim-discount" />
            </div>
            <div>
              <Label>Monthly Profit Target (£)</Label>
              <Input type="number" value={simTargetProfit} onChange={(e) => setSimTargetProfit(parseInt(e.target.value) || 0)} data-testid="input-sim-target" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Original Price</span>
              <div className="text-lg font-bold" data-testid="text-sim-original">£{simAnalysis.originalPrice.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Discounted Price</span>
              <div className="text-lg font-bold text-primary" data-testid="text-sim-discounted">£{simAnalysis.discountedPrice.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Profit / Serve</span>
              <div className={`text-lg font-bold ${simAnalysis.profitPerServe > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} data-testid="text-sim-profit">
                £{simAnalysis.profitPerServe.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Margin After Discount</span>
              <div className={`text-lg font-bold ${simAnalysis.marginDiscounted > 30 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} data-testid="text-sim-margin">
                {simAnalysis.marginDiscounted.toFixed(1)}%
              </div>
            </div>
          </div>

          {simAnalysis.profitPerServe > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-muted/50 text-center">
                <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Serves Needed (with discount)</span>
                <div className="text-xl font-bold" data-testid="text-sim-serves">{simAnalysis.servesNeeded.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-center">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Serves Needed (no discount)</span>
                <div className="text-xl font-bold">{simAnalysis.originalServesNeeded.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-center">
                <TrendingDown className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Extra Serves Required</span>
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">+{simAnalysis.extraServes.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-md bg-destructive/10 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">Warning: Negative profit per serve</p>
                <p className="text-xs text-muted-foreground">At {simDiscount}% discount, this item would be sold below ingredient cost. Reduce the discount or increase selling price.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Discount Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56" data-testid="chart-discount-scenarios">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discountScenarios} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="discount" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "servesNeeded" ? value.toLocaleString() : `£${value.toFixed(2)}`,
                    name === "servesNeeded" ? "Serves Needed" : name === "profitPerServe" ? "Profit/Serve" : "Price",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="servesNeeded" name="Serves Needed" fill="hsl(24, 95%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
