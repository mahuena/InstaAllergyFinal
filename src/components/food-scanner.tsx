"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, AlertTriangle, Info, Loader2, Shield, Sparkles, X } from "lucide-react";

import { classifyFood, ClassifyFoodOutput } from "@/ai/flows/classify-food";
import { detectAllergensAndGenerateAlert, DetectAllergensOutput } from "@/ai/flows/detect-allergens";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { getFoodByName, FoodItem } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  image: z.instanceof(File).refine(file => file.size > 0, "An image is required."),
});

type ClassificationResult = ClassifyFoodOutput & { foodDetails: FoodItem | null };
type AllergenResult = DetectAllergensOutput;

export function FoodScanner() {
  const [preview, setPreview] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [allergenResult, setAllergenResult] = useState<AllergenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { allergens: userAllergens } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        resetResults();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    form.reset();
    setPreview(null);
    resetResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const resetResults = () => {
    setClassificationResult(null);
    setAllergenResult(null);
    setError(null);
    setIsLoading(false);
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    resetResults();

    try {
      const reader = new FileReader();
      reader.readAsDataURL(data.image);
      reader.onload = async () => {
        const photoDataUri = reader.result as string;
        
        // 1. Classify Food
        const cfOutput = await classifyFood({ photoDataUri });
        const foodDetails = getFoodByName(cfOutput.classification);
        setClassificationResult({ ...cfOutput, foodDetails });

        // 2. Detect Allergens
        if (foodDetails) {
          const daOutput = await detectAllergensAndGenerateAlert({
            ingredients: foodDetails.ingredients.join(', '),
            allergens: userAllergens,
          });
          setAllergenResult(daOutput);
        }

        setIsLoading(false);
      };
    } catch (e) {
      console.error(e);
      setError("An error occurred during analysis. Please try again.");
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the food item.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const getAlertVariant = (alertLevel?: 'HIGH' | 'MODERATE' | 'SAFE') => {
    switch(alertLevel) {
        case 'HIGH': return 'destructive';
        case 'MODERATE': return 'default'; // yellow-ish in our theme
        case 'SAFE': return 'default'; // using default for safe, will style with bg
        default: return 'default';
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Food Scanner</CardTitle>
        <CardDescription>Upload a photo of your food to analyze it for allergens.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div
                      className="relative flex justify-center items-center w-full h-64 border-2 border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isLoading}
                      />
                      {preview ? (
                        <>
                          <Image src={preview} alt="Food preview" layout="fill" objectFit="contain" className="rounded-lg p-2" />
                           <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 z-10 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); resetState(); }}
                            disabled={isLoading}
                           >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear image</span>
                           </Button>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Camera className="mx-auto h-12 w-12 mb-2" />
                          <p>Click to upload or drag & drop</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            
            {isLoading && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing your food...</p>
              </div>
            )}
            
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {classificationResult && (
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{classificationResult.classification}</CardTitle>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Confidence</span>
                                <Progress value={classificationResult.confidence * 100} className="w-24" />
                                <span>{Math.round(classificationResult.confidence * 100)}%</span>
                            </div>
                        </div>
                        {allergenResult && (
                             <Badge 
                                variant={getAlertVariant(allergenResult.alert)} 
                                className={`text-base px-4 py-1 ${allergenResult.alert === 'SAFE' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
                            >
                                {allergenResult.alert} RISK
                             </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allergenResult && (
                    <Alert variant={getAlertVariant(allergenResult.alert)}>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>{allergenResult.allergenDetected ? `Potential Allergen(s) Found!` : 'Looking Good!'}</AlertTitle>
                      <AlertDescription>
                        {allergenResult.allergenDetected ? 
                          `We detected the following potential allergens based on your profile: ${allergenResult.detectedAllergens.join(', ')}.` :
                          'We did not detect any of your specified allergens in this dish.'
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {classificationResult.foodDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Ingredients</h4>
                            <p className="text-muted-foreground">{classificationResult.foodDetails.ingredients.join(', ')}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">Nutritional Info</h4>
                            <p className="text-muted-foreground">{classificationResult.foodDetails.nutritionalData}</p>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Region</h4>
                            <p className="text-muted-foreground">{classificationResult.foodDetails.region}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">Cultural Note</h4>
                            <p className="text-muted-foreground">{classificationResult.foodDetails.history}</p>
                        </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Food Not in Database</AlertTitle>
                      <AlertDescription>We classified this food, but we don't have detailed ingredient or nutritional data for it in our database.</AlertDescription>
                    </Alert>
                  )}
                  
                  {classificationResult.alternativeSuggestions.length > 0 && (
                    <>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Alternative Suggestions</h4>
                        <div className="flex flex-wrap gap-2">
                        {classificationResult.alternativeSuggestions.map(alt => (
                            <Badge key={alt} variant="outline">{alt}</Badge>
                        ))}
                        </div>
                    </div>
                    </>
                  )}

                </CardContent>
              </Card>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !preview} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : "Analyze Food"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
