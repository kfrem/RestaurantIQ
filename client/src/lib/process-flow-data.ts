import type { MonthlyData } from "@shared/schema";

export interface ProcessNode {
  id: string;
  label: string;
  description: string;
  icon: string;
  costKey: keyof MonthlyData | null;
  color: string;
}

export interface ProcessLink {
  source: string;
  target: string;
}

export const processNodes: ProcessNode[] = [
  {
    id: "procurement",
    label: "Procurement",
    description: "Sourcing raw ingredients and supplies",
    icon: "ShoppingCart",
    costKey: "foodCost",
    color: "chart-1",
  },
  {
    id: "storage",
    label: "Storage",
    description: "Inventory management and cold storage",
    icon: "Warehouse",
    costKey: "energyCost",
    color: "chart-2",
  },
  {
    id: "preparation",
    label: "Preparation",
    description: "Prepping ingredients and mise en place",
    icon: "ChefHat",
    costKey: "labourCost",
    color: "chart-3",
  },
  {
    id: "cooking",
    label: "Cooking",
    description: "Main kitchen production line",
    icon: "Flame",
    costKey: "energyCost",
    color: "chart-4",
  },
  {
    id: "service",
    label: "Service",
    description: "Front-of-house delivery to customers",
    icon: "ConciergeBell",
    costKey: "labourCost",
    color: "chart-5",
  },
  {
    id: "waste",
    label: "Waste Mgmt",
    description: "Food waste and disposal handling",
    icon: "Trash2",
    costKey: "wasteCost",
    color: "destructive",
  },
  {
    id: "aftersales",
    label: "After-Sales",
    description: "Customer retention and marketing",
    icon: "Heart",
    costKey: "marketingCost",
    color: "chart-1",
  },
];

export const processLinks: ProcessLink[] = [
  { source: "procurement", target: "storage" },
  { source: "storage", target: "preparation" },
  { source: "preparation", target: "cooking" },
  { source: "cooking", target: "service" },
  { source: "service", target: "waste" },
  { source: "service", target: "aftersales" },
];

export function calculateProcessMetrics(data: MonthlyData | null) {
  if (!data) return null;

  const totalCost = data.foodCost + data.labourCost + data.energyCost +
    data.rentCost + data.marketingCost + data.suppliesCost +
    data.technologyCost + data.wasteCost;
  const grossProfit = data.revenue - totalCost;
  const grossMargin = (grossProfit / data.revenue) * 100;
  const foodCostPct = (data.foodCost / data.revenue) * 100;
  const labourCostPct = (data.labourCost / data.revenue) * 100;
  const energyCostPct = (data.energyCost / data.revenue) * 100;
  const wastePct = (data.wasteCost / data.revenue) * 100;

  return {
    totalCost,
    grossProfit,
    grossMargin,
    foodCostPct,
    labourCostPct,
    energyCostPct,
    wastePct,
    revenue: data.revenue,
  };
}

export function getHealthColor(value: number, thresholds: { good: number; warn: number; bad: number }) {
  if (value <= thresholds.good) return "text-emerald-500";
  if (value <= thresholds.warn) return "text-amber-500";
  return "text-red-500";
}

export function getHealthBg(value: number, thresholds: { good: number; warn: number; bad: number }) {
  if (value <= thresholds.good) return "bg-emerald-500/10 border-emerald-500/20";
  if (value <= thresholds.warn) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}
