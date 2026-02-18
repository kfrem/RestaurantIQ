import { useQuery } from "@tanstack/react-query";
import type { MonthlyData, Restaurant } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Utensils,
  Zap,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { calculateProcessMetrics } from "@/lib/process-flow-data";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  healthColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
  healthColor?: string;
}) {
  return (
    <Card data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">{title}</span>
            <span className={`text-2xl font-bold tracking-tight ${healthColor || ""}`}>{value}</span>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            {trend && trendValue && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${
                trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  "hsl(24, 95%, 53%)",
  "hsl(32, 88%, 42%)",
  "hsl(12, 76%, 48%)",
  "hsl(16, 82%, 52%)",
  "hsl(8, 70%, 55%)",
  "hsl(40, 85%, 48%)",
  "hsl(0, 72%, 50%)",
  "hsl(200, 70%, 50%)",
];

export default function Dashboard() {
  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants/current"],
  });

  const { data: monthlyDataList, isLoading: loadingData } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const isLoading = loadingRestaurant || loadingData;
  const latestData = monthlyDataList && monthlyDataList.length > 0 ? monthlyDataList[monthlyDataList.length - 1] : null;
  const metrics = calculateProcessMetrics(latestData);

  const costBreakdownData = latestData ? [
    { name: "Food", value: latestData.foodCost, fill: CHART_COLORS[0] },
    { name: "Labour", value: latestData.labourCost, fill: CHART_COLORS[1] },
    { name: "Energy", value: latestData.energyCost, fill: CHART_COLORS[2] },
    { name: "Rent", value: latestData.rentCost, fill: CHART_COLORS[3] },
    { name: "Marketing", value: latestData.marketingCost, fill: CHART_COLORS[4] },
    { name: "Supplies", value: latestData.suppliesCost, fill: CHART_COLORS[5] },
    { name: "Waste", value: latestData.wasteCost, fill: CHART_COLORS[6] },
    { name: "Technology", value: latestData.technologyCost, fill: CHART_COLORS[7] },
  ] : [];

  const revenueBreakdownData = latestData ? [
    { name: "Dine-In", value: latestData.dineInRevenue, fill: CHART_COLORS[0] },
    { name: "Delivery", value: latestData.deliveryRevenue, fill: CHART_COLORS[1] },
    { name: "Takeaway", value: latestData.takeawayRevenue, fill: CHART_COLORS[2] },
  ] : [];

  const trendData = monthlyDataList?.map((d) => {
    const total = d.foodCost + d.labourCost + d.energyCost + d.rentCost +
      d.marketingCost + d.suppliesCost + d.technologyCost + d.wasteCost;
    return {
      month: `${d.month.substring(0, 3)} ${d.year}`,
      revenue: d.revenue,
      costs: total,
      profit: d.revenue - total,
    };
  }) || [];

  const prevData = monthlyDataList && monthlyDataList.length > 1 ? monthlyDataList[monthlyDataList.length - 2] : null;
  const prevMetrics = calculateProcessMetrics(prevData);

  function getTrend(current: number, prev: number | undefined): { trend: "up" | "down"; value: string } | null {
    if (prev === undefined) return null;
    const diff = ((current - prev) / prev) * 100;
    return { trend: diff >= 0 ? "up" : "down", value: `${Math.abs(diff).toFixed(1)}%` };
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const revenueTrend = metrics && prevMetrics
    ? getTrend(metrics.revenue, prevMetrics.revenue)
    : null;
  const marginTrend = metrics && prevMetrics
    ? getTrend(metrics.grossMargin, prevMetrics.grossMargin)
    : null;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-dashboard">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">
            {restaurant?.name || "Restaurant"} Dashboard
          </h1>
          {restaurant && (
            <Badge variant="secondary" data-testid="badge-restaurant-type">{restaurant.type}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Overview of your restaurant's financial performance and key metrics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={metrics ? `£${(metrics.revenue / 1000).toFixed(1)}k` : "—"}
          subtitle={latestData ? `${latestData.month} ${latestData.year}` : "No data"}
          icon={DollarSign}
          trend={revenueTrend?.trend}
          trendValue={revenueTrend?.value}
        />
        <MetricCard
          title="Gross Margin"
          value={metrics ? `${metrics.grossMargin.toFixed(1)}%` : "—"}
          subtitle="of total revenue"
          icon={TrendingUp}
          trend={marginTrend?.trend}
          trendValue={marginTrend?.value}
          healthColor={
            metrics
              ? metrics.grossMargin >= 65 ? "text-emerald-600 dark:text-emerald-400"
              : metrics.grossMargin >= 50 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
        <MetricCard
          title="Food Cost %"
          value={metrics ? `${metrics.foodCostPct.toFixed(1)}%` : "—"}
          subtitle="target: 28-32%"
          icon={Utensils}
          healthColor={
            metrics
              ? metrics.foodCostPct <= 32 ? "text-emerald-600 dark:text-emerald-400"
              : metrics.foodCostPct <= 38 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
        <MetricCard
          title="Total Covers"
          value={latestData ? latestData.totalCovers.toLocaleString() : "—"}
          subtitle={`£${latestData?.avgTicketSize?.toFixed(2) || "0"} avg ticket`}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Labour Cost %"
          value={metrics ? `${metrics.labourCostPct.toFixed(1)}%` : "—"}
          subtitle="target: 25-30%"
          icon={Users}
          healthColor={
            metrics
              ? metrics.labourCostPct <= 30 ? "text-emerald-600 dark:text-emerald-400"
              : metrics.labourCostPct <= 35 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
        <MetricCard
          title="Energy Cost %"
          value={metrics ? `${metrics.energyCostPct.toFixed(1)}%` : "—"}
          subtitle="target: 5-8%"
          icon={Zap}
          healthColor={
            metrics
              ? metrics.energyCostPct <= 8 ? "text-emerald-600 dark:text-emerald-400"
              : metrics.energyCostPct <= 12 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
        <MetricCard
          title="Waste %"
          value={metrics ? `${metrics.wastePct.toFixed(1)}%` : "—"}
          subtitle="target: < 3%"
          icon={AlertTriangle}
          healthColor={
            metrics
              ? metrics.wastePct <= 3 ? "text-emerald-600 dark:text-emerald-400"
              : metrics.wastePct <= 5 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
        <MetricCard
          title="Repeat Customers"
          value={latestData ? `${latestData.repeatCustomerRate.toFixed(0)}%` : "—"}
          subtitle="of all customers"
          icon={ArrowUpRight}
          healthColor={
            latestData
              ? latestData.repeatCustomerRate >= 40 ? "text-emerald-600 dark:text-emerald-400"
              : latestData.repeatCustomerRate >= 25 ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
              : ""
          }
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Weekly Profit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {latestData && metrics ? (() => {
            const weeklyRevenue = metrics.revenue / 4.345;
            const weeklyCost = metrics.totalCost / 4.345;
            const weeklyProfit = metrics.grossProfit / 4.345;
            const weekNames = ["Week 1", "Week 2", "Week 3", "Week 4"];
            const weeklyData = weekNames.map((name, i) => {
              const factor = [0.92, 1.02, 1.08, 0.98][i];
              return {
                name,
                revenue: Math.round(weeklyRevenue * factor),
                costs: Math.round(weeklyCost * factor),
                profit: Math.round(weeklyProfit * factor),
              };
            });
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <span className="text-xs text-muted-foreground">Avg Weekly Revenue</span>
                    <div className="text-lg font-bold mt-0.5">£{Math.round(weeklyRevenue).toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <span className="text-xs text-muted-foreground">Avg Weekly Costs</span>
                    <div className="text-lg font-bold mt-0.5">£{Math.round(weeklyCost).toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <span className="text-xs text-muted-foreground">Avg Weekly Profit</span>
                    <div className={`text-lg font-bold mt-0.5 ${weeklyProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      £{Math.round(weeklyProfit).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="h-52" data-testid="chart-weekly-profit">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                      <Bar dataKey="revenue" fill="hsl(24, 95%, 53%)" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costs" fill="hsl(0, 72%, 50%)" name="Costs" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" name="Profit" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })() : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No data available for weekly breakdown
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue vs Costs Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72" data-testid="chart-revenue-trend">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
                    <Area type="monotone" dataKey="revenue" stroke="hsl(24, 95%, 53%)" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="costs" stroke="hsl(0, 72%, 50%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Costs" />
                    <Area type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available. Add monthly data to see trends.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72" data-testid="chart-cost-breakdown">
              {costBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No cost data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-revenue-channels">
              {revenueBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBreakdownData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-cost-trends">
              {monthlyDataList && monthlyDataList.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDataList.map((d) => ({
                      month: `${d.month.substring(0, 3)}`,
                      Food: d.foodCost,
                      Labour: d.labourCost,
                      Energy: d.energyCost,
                      Waste: d.wasteCost,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
                    <Bar dataKey="Food" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Labour" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Energy" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Waste" fill={CHART_COLORS[6]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No monthly data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
