import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CostCategory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, ArrowRight, Check, ChefHat, Users, Zap, Building2,
  ShoppingCart, Trash2, Heart, Package, Monitor, Megaphone,
  Truck, GraduationCap, Wrench, Shield, Flame, ConciergeBell,
  Warehouse, TrendingUp, TrendingDown, AlertTriangle, Target,
  Lightbulb, Info, Sparkles,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from "recharts";

const iconMap: Record<string, any> = {
  ShoppingCart, Users, Zap, Building2, Megaphone, Package, Monitor,
  Trash2, Truck, GraduationCap, Wrench, Shield, ChefHat, Flame,
  ConciergeBell, Warehouse, Heart,
};

const CHART_COLORS = [
  "hsl(24, 95%, 53%)", "hsl(32, 88%, 42%)", "hsl(12, 76%, 48%)",
  "hsl(16, 82%, 52%)", "hsl(8, 70%, 55%)", "hsl(40, 85%, 48%)",
  "hsl(0, 72%, 50%)", "hsl(200, 70%, 50%)", "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 50%)", "hsl(340, 70%, 50%)", "hsl(60, 70%, 45%)",
];

const cuisineTypes = [
  "Italian", "British", "Indian", "Chinese", "Japanese", "Mexican",
  "Mediterranean", "American", "French", "Thai", "Korean", "Turkish",
  "Pub & Bar", "Cafe & Bistro", "Fast Casual", "Fine Dining", "Other",
];

interface AssessmentData {
  restaurantName: string;
  cuisineType: string;
  location: string;
  seats: number;
  monthlyRevenue: number;
  dineInPercent: number;
  deliveryPercent: number;
  takeawayPercent: number;
  monthlyCovers: number;
  avgTicket: number;
  activeCosts: Record<number, { enabled: boolean; percentage: number }>;
}

const defaultData: AssessmentData = {
  restaurantName: "",
  cuisineType: "",
  location: "",
  seats: 50,
  monthlyRevenue: 80000,
  dineInPercent: 70,
  deliveryPercent: 18,
  takeawayPercent: 12,
  monthlyCovers: 2000,
  avgTicket: 28,
  activeCosts: {},
};

const STEPS = [
  { label: "Restaurant", icon: Building2 },
  { label: "Revenue", icon: TrendingUp },
  { label: "Cost Items", icon: ShoppingCart },
  { label: "Results", icon: Sparkles },
];

const processStageLabels: Record<string, { label: string; icon: any; color: string }> = {
  procurement: { label: "Procurement", icon: ShoppingCart, color: "bg-chart-1" },
  storage: { label: "Storage", icon: Warehouse, color: "bg-chart-2" },
  preparation: { label: "Preparation", icon: ChefHat, color: "bg-chart-3" },
  cooking: { label: "Cooking", icon: Flame, color: "bg-chart-4" },
  service: { label: "Service", icon: ConciergeBell, color: "bg-chart-5" },
  waste: { label: "Waste Mgmt", icon: Trash2, color: "bg-destructive" },
  aftersales: { label: "After-Sales", icon: Heart, color: "bg-chart-1" },
  fixed: { label: "Fixed Costs", icon: Building2, color: "bg-muted-foreground" },
};

export default function QuickAssessment() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AssessmentData>(defaultData);

  const { data: costCategories, isLoading } = useQuery<CostCategory[]>({
    queryKey: ["/api/cost-categories"],
  });

  useEffect(() => {
    if (!costCategories || costCategories.length === 0) return;
    if (Object.keys(data.activeCosts).length > 0) return;
    const costs: Record<number, { enabled: boolean; percentage: number }> = {};
    costCategories.forEach((cat) => {
      costs[cat.id] = { enabled: cat.isDefault, percentage: cat.defaultPercentage };
    });
    setData((prev) => ({ ...prev, activeCosts: costs }));
  }, [costCategories]);

  const totalCostPercent = useMemo(() => {
    return Object.values(data.activeCosts).reduce(
      (sum, c) => sum + (c.enabled ? c.percentage : 0), 0
    );
  }, [data.activeCosts]);

  const computed = useMemo(() => {
    const rev = data.monthlyRevenue;
    const totalCost = rev * (totalCostPercent / 100);
    const profit = rev - totalCost;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    const weeklyRevenue = rev / 4.345;
    const weeklyProfit = profit / 4.345;
    const weeklyCovers = data.monthlyCovers / 4.345;

    const costBreakdown = costCategories
      ?.filter((c) => data.activeCosts[c.id]?.enabled)
      .map((c) => ({
        name: c.name.replace(/ & .*/, "").replace(/ .*/, ""),
        value: rev * (data.activeCosts[c.id].percentage / 100),
        percentage: data.activeCosts[c.id].percentage,
        key: c.key,
        stage: c.processStage,
      })) || [];

    const stageMap: Record<string, number> = {};
    costBreakdown.forEach((c) => {
      stageMap[c.stage] = (stageMap[c.stage] || 0) + c.value;
    });

    return {
      totalCost, profit, margin, weeklyRevenue, weeklyProfit, weeklyCovers,
      costBreakdown, stageMap,
      dineInRevenue: rev * (data.dineInPercent / 100),
      deliveryRevenue: rev * (data.deliveryPercent / 100),
      takeawayRevenue: rev * (data.takeawayPercent / 100),
    };
  }, [data, totalCostPercent, costCategories]);

  const recommendations = useMemo(() => {
    const recs: { title: string; saving: number; desc: string; icon: any }[] = [];
    if (!costCategories) return recs;

    costCategories.forEach((cat) => {
      const costInfo = data.activeCosts[cat.id];
      if (!costInfo?.enabled) return;

      if (cat.key === "foodCost" && costInfo.percentage > 32) {
        recs.push({
          title: "Reduce food cost percentage",
          saving: Math.round(data.monthlyRevenue * ((costInfo.percentage - 30) / 100)),
          desc: `Food cost at ${costInfo.percentage}% is above the 28-32% target. Consider supplier renegotiation and portion control.`,
          icon: ShoppingCart,
        });
      }
      if (cat.key === "labourCost" && costInfo.percentage > 30) {
        recs.push({
          title: "Optimise staff scheduling",
          saving: Math.round(data.monthlyRevenue * ((costInfo.percentage - 28) / 100)),
          desc: `Labour at ${costInfo.percentage}% exceeds 25-30% benchmark. Smart scheduling could save significantly.`,
          icon: Users,
        });
      }
      if (cat.key === "energyCost" && costInfo.percentage > 8) {
        recs.push({
          title: "Cut energy consumption",
          saving: Math.round(data.monthlyRevenue * costInfo.percentage * 0.0015),
          desc: `Energy at ${costInfo.percentage}% is above the 5-8% target. Energy-efficient equipment and power schedules help.`,
          icon: Zap,
        });
      }
      if (cat.key === "wasteCost" && costInfo.percentage > 3) {
        recs.push({
          title: "Reduce food waste",
          saving: Math.round(data.monthlyRevenue * costInfo.percentage * 0.003),
          desc: `Waste at ${costInfo.percentage}% can be improved. FIFO inventory and daily waste tracking are effective.`,
          icon: Trash2,
        });
      }
    });

    if (computed.margin < 55) {
      recs.push({
        title: "Menu engineering opportunity",
        saving: Math.round(data.monthlyRevenue * 0.02),
        desc: "Analyse dishes by popularity and profitability. Remove low-margin items, promote high-margin stars.",
        icon: Lightbulb,
      });
    }
    if (data.deliveryPercent < 15) {
      recs.push({
        title: "Grow delivery channel",
        saving: Math.round(data.monthlyRevenue * 0.04),
        desc: "Delivery revenue is low. Partnering with platforms and creating delivery-optimised items could boost revenue.",
        icon: Truck,
      });
    }

    return recs;
  }, [data, costCategories, computed.margin]);

  const totalSaving = recommendations.reduce((s, r) => s + r.saving, 0);

  function updateField<K extends keyof AssessmentData>(key: K, value: AssessmentData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCost(catId: number, enabled: boolean) {
    setData((prev) => ({
      ...prev,
      activeCosts: {
        ...prev.activeCosts,
        [catId]: { ...prev.activeCosts[catId], enabled },
      },
    }));
  }

  function setCostPercent(catId: number, percentage: number) {
    setData((prev) => ({
      ...prev,
      activeCosts: {
        ...prev.activeCosts,
        [catId]: { ...prev.activeCosts[catId], percentage },
      },
    }));
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-auto h-full" data-testid="page-quick-assessment">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quick Assessment</h1>
          <p className="text-sm text-muted-foreground">
            Walk through a client's business in minutes and show instant insights
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2" data-testid="progress-steps">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-1 sm:gap-2 flex-1">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors w-full justify-center ${
                    isActive ? "bg-primary text-primary-foreground" :
                    isDone ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`step-${i}`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 shrink-0" /> : <StepIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-2 sm:w-4 shrink-0 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {step === 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Restaurant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Restaurant Name</label>
                <Input
                  value={data.restaurantName}
                  onChange={(e) => updateField("restaurantName", e.target.value)}
                  placeholder="e.g. The Golden Fork"
                  data-testid="input-assessment-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisine Type</label>
                <Select value={data.cuisineType} onValueChange={(v) => updateField("cuisineType", v)}>
                  <SelectTrigger data-testid="select-assessment-cuisine">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={data.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. Manchester, City Centre"
                  data-testid="input-assessment-location"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Seating Capacity</label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[data.seats]}
                    onValueChange={([v]) => updateField("seats", v)}
                    min={10} max={300} step={5}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="tabular-nums min-w-12 justify-center">{data.seats}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Revenue & Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Monthly Revenue</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">£</span>
                    <Slider
                      value={[data.monthlyRevenue]}
                      onValueChange={([v]) => updateField("monthlyRevenue", v)}
                      min={10000} max={500000} step={5000}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="tabular-nums min-w-20 justify-center">
                      £{(data.monthlyRevenue / 1000).toFixed(0)}k
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Covers</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[data.monthlyCovers]}
                      onValueChange={([v]) => updateField("monthlyCovers", v)}
                      min={100} max={10000} step={50}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="tabular-nums min-w-16 justify-center">
                      {data.monthlyCovers.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Avg Ticket Size</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">£</span>
                    <Slider
                      value={[data.avgTicket]}
                      onValueChange={([v]) => updateField("avgTicket", v)}
                      min={5} max={150} step={1}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="tabular-nums min-w-16 justify-center">
                      £{data.avgTicket}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Revenue Split</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "dineInPercent" as const, label: "Dine-In" },
                  { key: "deliveryPercent" as const, label: "Delivery" },
                  { key: "takeawayPercent" as const, label: "Takeaway" },
                ].map((ch) => (
                  <div key={ch.key} className="flex items-center gap-3">
                    <span className="text-sm w-20 shrink-0">{ch.label}</span>
                    <Slider
                      value={[data[ch.key]]}
                      onValueChange={([v]) => updateField(ch.key, v)}
                      min={0} max={100} step={1}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="tabular-nums min-w-12 justify-center">{data[ch.key]}%</Badge>
                  </div>
                ))}
                {data.dineInPercent + data.deliveryPercent + data.takeawayPercent !== 100 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Revenue split should total 100% (currently {data.dineInPercent + data.deliveryPercent + data.takeawayPercent}%)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cost Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Toggle which costs apply and adjust the percentage of revenue
                </p>
                <div className="space-y-3">
                  {costCategories?.map((cat) => {
                    const costInfo = data.activeCosts[cat.id];
                    if (!costInfo) return null;
                    const Icon = iconMap[cat.icon] || Package;
                    return (
                      <div
                        key={cat.id}
                        className={`p-3 rounded-md border transition-colors ${costInfo.enabled ? "bg-background" : "bg-muted/30 opacity-60"}`}
                        data-testid={`cost-item-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={costInfo.enabled}
                            onCheckedChange={(v) => toggleCost(cat.id, v)}
                            data-testid={`switch-cost-${cat.id}`}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{cat.name}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-48">{cat.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Slider
                              value={[costInfo.percentage]}
                              onValueChange={([v]) => setCostPercent(cat.id, v)}
                              min={0} max={50} step={0.5}
                              disabled={!costInfo.enabled}
                              className="w-24 sm:w-32"
                            />
                            <Badge
                              variant={costInfo.enabled ? "default" : "secondary"}
                              className="tabular-nums min-w-12 justify-center"
                            >
                              {costInfo.percentage}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 rounded-md bg-muted/50 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium">Total Cost %</span>
                  <Badge
                    variant={totalCostPercent > 85 ? "destructive" : totalCostPercent > 70 ? "default" : "secondary"}
                    className="tabular-nums"
                  >
                    {totalCostPercent.toFixed(1)}% of revenue
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {data.restaurantName && (
                <Badge variant="outline" className="text-sm">{data.restaurantName}</Badge>
              )}
              {data.cuisineType && (
                <Badge variant="secondary" className="text-sm">{data.cuisineType}</Badge>
              )}
              {data.location && (
                <Badge variant="outline" className="text-sm">{data.location}</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card data-testid="card-result-revenue">
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Monthly Revenue</span>
                  <div className="text-lg sm:text-xl font-bold mt-0.5">£{(data.monthlyRevenue / 1000).toFixed(0)}k</div>
                </CardContent>
              </Card>
              <Card data-testid="card-result-profit">
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Monthly Profit</span>
                  <div className={`text-lg sm:text-xl font-bold mt-0.5 ${computed.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    £{(computed.profit / 1000).toFixed(1)}k
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-result-margin">
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Margin</span>
                  <div className={`text-lg sm:text-xl font-bold mt-0.5 ${
                    computed.margin >= 15 ? "text-emerald-600 dark:text-emerald-400" :
                    computed.margin >= 5 ? "text-amber-600 dark:text-amber-400" : "text-red-500"
                  }`}>
                    {computed.margin.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-result-weekly-profit">
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Weekly Profit</span>
                  <div className={`text-lg sm:text-xl font-bold mt-0.5 ${computed.weeklyProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    £{(computed.weeklyProfit / 1000).toFixed(1)}k
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Weekly Revenue</span>
                  <div className="text-base font-bold mt-0.5">£{Math.round(computed.weeklyRevenue).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Weekly Covers</span>
                  <div className="text-base font-bold mt-0.5">{Math.round(computed.weeklyCovers)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <span className="text-xs text-muted-foreground">Total Costs</span>
                  <div className="text-base font-bold mt-0.5">{totalCostPercent.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Process Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(processStageLabels)
                    .filter(([stage]) => stage !== "fixed")
                    .map(([stage, info], idx, arr) => {
                      const stageCost = computed.stageMap[stage] || 0;
                      const pct = data.monthlyRevenue > 0 ? (stageCost / data.monthlyRevenue) * 100 : 0;
                      const StageIcon = info.icon;
                      return (
                        <div key={stage}>
                          <div className="flex items-center gap-3 p-2 rounded-md border" data-testid={`flow-stage-${stage}`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${info.color}`}>
                              <StageIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{info.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">
                                    £{Math.round(stageCost).toLocaleString()}
                                  </span>
                                  {pct > 0 && (
                                    <Badge variant="secondary" className="text-xs">{pct.toFixed(1)}%</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${info.color} transition-all`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                          {idx < arr.length - 1 && stage !== "waste" && (
                            <div className="flex justify-center">
                              <div className="w-0.5 h-2 bg-border" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    {computed.costBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={computed.costBreakdown}
                            cx="50%" cy="50%"
                            innerRadius={40} outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {computed.costBreakdown.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number, name: string) => [`£${Math.round(value).toLocaleString()}`, name]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Enable cost items to see breakdown
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Revenue Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Dine-In", value: computed.dineInRevenue },
                          { name: "Delivery", value: computed.deliveryRevenue },
                          { name: "Takeaway", value: computed.takeawayRevenue },
                        ]}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          formatter={(value: number) => [`£${Math.round(value).toLocaleString()}`, ""]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {[0, 1, 2].map((i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Instant Recommendations
                    <Badge variant="secondary" className="ml-auto tabular-nums">
                      Potential saving: £{totalSaving.toLocaleString()}/mo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.map((rec, i) => {
                    const Icon = rec.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`recommendation-${i}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-medium">{rec.title}</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              £{rec.saving.toLocaleString()}/mo
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{rec.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 pb-4">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              data-testid="button-next-step"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => { setStep(0); setData(defaultData); }}
              data-testid="button-start-over"
            >
              Start Over
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
