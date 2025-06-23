"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { recommendSafeFoods, RecommendSafeFoodsOutput } from "@/ai/flows/recommend-safe-foods";
import { FOOD_DATABASE } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendSafeFoodsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, allergens } = useUser();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await recommendSafeFoods({
        allergyProfile: {
          allergens: allergens,
          dietaryPreferences: "None specified",
        },
        nutritionGoals: "General healthy eating",
        foodDatabase: FOOD_DATABASE.map(f => ({
            name: f.name,
            ingredients: f.ingredients,
            nutritionalData: f.nutritionalData,
            region: f.region
        })),
      });
      setRecommendations(result);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      toast({
        title: "Error",
        description: "Could not fetch recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Food Recommendations</h1>
        <p className="text-muted-foreground">
          Discover safe and delicious foods tailored to your profile.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Get Personalized Suggestions</CardTitle>
          <CardDescription>
            Based on your current allergy profile, we can suggest some foods from our database that should be safe for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            <span className="font-semibold">Your active allergies:</span> {allergens.join(", ") || "None"}
          </p>
          <Button onClick={handleGetRecommendations} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Recommend Foods
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recommendations && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
              <CardDescription>Here are some food items that fit your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.safeFoods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.safeFoods.map((foodName) => {
                    const food = FOOD_DATABASE.find(f => f.name === foodName);
                    if (!food) return null;
                    return (
                      <Card key={food.name} className="overflow-hidden group">
                        <div className="relative h-48 w-full">
                          <Image
                            src={food.image}
                            alt={food.name}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={food.dataAiHint}
                            className="transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle>{food.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p>No specific recommendations found based on your current profile.</p>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Our Reasoning</AlertTitle>
            <AlertDescription>
                {recommendations.reasoning}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
