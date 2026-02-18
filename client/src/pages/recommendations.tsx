import { useQuery } from "@tanstack/react-query";
import type { MonthlyData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingCart, Users, Zap, Trash2, TrendingUp, Target,
  Lightbulb, AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: "cost" | "revenue" | "efficiency" | "retention";
  impact: "high" | "medium" | "low";
  estimatedSaving: number;
  icon: any;
  action: string;
}

function generateRecommendations(data: MonthlyData): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const totalCost = data.foodCost + data.labourCost + data.energyCost +
    data.rentCost + data.marketingCost + data.suppliesCost +
    data.technologyCost + data.wasteCost;

  const foodPct = (data.foodCost / data.revenue) * 100;
  const labourPct = (data.labourCost / data.revenue) * 100;
  const energyPct = (data.energyCost / data.revenue) * 100;
  const wastePct = (data.wasteCost / data.revenue) * 100;
  const margin = ((data.revenue - totalCost) / data.revenue) * 100;

  if (foodPct > 32) {
    const savingTarget = data.foodCost * ((foodPct - 30) / 100);
    recommendations.push({
      id: "food-cost",
      title: "Reduce Food Cost Percentage",
      description: `Your food cost is at ${foodPct.toFixed(1)}%, above the industry target of 28-32%. Consider renegotiating supplier contracts, reviewing portion sizes, or sourcing seasonal ingredients.`,
      category: "cost",
      impact: "high",
      estimatedSaving: Math.round(savingTarget),
      icon: ShoppingCart,
      action: "Review top 10 ingredient costs and find 2-3 alternatives",
    });
  }

  if (labourPct > 30) {
    const savingTarget = data.labourCost * ((labourPct - 28) / 100);
    recommendations.push({
      id: "labour-cost",
      title: "Optimise Labour Scheduling",
      description: `Labour costs at ${labourPct.toFixed(1)}% exceed the 25-30% target. Implement smart scheduling based on peak hours, consider cross-training staff, or adopt table management technology.`,
      category: "efficiency",
      impact: "high",
      estimatedSaving: Math.round(savingTarget),
      icon: Users,
      action: "Analyse peak hours and adjust shift patterns",
    });
  }

  if (energyPct > 8) {
    const savingTarget = data.energyCost * 0.15;
    recommendations.push({
      id: "energy-cost",
      title: "Reduce Energy Consumption",
      description: `Energy costs at ${energyPct.toFixed(1)}% are above the 5-8% benchmark. Consider energy-efficient equipment, LED lighting, smart thermostats, and scheduled equipment shutdowns.`,
      category: "cost",
      impact: "medium",
      estimatedSaving: Math.round(savingTarget),
      icon: Zap,
      action: "Audit equipment usage and implement power schedules",
    });
  }

  if (wastePct > 3) {
    const savingTarget = data.wasteCost * 0.3;
    recommendations.push({
      id: "waste-reduction",
      title: "Implement Waste Reduction Programme",
      description: `Food waste at ${wastePct.toFixed(1)}% can be reduced. Use FIFO inventory management, track waste daily, optimise menu to use shared ingredients, and consider composting partnerships.`,
      category: "efficiency",
      impact: "medium",
      estimatedSaving: Math.round(savingTarget),
      icon: Trash2,
      action: "Start daily waste tracking and identify top waste items",
    });
  }

  if (data.deliveryRevenue < data.dineInRevenue * 0.2) {
    recommendations.push({
      id: "delivery-growth",
      title: "Grow Online Delivery Channel",
      description: "Your delivery revenue is below 20% of dine-in. Consider partnering with delivery platforms, creating delivery-optimised menu items, and running targeted promotions.",
      category: "revenue",
      impact: "high",
      estimatedSaving: Math.round(data.revenue * 0.05),
      icon: TrendingUp,
      action: "Sign up for 1-2 delivery platforms and create a delivery menu",
    });
  }

  if (data.repeatCustomerRate < 35) {
    recommendations.push({
      id: "customer-retention",
      title: "Boost Customer Retention",
      description: `Repeat customer rate at ${data.repeatCustomerRate.toFixed(0)}% can be improved. Implement a loyalty programme, collect customer feedback, and send personalised offers.`,
      category: "retention",
      impact: "medium",
      estimatedSaving: Math.round(data.revenue * 0.03),
      icon: Target,
      action: "Launch a simple loyalty card or digital rewards programme",
    });
  }

  if (margin < 55) {
    recommendations.push({
      id: "menu-engineering",
      title: "Menu Engineering Opportunity",
      description: "Analyse your menu items by popularity and profitability. Remove low-margin, low-popularity items and promote high-margin dishes through strategic placement and specials.",
      category: "revenue",
      impact: "medium",
      estimatedSaving: Math.round(data.revenue * 0.02),
      icon: Lightbulb,
      action: "Categorise all menu items into Stars, Puzzles, Plowhorses, and Dogs",
    });
  }

  if (data.avgTicketSize < 25) {
    recommendations.push({
      id: "upselling",
      title: "Increase Average Ticket Size",
      description: `Average ticket at £${data.avgTicketSize.toFixed(2)} has growth potential. Train staff on upselling techniques, add combo deals, and introduce premium sides or desserts.`,
      category: "revenue",
      impact: "medium",
      estimatedSaving: Math.round(data.totalCovers * 3),
      icon: TrendingUp,
      action: "Create 3 suggested pairings for top dishes and train staff",
    });
  }

  return recommendations;
}

const impactColors: Record<string, string> = {
  high: "text-red-500 bg-red-500/10",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  low: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
};

const categoryLabels: Record<string, string> = {
  cost: "Cost Reduction",
  revenue: "Revenue Growth",
  efficiency: "Efficiency",
  retention: "Customer Retention",
};

export default function Recommendations() {
  const { data: monthlyDataList, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const latestData = monthlyDataList && monthlyDataList.length > 0
    ? monthlyDataList[monthlyDataList.length - 1] : null;

  const recommendations = latestData ? generateRecommendations(latestData) : [];
  const totalSavings = recommendations.reduce((sum, r) => sum + r.estimatedSaving, 0);
  const highImpactCount = recommendations.filter((r) => r.impact === "high").length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-recommendations">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Smart Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Data-driven suggestions to improve your margins and efficiency
        </p>
      </div>

      {recommendations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card data-testid="card-total-savings">
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground font-medium">Potential Monthly Savings</span>
                <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  £{totalSavings.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground font-medium">Total Recommendations</span>
                <div className="text-2xl font-bold mt-1">{recommendations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground font-medium">High Impact Items</span>
                <div className="text-2xl font-bold mt-1 text-red-500">{highImpactCount}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <Card key={rec.id} data-testid={`card-recommendation-${rec.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-sm">{rec.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {categoryLabels[rec.category]}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${impactColors[rec.impact]}`}>
                                {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              £{rec.estimatedSaving.toLocaleString()}
                            </div>
                            <span className="text-xs text-muted-foreground">est. monthly saving</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">Next Step:</span>
                          <span className="text-sm text-muted-foreground">{rec.action}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-medium">
              {latestData ? "Great job! All your metrics are within healthy ranges." : "No data available"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {latestData
                ? "Keep monitoring your metrics to maintain optimal performance."
                : "Add monthly financial data to receive personalised recommendations."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
