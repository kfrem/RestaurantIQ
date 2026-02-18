import { useQuery } from "@tanstack/react-query";
import type { MonthlyData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, LineChart, Line,
} from "recharts";

const COLORS = [
  "hsl(24, 95%, 53%)", "hsl(32, 88%, 42%)", "hsl(12, 76%, 48%)",
  "hsl(16, 82%, 52%)", "hsl(8, 70%, 55%)", "hsl(40, 85%, 48%)",
  "hsl(0, 72%, 50%)", "hsl(200, 70%, 50%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: "12px",
};

export default function CostAnalysis() {
  const { data: monthlyDataList, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const latestData = monthlyDataList && monthlyDataList.length > 0
    ? monthlyDataList[monthlyDataList.length - 1] : null;

  const costCategories = latestData ? [
    { name: "Food", value: latestData.foodCost, target: 32, pct: (latestData.foodCost / latestData.revenue) * 100 },
    { name: "Labour", value: latestData.labourCost, target: 30, pct: (latestData.labourCost / latestData.revenue) * 100 },
    { name: "Energy", value: latestData.energyCost, target: 8, pct: (latestData.energyCost / latestData.revenue) * 100 },
    { name: "Rent", value: latestData.rentCost, target: 10, pct: (latestData.rentCost / latestData.revenue) * 100 },
    { name: "Marketing", value: latestData.marketingCost, target: 5, pct: (latestData.marketingCost / latestData.revenue) * 100 },
    { name: "Supplies", value: latestData.suppliesCost, target: 4, pct: (latestData.suppliesCost / latestData.revenue) * 100 },
    { name: "Technology", value: latestData.technologyCost, target: 2, pct: (latestData.technologyCost / latestData.revenue) * 100 },
    { name: "Waste", value: latestData.wasteCost, target: 3, pct: (latestData.wasteCost / latestData.revenue) * 100 },
  ] : [];

  const radarData = costCategories.map((c) => ({
    category: c.name,
    actual: c.pct,
    target: c.target,
  }));

  const trendLabels = ["Food", "Labour", "Energy", "Waste"] as const;
  const trendLines = monthlyDataList?.map((d) => ({
    month: `${d.month.substring(0, 3)}`,
    Food: ((d.foodCost / d.revenue) * 100),
    Labour: ((d.labourCost / d.revenue) * 100),
    Energy: ((d.energyCost / d.revenue) * 100),
    Waste: ((d.wasteCost / d.revenue) * 100),
  })) || [];

  const profitabilityData = monthlyDataList?.map((d) => {
    const totalCost = d.foodCost + d.labourCost + d.energyCost + d.rentCost +
      d.marketingCost + d.suppliesCost + d.technologyCost + d.wasteCost;
    return {
      month: `${d.month.substring(0, 3)}`,
      margin: ((d.revenue - totalCost) / d.revenue * 100),
      revenue: d.revenue,
    };
  }) || [];

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-cost-analysis">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Cost Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Deep dive into your cost structure and profitability drivers
        </p>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList data-testid="tabs-cost-analysis">
          <TabsTrigger value="breakdown" data-testid="tab-breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="radar" data-testid="tab-radar">vs Target</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="profitability" data-testid="tab-profitability">Profitability</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {costCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {costCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`£${value.toLocaleString()}`, name]}
                          contentStyle={tooltipStyle}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Cost as % of Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costCategories.map((cat, i) => {
                    const overTarget = cat.pct > cat.target;
                    return (
                      <div key={cat.name} className="space-y-1" data-testid={`cost-bar-${cat.name.toLowerCase()}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${overTarget ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {cat.pct.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">/ {cat.target}%</span>
                          </div>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all"
                            style={{
                              width: `${Math.min((cat.pct / (cat.target * 1.5)) * 100, 100)}%`,
                              backgroundColor: overTarget ? "hsl(0, 72%, 50%)" : COLORS[i % COLORS.length],
                            }}
                          />
                          <div
                            className="absolute inset-y-0 w-0.5 bg-foreground/40"
                            style={{ left: `${(cat.target / (cat.target * 1.5)) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="radar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actual vs Target Cost %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid strokeDasharray="3 3" opacity={0.3} />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="Actual" dataKey="actual" stroke="hsl(24, 95%, 53%)" fill="hsl(24, 95%, 53%)" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Target" dataKey="target" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Key Cost % Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {trendLines.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendLines} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                        contentStyle={tooltipStyle}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      <Line type="monotone" dataKey="Food" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Labour" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Energy" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Waste" stroke={COLORS[6]} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No trend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Profit Margin Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {profitabilityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitabilityData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gradMargin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "margin" ? `${value.toFixed(1)}%` : `£${value.toLocaleString()}`,
                          name === "margin" ? "Margin" : "Revenue",
                        ]}
                        contentStyle={tooltipStyle}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      <Line type="monotone" dataKey="margin" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} dot={{ r: 4 }} name="Gross Margin %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
