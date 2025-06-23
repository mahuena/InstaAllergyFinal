import { FoodScanner } from "@/components/food-scanner";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Scan a food item to check for allergens and view details.
        </p>
      </div>
      <FoodScanner />
    </div>
  );
}
