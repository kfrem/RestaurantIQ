import { useQuery } from "@tanstack/react-query";
import type { MonthlyData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ShoppingCart, Warehouse, ChefHat, Flame, ConciergeBell,
  Trash2, Heart, ArrowRight, Info,
} from "lucide-react";
import { processNodes, calculateProcessMetrics } from "@/lib/process-flow-data";

const iconMap: Record<string, any> = {
  ShoppingCart, Warehouse, ChefHat, Flame, ConciergeBell, Trash2, Heart,
};

const colorMap: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "destructive": "bg-destructive",
};

const borderColorMap: Record<string, string> = {
  "chart-1": "border-chart-1/30",
  "chart-2": "border-chart-2/30",
  "chart-3": "border-chart-3/30",
  "chart-4": "border-chart-4/30",
  "chart-5": "border-chart-5/30",
  "destructive": "border-destructive/30",
};

const bgLightMap: Record<string, string> = {
  "chart-1": "bg-chart-1/10",
  "chart-2": "bg-chart-2/10",
  "chart-3": "bg-chart-3/10",
  "chart-4": "bg-chart-4/10",
  "chart-5": "bg-chart-5/10",
  "destructive": "bg-destructive/10",
};

function getCostForNode(node: typeof processNodes[0], data: MonthlyData | null): number {
  if (!data || !node.costKey) return 0;
  return data[node.costKey] as number;
}

function getCostLabel(node: typeof processNodes[0]): string {
  const map: Record<string, string> = {
    procurement: "Food Cost",
    storage: "Energy (Storage)",
    preparation: "Labour (Prep)",
    cooking: "Energy (Cooking)",
    service: "Labour (Service)",
    waste: "Waste Cost",
    aftersales: "Marketing",
  };
  return map[node.id] || "Cost";
}

export default function ProcessFlow() {
  const { data: monthlyDataList, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const latestData = monthlyDataList && monthlyDataList.length > 0
    ? monthlyDataList[monthlyDataList.length - 1]
    : null;

  const metrics = calculateProcessMetrics(latestData);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="flex flex-col items-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-80" />
          ))}
        </div>
      </div>
    );
  }

  const mainFlow = processNodes.filter((n) => n.id !== "aftersales");
  const afterSales = processNodes.find((n) => n.id === "aftersales")!;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-process-flow">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Process Flow Map</h1>
        <p className="text-sm text-muted-foreground">
          Visualise every stage of your restaurant's value chain with associated costs
        </p>
      </div>

      {metrics && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="text-sm py-1 px-3">
            Total Revenue: £{metrics.revenue.toLocaleString()}
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3">
            Total Costs: £{metrics.totalCost.toLocaleString()}
          </Badge>
          <Badge
            variant="outline"
            className={`text-sm py-1 px-3 ${
              metrics.grossMargin >= 50 ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "text-red-500 border-red-500/30"
            }`}
          >
            Gross Margin: {metrics.grossMargin.toFixed(1)}%
          </Badge>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {mainFlow.map((node, index) => {
          const Icon = iconMap[node.icon];
          const cost = getCostForNode(node, latestData);
          const costPct = latestData ? ((cost / latestData.revenue) * 100) : 0;

          return (
            <div key={node.id} className="flex flex-col items-center w-full max-w-lg">
              <Card
                className={`w-full border ${borderColorMap[node.color]} transition-all`}
                data-testid={`card-process-${node.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${colorMap[node.color]}`}>
                      {Icon && <Icon className="h-5 w-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{node.label}</h3>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-48">{node.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{node.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          £{cost.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getCostLabel(node)}
                        </span>
                        {costPct > 0 && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              costPct <= 10 ? "" :
                              costPct <= 20 ? "" :
                              "text-red-500"
                            }`}
                          >
                            {costPct.toFixed(1)}% of revenue
                          </Badge>
                        )}
                      </div>
                      {latestData && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colorMap[node.color]} transition-all`}
                              style={{ width: `${Math.min(costPct * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {index < mainFlow.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-3 bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  <div className="w-0.5 h-3 bg-border" />
                </div>
              )}

              {node.id === "service" && (
                <div className="flex items-center gap-4 w-full max-w-lg mt-2 mb-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">branches to</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
            </div>
          );
        })}

        <Card
          className={`w-full max-w-lg border ${borderColorMap[afterSales.color]}`}
          data-testid="card-process-aftersales"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${colorMap[afterSales.color]}`}>
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{afterSales.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{afterSales.description}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-sm font-semibold">
                    £{getCostForNode(afterSales, latestData).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">Marketing Cost</span>
                  {latestData && (
                    <Badge variant="secondary" className="text-xs">
                      {latestData.repeatCustomerRate.toFixed(0)}% repeat rate
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
