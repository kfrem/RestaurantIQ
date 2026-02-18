import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { MonthlyData, Restaurant } from "@shared/schema";
import { insertMonthlyDataSchema, insertRestaurantSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthlyDataFormSchema = insertMonthlyDataSchema.extend({
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020, "Year must be 2020 or later").max(2030),
  revenue: z.number().min(0, "Revenue must be positive"),
  foodCost: z.number().min(0),
  labourCost: z.number().min(0),
  energyCost: z.number().min(0),
  rentCost: z.number().min(0),
  marketingCost: z.number().min(0),
  suppliesCost: z.number().min(0),
  technologyCost: z.number().min(0),
  wasteCost: z.number().min(0),
  deliveryRevenue: z.number().min(0),
  dineInRevenue: z.number().min(0),
  takeawayRevenue: z.number().min(0),
  totalCovers: z.number().min(0),
  avgTicketSize: z.number().min(0),
  repeatCustomerRate: z.number().min(0).max(100),
});

const restaurantFormSchema = insertRestaurantSchema.extend({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  location: z.string().min(1, "Location is required"),
  seatingCapacity: z.number().min(1, "Must have at least 1 seat"),
  avgMonthlyCovers: z.number().min(1, "Must have at least 1 cover"),
});

function NumberInput({ field, label, testId, prefix }: { field: any; label: string; testId: string; prefix?: string }) {
  return (
    <FormItem>
      <FormLabel className="text-xs">{label}</FormLabel>
      <FormControl>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
          )}
          <Input
            type="number"
            step="0.01"
            className={prefix ? "pl-7" : ""}
            value={field.value === 0 ? "" : field.value}
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val === "" ? 0 : parseFloat(val));
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            data-testid={testId}
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default function AddData() {
  const { toast } = useToast();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants/current"],
  });

  const monthlyForm = useForm<z.infer<typeof monthlyDataFormSchema>>({
    resolver: zodResolver(monthlyDataFormSchema),
    defaultValues: {
      restaurantId: 1,
      month: months[new Date().getMonth()],
      year: new Date().getFullYear(),
      revenue: 0,
      foodCost: 0,
      labourCost: 0,
      energyCost: 0,
      rentCost: 0,
      marketingCost: 0,
      suppliesCost: 0,
      technologyCost: 0,
      wasteCost: 0,
      deliveryRevenue: 0,
      dineInRevenue: 0,
      takeawayRevenue: 0,
      totalCovers: 0,
      avgTicketSize: 0,
      repeatCustomerRate: 0,
    },
  });

  const restaurantForm = useForm<z.infer<typeof restaurantFormSchema>>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      seatingCapacity: 50,
      avgMonthlyCovers: 2000,
    },
  });

  const addMonthlyData = useMutation({
    mutationFn: async (data: z.infer<typeof monthlyDataFormSchema>) => {
      const res = await apiRequest("POST", "/api/monthly-data", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      toast({ title: "Data saved successfully", description: "Monthly financial data has been recorded." });
      monthlyForm.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Error saving data", description: err.message, variant: "destructive" });
    },
  });

  const addRestaurant = useMutation({
    mutationFn: async (data: z.infer<typeof restaurantFormSchema>) => {
      const res = await apiRequest("POST", "/api/restaurants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/current"] });
      toast({ title: "Restaurant created", description: "Your restaurant profile has been set up." });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating restaurant", description: err.message, variant: "destructive" });
    },
  });

  if (loadingRestaurant) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full" data-testid="page-add-data">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Add Data</h1>
        <p className="text-sm text-muted-foreground">
          Enter your restaurant's financial data for analysis and insights
        </p>
      </div>

      <Tabs defaultValue={restaurant ? "monthly" : "restaurant"}>
        <TabsList data-testid="tabs-add-data">
          <TabsTrigger value="restaurant" data-testid="tab-restaurant">Restaurant Profile</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly Data</TabsTrigger>
        </TabsList>

        <TabsContent value="restaurant" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Restaurant Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...restaurantForm}>
                <form onSubmit={restaurantForm.handleSubmit((data) => addRestaurant.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={restaurantForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Restaurant Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. The Golden Fork" data-testid="input-restaurant-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Cuisine Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-restaurant-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Italian">Italian</SelectItem>
                              <SelectItem value="British">British</SelectItem>
                              <SelectItem value="Indian">Indian</SelectItem>
                              <SelectItem value="Chinese">Chinese</SelectItem>
                              <SelectItem value="Japanese">Japanese</SelectItem>
                              <SelectItem value="Mexican">Mexican</SelectItem>
                              <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                              <SelectItem value="American">American</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="Thai">Thai</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. London, Shoreditch" data-testid="input-restaurant-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="seatingCapacity"
                      render={({ field }) => (
                        <NumberInput field={field} label="Seating Capacity" testId="input-seating-capacity" />
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="avgMonthlyCovers"
                      render={({ field }) => (
                        <NumberInput field={field} label="Avg Monthly Covers" testId="input-monthly-covers" />
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={addRestaurant.isPending} data-testid="button-save-restaurant">
                    <Plus className="h-4 w-4 mr-2" />
                    {addRestaurant.isPending ? "Saving..." : "Create Restaurant"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Monthly Financial Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...monthlyForm}>
                <form onSubmit={monthlyForm.handleSubmit((data) => addMonthlyData.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={monthlyForm.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Month</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-month">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={monthlyForm.control}
                      name="year"
                      render={({ field }) => (
                        <NumberInput field={field} label="Year" testId="input-year" />
                      )}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Revenue Breakdown</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField control={monthlyForm.control} name="revenue" render={({ field }) => (
                        <NumberInput field={field} label="Total Revenue" testId="input-revenue" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="dineInRevenue" render={({ field }) => (
                        <NumberInput field={field} label="Dine-In Revenue" testId="input-dine-in" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="deliveryRevenue" render={({ field }) => (
                        <NumberInput field={field} label="Delivery Revenue" testId="input-delivery" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="takeawayRevenue" render={({ field }) => (
                        <NumberInput field={field} label="Takeaway Revenue" testId="input-takeaway" prefix="£" />
                      )} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Cost Categories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField control={monthlyForm.control} name="foodCost" render={({ field }) => (
                        <NumberInput field={field} label="Food Cost" testId="input-food-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="labourCost" render={({ field }) => (
                        <NumberInput field={field} label="Labour Cost" testId="input-labour-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="energyCost" render={({ field }) => (
                        <NumberInput field={field} label="Energy Cost" testId="input-energy-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="rentCost" render={({ field }) => (
                        <NumberInput field={field} label="Rent Cost" testId="input-rent-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="marketingCost" render={({ field }) => (
                        <NumberInput field={field} label="Marketing Cost" testId="input-marketing-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="suppliesCost" render={({ field }) => (
                        <NumberInput field={field} label="Supplies Cost" testId="input-supplies-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="technologyCost" render={({ field }) => (
                        <NumberInput field={field} label="Technology Cost" testId="input-tech-cost" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="wasteCost" render={({ field }) => (
                        <NumberInput field={field} label="Waste Cost" testId="input-waste-cost" prefix="£" />
                      )} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField control={monthlyForm.control} name="totalCovers" render={({ field }) => (
                        <NumberInput field={field} label="Total Covers" testId="input-total-covers" />
                      )} />
                      <FormField control={monthlyForm.control} name="avgTicketSize" render={({ field }) => (
                        <NumberInput field={field} label="Avg Ticket Size" testId="input-avg-ticket" prefix="£" />
                      )} />
                      <FormField control={monthlyForm.control} name="repeatCustomerRate" render={({ field }) => (
                        <NumberInput field={field} label="Repeat Customer Rate (%)" testId="input-repeat-rate" />
                      )} />
                    </div>
                  </div>

                  <Button type="submit" disabled={addMonthlyData.isPending} data-testid="button-save-monthly-data">
                    <Save className="h-4 w-4 mr-2" />
                    {addMonthlyData.isPending ? "Saving..." : "Save Monthly Data"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
