import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ProcessFlow from "@/pages/process-flow";
import CostAnalysis from "@/pages/cost-analysis";
import Simulator from "@/pages/simulator";
import Recommendations from "@/pages/recommendations";
import AddData from "@/pages/add-data";
import QuickAssessment from "@/pages/quick-assessment";
import MenuCosting from "@/pages/menu-costing";
import SupplierRisk from "@/pages/supplier-risk";
import CostClassification from "@/pages/cost-classification";
import PromotionsPage from "@/pages/promotions";
import DataImport from "@/pages/data-import";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/quick-assessment" component={QuickAssessment} />
      <Route path="/menu-costing" component={MenuCosting} />
      <Route path="/supplier-risk" component={SupplierRisk} />
      <Route path="/cost-classification" component={CostClassification} />
      <Route path="/promotions" component={PromotionsPage} />
      <Route path="/process-flow" component={ProcessFlow} />
      <Route path="/cost-analysis" component={CostAnalysis} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/add-data" component={AddData} />
      <Route path="/data-import" component={DataImport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
