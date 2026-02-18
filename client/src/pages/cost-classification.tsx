import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CostCategory, MonthlyData, Ingredient } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Layers, ArrowRight, TrendingUp, TrendingDown,
  CircleDollarSign, Factory, Building2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CLASSIFICATION_CONFIG = {
  direct: { label: "Direct Costs", color: "hsl(24, 95%, 53%)", icon: CircleDollarSign, description: "Costs directly tied to producing meals (ingredients, direct labour, packaging)" },
  indirect: { label: "Indirect Costs", color: "hsl(200, 70%, 50%)", icon: Factory, description: "Operating costs that support production (energy, supplies, maintenance, waste)" },
  overhead: { label: "Overheads", color: "hsl(280, 60%, 50%)", icon: Building2, description: "Fixed costs regardless of output (rent, marketing, technology, licenses, training)" },
};

export default function CostClassification() {
  const { data: costCategories = [] } = useQuery<CostCategory[]>({ queryKey: ["/api/cost-categories"] });
  const { data: monthlyDataAll = [] } = useQuery<MonthlyData[]>({ queryKey: ["/api/monthly-data"] });
  const { data: restaurant } = useQuery<any>({ queryKey: ["/api/restaurants/current"] });
  const restaurantId = restaurant?.id || 1;
  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients", restaurantId],
  });

  const latestData = monthlyDataAll.length > 0 ? monthlyDataAll[monthlyDataAll.length - 1] : null;

  const analysis = useMemo(() => {
    if (!latestData) return null;

    const categoryTotals: Record<string, { categories: { name: string; amount: number; key: string }[]; total: number }> = {
      direct: { categories: [], total: 0 },
      indirect: { categories: [], total: 0 },
      overhead: { categories: [], total: 0 },
    };

    const dataMap: Record<string, number> = {
      foodCost: latestData.foodCost,
      labourCost: latestData.labourCost,
      energyCost: latestData.energyCost,
      rentCost: latestData.rentCost,
      marketingCost: latestData.marketingCost,
      suppliesCost: latestData.suppliesCost,
      technologyCost: latestData.technologyCost,
      wasteCost: latestData.wasteCost,
    };

    for (const cat of costCategories) {
      const classification = cat.classification || "direct";
      const amount = dataMap[cat.key] || 0;
      if (amount > 0 && categoryTotals[classification]) {
        categoryTotals[classification].categories.push({ name: cat.name, amount, key: cat.key });
        categoryTotals[classification].total += amount;
      }
    }

    const totalCost = Object.values(categoryTotals).reduce((s, c) => s + c.total, 0);
    const revenue = latestData.revenue;
    const profit = revenue - totalCost;

    const pieData = Object.entries(categoryTotals)
      .filter(([, v]) => v.total > 0)
      .map(([key, v]) => ({
        name: CLASSIFICATION_CONFIG[key as keyof typeof CLASSIFICATION_CONFIG].label,
        value: v.total,
        color: CLASSIFICATION_CONFIG[key as keyof typeof CLASSIFICATION_CONFIG].color,
        percent: totalCost > 0 ? (v.total / totalCost * 100) : 0,
      }));

    const trendData = monthlyDataAll.map((md) => {
      let direct = 0, indirect = 0, overhead = 0;
      const mdMap: Record<string, number> = {
        foodCost: md.foodCost, labourCost: md.labourCost, energyCost: md.energyCost,
        rentCost: md.rentCost, marketingCost: md.marketingCost, suppliesCost: md.suppliesCost,
        technologyCost: md.technologyCost, wasteCost: md.wasteCost,
      };
      for (const cat of costCategories) {
        const v = mdMap[cat.key] || 0;
        if (cat.classification === "direct") direct += v;
        else if (cat.classification === "indirect") indirect += v;
        else overhead += v;
      }
      return { name: md.month.substring(0, 3), direct, indirect, overhead, total: direct + indirect + overhead };
    });

    const ingredientClassification = {
      direct: allIngredients.filter((i) => i.classification === "direct").length,
      indirect: allIngredients.filter((i) => i.classification === "indirect").length,
      overhead: allIngredients.filter((i) => i.classification === "overhead").length,
    };

    return { categoryTotals, totalCost, revenue, profit, pieData, trendData, ingredientClassification };
  }, [costCategories, latestData, monthlyDataAll, allIngredients]);

  if (!analysis || !latestData) {
    return (
      <div className="p-6 text-center text-muted-foreground">Loading cost classification data...</div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-cost-classification">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Cost Classification Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">Breakdown of costs into Direct, Indirect, and Overhead categories</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["direct", "indirect", "overhead"] as const).map((key) => {
          const config = CLASSIFICATION_CONFIG[key];
          const data = analysis.categoryTotals[key];
          const percent = analysis.totalCost > 0 ? (data.total / analysis.totalCost * 100) : 0;
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md" style={{ backgroundColor: config.color + "20" }}>
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{percent.toFixed(1)}% of total costs</div>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" data-testid={`text-total-${key}`}>
                  £{data.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
                <div className="mt-3 space-y-1">
                  {data.categories.map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">£{cat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56" data-testid="chart-cost-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analysis.pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name}: ${percent.toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {analysis.pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`£${value.toLocaleString()}`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cost Classification Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56" data-testid="chart-cost-trend">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                  <Bar dataKey="direct" name="Direct" fill={CLASSIFICATION_CONFIG.direct.color} stackId="a" />
                  <Bar dataKey="indirect" name="Indirect" fill={CLASSIFICATION_CONFIG.indirect.color} stackId="a" />
                  <Bar dataKey="overhead" name="Overhead" fill={CLASSIFICATION_CONFIG.overhead.color} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Profitability Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Revenue</span>
              <div className="text-lg font-bold" data-testid="text-revenue">£{analysis.revenue.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Total Costs</span>
              <div className="text-lg font-bold" data-testid="text-total-cost">£{analysis.totalCost.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Net Profit</span>
              <div className={`text-lg font-bold ${analysis.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} data-testid="text-net-profit">
                £{analysis.profit.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Profit Margin</span>
              <div className={`text-lg font-bold ${analysis.profit / analysis.revenue > 0.1 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} data-testid="text-profit-margin">
                {((analysis.profit / analysis.revenue) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold mb-2">Cost Flow</h3>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="outline" className="bg-primary/5">Revenue: £{analysis.revenue.toLocaleString()}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant="outline" style={{ borderColor: CLASSIFICATION_CONFIG.direct.color }}>
                Direct: £{analysis.categoryTotals.direct.total.toLocaleString()}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant="outline" style={{ borderColor: CLASSIFICATION_CONFIG.indirect.color }}>
                Indirect: £{analysis.categoryTotals.indirect.total.toLocaleString()}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant="outline" style={{ borderColor: CLASSIFICATION_CONFIG.overhead.color }}>
                Overhead: £{analysis.categoryTotals.overhead.total.toLocaleString()}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant={analysis.profit >= 0 ? "secondary" : "destructive"}>
                {analysis.profit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                Profit: £{analysis.profit.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
