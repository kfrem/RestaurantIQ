import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MonthlyData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RotateCcw, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from "recharts";

interface Scenario {
  foodCostChange: number;
  labourCostChange: number;
  energyCostChange: number;
  wasteReduction: number;
  deliveryIncrease: number;
  priceIncrease: number;
  coverIncrease: number;
  marketingChange: number;
}

const defaultScenario: Scenario = {
  foodCostChange: 0,
  labourCostChange: 0,
  energyCostChange: 0,
  wasteReduction: 0,
  deliveryIncrease: 0,
  priceIncrease: 0,
  coverIncrease: 0,
  marketingChange: 0,
};

const sliderConfig = [
  { key: "foodCostChange" as keyof Scenario, label: "Ingredient Cost Change", min: -30, max: 30, unit: "%", description: "Adjust raw material costs" },
  { key: "labourCostChange" as keyof Scenario, label: "Labour Cost Change", min: -30, max: 30, unit: "%", description: "Staff cost adjustments" },
  { key: "energyCostChange" as keyof Scenario, label: "Energy Cost Change", min: -30, max: 30, unit: "%", description: "Utilities and energy" },
  { key: "wasteReduction" as keyof Scenario, label: "Waste Reduction", min: 0, max: 50, unit: "%", description: "Reduce food waste" },
  { key: "deliveryIncrease" as keyof Scenario, label: "Delivery Revenue Change", min: -30, max: 50, unit: "%", description: "Online delivery growth" },
  { key: "priceIncrease" as keyof Scenario, label: "Menu Price Change", min: -15, max: 25, unit: "%", description: "Average menu price adjustment" },
  { key: "coverIncrease" as keyof Scenario, label: "Customer Volume Change", min: -20, max: 30, unit: "%", description: "Number of covers" },
  { key: "marketingChange" as keyof Scenario, label: "Marketing Spend Change", min: -50, max: 100, unit: "%", description: "Marketing budget adjustment" },
];

function simulateScenario(data: MonthlyData, scenario: Scenario) {
  const newFoodCost = data.foodCost * (1 + scenario.foodCostChange / 100);
  const newLabourCost = data.labourCost * (1 + scenario.labourCostChange / 100);
  const newEnergyCost = data.energyCost * (1 + scenario.energyCostChange / 100);
  const newWasteCost = data.wasteCost * (1 - scenario.wasteReduction / 100);
  const newMarketingCost = data.marketingCost * (1 + scenario.marketingChange / 100);

  const newDeliveryRevenue = data.deliveryRevenue * (1 + scenario.deliveryIncrease / 100);
  const priceFactor = 1 + scenario.priceIncrease / 100;
  const coverFactor = 1 + scenario.coverIncrease / 100;
  const newDineInRevenue = data.dineInRevenue * priceFactor * coverFactor;
  const newTakeawayRevenue = data.takeawayRevenue * priceFactor * coverFactor;

  const newRevenue = newDineInRevenue + newDeliveryRevenue + newTakeawayRevenue;
  const newTotalCost = newFoodCost + newLabourCost + newEnergyCost +
    data.rentCost + newMarketingCost + data.suppliesCost +
    data.technologyCost + newWasteCost;

  const originalTotalCost = data.foodCost + data.labourCost + data.energyCost +
    data.rentCost + data.marketingCost + data.suppliesCost +
    data.technologyCost + data.wasteCost;

  const originalProfit = data.revenue - originalTotalCost;
  const newProfit = newRevenue - newTotalCost;
  const originalMargin = (originalProfit / data.revenue) * 100;
  const newMargin = (newProfit / newRevenue) * 100;

  return {
    originalRevenue: data.revenue,
    newRevenue,
    originalCost: originalTotalCost,
    newCost: newTotalCost,
    originalProfit,
    newProfit,
    originalMargin,
    newMargin,
    profitChange: newProfit - originalProfit,
    marginChange: newMargin - originalMargin,
    costBreakdown: [
      { name: "Food", original: data.foodCost, simulated: newFoodCost },
      { name: "Labour", original: data.labourCost, simulated: newLabourCost },
      { name: "Energy", original: data.energyCost, simulated: newEnergyCost },
      { name: "Rent", original: data.rentCost, simulated: data.rentCost },
      { name: "Marketing", original: data.marketingCost, simulated: newMarketingCost },
      { name: "Waste", original: data.wasteCost, simulated: newWasteCost },
    ],
  };
}

export default function Simulator() {
  const [scenario, setScenario] = useState<Scenario>(defaultScenario);

  const { data: monthlyDataList, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const latestData = monthlyDataList && monthlyDataList.length > 0
    ? monthlyDataList[monthlyDataList.length - 1] : null;

  const results = latestData ? simulateScenario(latestData, scenario) : null;

  const hasChanges = Object.values(scenario).some((v) => v !== 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-simulator">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">What-If Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Model hypothetical scenarios and see their impact on your bottom line instantly
          </p>
        </div>
        {hasChanges && (
          <Button
            variant="outline"
            onClick={() => setScenario(defaultScenario)}
            data-testid="button-reset-scenario"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Scenario Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {sliderConfig.map((config) => (
                <div key={config.key} className="space-y-2" data-testid={`slider-${config.key}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">{config.description}</span>
                    </div>
                    <Badge
                      variant={scenario[config.key] === 0 ? "secondary" : "default"}
                      className="tabular-nums min-w-14 justify-center"
                    >
                      {scenario[config.key] > 0 ? "+" : ""}{scenario[config.key]}{config.unit}
                    </Badge>
                  </div>
                  <Slider
                    value={[scenario[config.key]]}
                    onValueChange={([val]) => setScenario((prev) => ({ ...prev, [config.key]: val }))}
                    min={config.min}
                    max={config.max}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{config.min}{config.unit}</span>
                    <span>{config.max}{config.unit}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {results && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card data-testid="card-simulated-revenue">
                  <CardContent className="p-4 text-center">
                    <span className="text-xs text-muted-foreground font-medium">Simulated Revenue</span>
                    <div className="text-2xl font-bold mt-1">
                      £{(results.newRevenue / 1000).toFixed(1)}k
                    </div>
                    <div className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 ${
                      results.newRevenue >= results.originalRevenue
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}>
                      {results.newRevenue >= results.originalRevenue ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {((results.newRevenue - results.originalRevenue) / results.originalRevenue * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-simulated-profit">
                  <CardContent className="p-4 text-center">
                    <span className="text-xs text-muted-foreground font-medium">Simulated Profit</span>
                    <div className={`text-2xl font-bold mt-1 ${
                      results.newProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}>
                      £{(results.newProfit / 1000).toFixed(1)}k
                    </div>
                    <div className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 ${
                      results.profitChange >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}>
                      {results.profitChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      £{Math.abs(results.profitChange).toLocaleString()} {results.profitChange >= 0 ? "gain" : "loss"}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-simulated-margin">
                  <CardContent className="p-4 text-center">
                    <span className="text-xs text-muted-foreground font-medium">Simulated Margin</span>
                    <div className={`text-2xl font-bold mt-1 ${
                      results.newMargin >= results.originalMargin
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}>
                      {results.newMargin.toFixed(1)}%
                    </div>
                    <div className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 ${
                      results.marginChange >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}>
                      {results.marginChange >= 0 ? "+" : ""}{results.marginChange.toFixed(1)} pts
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Before vs After Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72" data-testid="chart-simulation-comparison">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.costBreakdown} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => [`£${value.toLocaleString()}`, ""]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="original" fill="hsl(var(--muted-foreground))" name="Current" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="simulated" fill="hsl(24, 95%, 53%)" name="Simulated" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <div className="text-sm text-muted-foreground">Revenue</div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className="text-sm">
                        £{results.originalRevenue.toLocaleString()} <ArrowRight className="h-3 w-3 inline mx-1" /> £{results.newRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <div className="text-sm text-muted-foreground">Total Costs</div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className="text-sm">
                        £{results.originalCost.toLocaleString()} <ArrowRight className="h-3 w-3 inline mx-1" /> £{Math.round(results.newCost).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <div className="text-sm text-muted-foreground">Profit</div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className={`text-sm font-semibold ${results.profitChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {results.profitChange >= 0 ? "+" : ""}£{Math.round(results.profitChange).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <div className="text-sm text-muted-foreground">Margin</div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className={`text-sm font-semibold ${results.marginChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {results.marginChange >= 0 ? "+" : ""}{results.marginChange.toFixed(1)} percentage points
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!latestData && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No data to simulate</p>
                  <p className="text-sm mt-1">Add monthly financial data first to use the simulator</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
