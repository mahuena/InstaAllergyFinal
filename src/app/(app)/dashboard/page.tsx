"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FoodScanner } from "@/components/food-scanner";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, allergens } = useUser();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user?.name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          {allergens.length > 0
            ? "Upload a food item to check for allergens and view details."
            : "Get started by setting up your allergy profile."}
        </p>
      </div>

      {allergens.length > 0 ? (
        <FoodScanner />
      ) : (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Set Up Your Allergy Profile</CardTitle>
            <CardDescription>
              To get personalized allergen alerts, please set up your allergy profile first. It only takes a minute!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile" passHref>
              <Button className="w-full">
                Go to My Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
