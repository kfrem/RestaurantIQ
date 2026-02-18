import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  SlidersHorizontal,
  Lightbulb,
  PlusCircle,
  Utensils,
  Sparkles,
  ChefHat,
  ShieldAlert,
  Layers,
  Tag,
  FileSpreadsheet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Quick Assessment", url: "/quick-assessment", icon: Sparkles },
];

const costingNav = [
  { title: "Menu & Recipes", url: "/menu-costing", icon: ChefHat },
  { title: "Supplier Risk", url: "/supplier-risk", icon: ShieldAlert },
  { title: "Cost Classification", url: "/cost-classification", icon: Layers },
  { title: "Promotions", url: "/promotions", icon: Tag },
];

const analysisNav = [
  { title: "Process Flow", url: "/process-flow", icon: GitBranch },
  { title: "Cost Analysis", url: "/cost-analysis", icon: BarChart3 },
  { title: "What-If Simulator", url: "/simulator", icon: SlidersHorizontal },
  { title: "Recommendations", url: "/recommendations", icon: Lightbulb },
];

const dataNav = [
  { title: "Add Data", url: "/add-data", icon: PlusCircle },
  { title: "Import Data", url: "/data-import", icon: FileSpreadsheet },
];

export function AppSidebar() {
  const [location] = useLocation();

  function NavGroup({ label, items }: { label: string; items: typeof mainNav }) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Utensils className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">RestaurantIQ</span>
              <span className="text-xs text-muted-foreground leading-tight">Process Intelligence</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Overview" items={mainNav} />
        <SidebarSeparator />
        <NavGroup label="Costing & Risk" items={costingNav} />
        <SidebarSeparator />
        <NavGroup label="Analysis" items={analysisNav} />
        <SidebarSeparator />
        <NavGroup label="Data" items={dataNav} />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          Restaurant Process Intelligence v2.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
