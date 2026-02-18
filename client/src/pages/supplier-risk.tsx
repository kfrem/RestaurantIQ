import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Supplier, Ingredient, SupplierIngredient } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, AlertTriangle, Shield, ShieldAlert, ShieldCheck,
  Truck, Package, Link2, ArrowUpRight, ArrowDownRight, Users,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

export default function SupplierRisk() {
  const { toast } = useToast();
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkSupplierId, setLinkSupplierId] = useState<number | null>(null);
  const [newSupplier, setNewSupplier] = useState({ name: "", contactInfo: "", category: "general" });
  const [newIngredient, setNewIngredient] = useState({ name: "", unit: "kg", currentPrice: "", category: "general", classification: "direct" });
  const [linkIngredientId, setLinkIngredientId] = useState("");
  const [linkPrice, setLinkPrice] = useState("");

  const { data: restaurant } = useQuery<any>({ queryKey: ["/api/restaurants/current"] });
  const restaurantId = restaurant?.id || 1;

  const { data: allSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", restaurantId],
  });
  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients", restaurantId],
  });

  const supplierIngQueries = useQuery<Record<number, SupplierIngredient[]>>({
    queryKey: ["/api/all-supplier-ingredients", restaurantId],
    queryFn: async () => {
      const result: Record<number, SupplierIngredient[]> = {};
      for (const s of allSuppliers) {
        const res = await fetch(`/api/supplier-ingredients/${s.id}`);
        result[s.id] = await res.json();
      }
      return result;
    },
    enabled: allSuppliers.length > 0,
  });

  const supplierIngs = supplierIngQueries.data || {};

  const riskAnalysis = useMemo(() => {
    const ingredientSupplierCount: Record<number, number> = {};
    const ingredientSuppliers: Record<number, number[]> = {};

    for (const [sId, links] of Object.entries(supplierIngs)) {
      for (const link of links) {
        ingredientSupplierCount[link.ingredientId] = (ingredientSupplierCount[link.ingredientId] || 0) + 1;
        if (!ingredientSuppliers[link.ingredientId]) ingredientSuppliers[link.ingredientId] = [];
        ingredientSuppliers[link.ingredientId].push(parseInt(sId));
      }
    }

    const singleSourceIngredients = allIngredients.filter((ing) => ingredientSupplierCount[ing.id] === 1);
    const noSupplierIngredients = allIngredients.filter((ing) => !ingredientSupplierCount[ing.id]);
    const multiSourceIngredients = allIngredients.filter((ing) => (ingredientSupplierCount[ing.id] || 0) >= 2);

    const supplierRisk = allSuppliers.map((s) => {
      const links = supplierIngs[s.id] || [];
      const controlledIngredients = links.length;
      const singleSourceCount = links.filter((l) => ingredientSupplierCount[l.ingredientId] === 1).length;
      const totalIngredients = allIngredients.length || 1;
      const controlPercent = (controlledIngredients / totalIngredients) * 100;
      const riskScore = singleSourceCount * 2 + controlPercent / 10;
      return {
        ...s,
        controlledIngredients,
        singleSourceCount,
        controlPercent,
        riskScore,
        riskLevel: riskScore > 5 ? "high" : riskScore > 2 ? "medium" : "low",
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const priceChanges = allIngredients
      .filter((i) => i.previousPrice && i.previousPrice > 0)
      .map((i) => ({
        ...i,
        changePercent: ((i.currentPrice - (i.previousPrice || 0)) / (i.previousPrice || 1)) * 100,
        supplierCount: ingredientSupplierCount[i.id] || 0,
      }))
      .sort((a, b) => b.changePercent - a.changePercent);

    return { singleSourceIngredients, noSupplierIngredients, multiSourceIngredients, supplierRisk, priceChanges, ingredientSupplierCount };
  }, [allSuppliers, allIngredients, supplierIngs]);

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      setShowAddSupplier(false);
      setNewSupplier({ name: "", contactInfo: "", category: "general" });
      toast({ title: "Supplier added" });
    },
  });

  const createIngredientMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ingredients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients", restaurantId] });
      setShowAddIngredient(false);
      setNewIngredient({ name: "", unit: "kg", currentPrice: "", category: "general", classification: "direct" });
      toast({ title: "Ingredient added" });
    },
  });

  const linkSupplierIngMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/supplier-ingredients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-supplier-ingredients", restaurantId] });
      setShowLinkDialog(false);
      setLinkIngredientId("");
      setLinkPrice("");
      toast({ title: "Ingredient linked to supplier" });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-supplier-ingredients", restaurantId] });
      toast({ title: "Supplier deleted" });
    },
  });

  const riskPieData = [
    { name: "Single Source", value: riskAnalysis.singleSourceIngredients.length, color: "hsl(0, 72%, 50%)" },
    { name: "Multi Source", value: riskAnalysis.multiSourceIngredients.length, color: "hsl(142, 71%, 45%)" },
    { name: "No Supplier", value: riskAnalysis.noSupplierIngredients.length, color: "hsl(45, 93%, 47%)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-supplier-risk">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Supplier Risk Assessment</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor supplier dependencies and identify supply chain risks</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddIngredient} onOpenChange={setShowAddIngredient}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-ingredient">
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Ingredient</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input data-testid="input-ingredient-name" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Unit</Label>
                    <Select value={newIngredient.unit} onValueChange={(v) => setNewIngredient({ ...newIngredient, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="litre">litre</SelectItem>
                        <SelectItem value="pack">pack</SelectItem>
                        <SelectItem value="unit">unit</SelectItem>
                        <SelectItem value="dozen">dozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price per Unit (£)</Label>
                    <Input type="number" step="0.01" value={newIngredient.currentPrice} onChange={(e) => setNewIngredient({ ...newIngredient, currentPrice: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={newIngredient.category} onValueChange={(v) => setNewIngredient({ ...newIngredient, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="protein">Protein</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="seafood">Seafood</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="oils">Oils</SelectItem>
                        <SelectItem value="spices">Spices</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Classification</Label>
                    <Select value={newIngredient.classification} onValueChange={(v) => setNewIngredient({ ...newIngredient, classification: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="indirect">Indirect</SelectItem>
                        <SelectItem value="overhead">Overhead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" disabled={!newIngredient.name || !newIngredient.currentPrice} onClick={() => {
                  createIngredientMutation.mutate({
                    restaurantId, name: newIngredient.name, unit: newIngredient.unit,
                    currentPrice: parseFloat(newIngredient.currentPrice), previousPrice: null,
                    category: newIngredient.category, classification: newIngredient.classification,
                  });
                }}>Save Ingredient</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input data-testid="input-supplier-name" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                </div>
                <div>
                  <Label>Contact</Label>
                  <Input value={newSupplier.contactInfo} onChange={(e) => setNewSupplier({ ...newSupplier, contactInfo: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newSupplier.category} onValueChange={(v) => setNewSupplier({ ...newSupplier, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produce">Produce</SelectItem>
                      <SelectItem value="protein">Protein</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="seafood">Seafood</SelectItem>
                      <SelectItem value="specialty">Specialty</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={!newSupplier.name} onClick={() => {
                  createSupplierMutation.mutate({ restaurantId, name: newSupplier.name, contactInfo: newSupplier.contactInfo || null, category: newSupplier.category, isActive: true });
                }}>Save Supplier</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold" data-testid="text-total-suppliers">{allSuppliers.length}</div>
            <span className="text-xs text-muted-foreground">Total Suppliers</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold" data-testid="text-total-ingredients">{allIngredients.length}</div>
            <span className="text-xs text-muted-foreground">Total Ingredients</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShieldAlert className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold text-red-500" data-testid="text-single-source">{riskAnalysis.singleSourceIngredients.length}</div>
            <span className="text-xs text-muted-foreground">Single-Source Items</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-multi-source">{riskAnalysis.multiSourceIngredients.length}</div>
            <span className="text-xs text-muted-foreground">Multi-Source Items</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Supplier Risk Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskAnalysis.supplierRisk.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`supplier-risk-${s.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{s.name}</span>
                    <Badge variant={s.riskLevel === "high" ? "destructive" : s.riskLevel === "medium" ? "outline" : "secondary"}>
                      {s.riskLevel === "high" ? "High Risk" : s.riskLevel === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.controlledIngredients} ingredients ({s.controlPercent.toFixed(0)}% of total) | {s.singleSourceCount} sole-source
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setLinkSupplierId(s.id); setShowLinkDialog(true); }} data-testid={`button-link-supplier-${s.id}`}>
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this supplier?")) deleteSupplierMutation.mutate(s.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {allSuppliers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No suppliers added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ingredient Source Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            {riskPieData.length > 0 ? (
              <div className="h-48" data-testid="chart-risk-pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                      {riskPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Link ingredients to suppliers to see coverage</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Price Inflation Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {riskAnalysis.priceChanges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No price history data available</p>
            )}
            {riskAnalysis.priceChanges.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`price-alert-${item.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.supplierCount <= 1 && (
                      <Badge variant="destructive" className="text-[10px]">Single Source</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    £{item.previousPrice?.toFixed(2)} / {item.unit} → £{item.currentPrice.toFixed(2)} / {item.unit}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.changePercent > 0 ? (
                    <Badge variant={item.changePercent > 10 ? "destructive" : "outline"} className="flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      +{item.changePercent.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-0.5">
                      <ArrowDownRight className="h-3 w-3" />
                      {item.changePercent.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Ingredient to Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ingredient</Label>
              <Select value={linkIngredientId} onValueChange={setLinkIngredientId}>
                <SelectTrigger><SelectValue placeholder="Select ingredient" /></SelectTrigger>
                <SelectContent>
                  {allIngredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id.toString()}>{ing.name} (£{ing.currentPrice.toFixed(2)}/{ing.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit Price (£)</Label>
              <Input type="number" step="0.01" value={linkPrice} onChange={(e) => setLinkPrice(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!linkIngredientId || !linkPrice} onClick={() => {
              linkSupplierIngMutation.mutate({
                supplierId: linkSupplierId,
                ingredientId: parseInt(linkIngredientId),
                unitPrice: parseFloat(linkPrice),
                isPreferred: false,
                leadTimeDays: null,
              });
            }}>Link Ingredient</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
