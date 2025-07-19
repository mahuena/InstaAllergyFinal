"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera as CameraIcon, AlertTriangle, Info, Loader2, Shield, Sparkles, X, Upload, Video, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyFood, ClassifyFoodOutput } from "@/ai/flows/classify-food";
import { detectAllergensAndGenerateAlert, DetectAllergensOutput } from "@/ai/flows/detect-allergens";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

const formSchema = z.object({
    image: z.instanceof(File).optional().refine(file => file === undefined || file.size > 0, "Image is required"),
});

type AllergenResult = DetectAllergensOutput;

export function FoodScanner() {
    const [preview, setPreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("analyze-food");
    const [classificationResult, setClassificationResult] = useState<ClassifyFoodOutput | null>(null);
    const [allergenResult, setAllergenResult] = useState<AllergenResult | null>(null);
    const [isClassifyLoading, setIsClassifyLoading] = useState(false);
    const [classifyError, setClassifyError] = useState<string | null>(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [ocrAllergenResult, setOcrAllergenResult] = useState<AllergenResult | null>(null);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { toast } = useToast();
    const { allergens: userAllergens } = useUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            image: undefined
        }
    });

    // Helper to check if running in native (Capacitor) environment
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (!isCameraOpen || isNative) return;

        let stream: MediaStream;
        const getCameraPermission = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                setHasCameraPermission(false);
                toast({
                    variant: "destructive",
                    title: "Camera Access Denied",
                    description: "Please enable camera permissions in your browser settings to use this app.",
                });
            }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const mediaStream = videoRef.current.srcObject as MediaStream;
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isCameraOpen, toast, isNative]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue("image", file, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                resetResults();
            };
            reader.readAsDataURL(file);
        }
    };

    // Native camera handler
    const openNativeCamera = async () => {
        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                quality: 90,
            });
            setPreview(photo.dataUrl!);
            // Convert dataUrl to File for form
            const res = await fetch(photo.dataUrl!);
            const blob = await res.blob();
            const file = new File([blob], "capture.jpg", { type: blob.type });
            form.setValue("image", file, { shouldValidate: true });
            resetResults();
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Camera Error",
                description: "Could not access the camera.",
            });
        }
    };

    // Browser camera handler
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUri = canvas.toDataURL("image/jpeg");
                setPreview(dataUri);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                        form.setValue("image", file, { shouldValidate: true });
                        resetResults();
                    }
                }, "image/jpeg", 0.95);
            }
            setIsCameraOpen(false);
        }
    };

    const openCamera = () => {
        resetState();
        if (isNative) {
            openNativeCamera();
        } else {
            setIsCameraOpen(true);
        }
    };

    const resetState = () => {
        form.reset();
        setPreview(null);
        resetResults();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsCameraOpen(false);
    };

    const resetResults = () => {
        setClassificationResult(null);
        setAllergenResult(null);
        setClassifyError(null);
        setExtractedText(null);
        setOcrAllergenResult(null);
        setOcrError(null);
    };

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!navigator.onLine) {
            toast({
                variant: "destructive",
                title: "You're Offline",
                description: "An internet connection is required to analyze food.",
            });
            return;
        }
        if (!data.image) {
            setClassifyError("Please select an image first.");
            return;
        }
        setIsClassifyLoading(true);
        resetResults();
        try {
            const reader = new FileReader();
            reader.readAsDataURL(data.image);
            reader.onload = async () => {
                const photoDataUri = reader.result as string;
                const cfOutput = await classifyFood({ photoDataUri });
                setClassificationResult(cfOutput);
                if (cfOutput.isFood && cfOutput.foodDetails) {
                    const daOutput = await detectAllergensAndGenerateAlert({
                        ingredients: cfOutput.foodDetails.ingredients.join(', '),
                        allergens: userAllergens,
                    });
                    setAllergenResult(daOutput);
                }
                setIsClassifyLoading(false);
            };
        } catch (e) {
            setClassifyError("An error occurred during analysis. Please try again.");
            toast({
                title: "Analysis Failed",
                description: "Could not analyze the food item.",
                variant: "destructive",
            });
            setIsClassifyLoading(false);
        }
    };

    const handleScanLabel = async () => {
        if (!navigator.onLine) {
            toast({
                variant: "destructive",
                title: "You're Offline",
                description: "An internet connection is required to scan labels.",
            });
            return;
        }
        const imageFile = form.getValues("image");
        if (!imageFile) {
            setOcrError("Please select an image first.");
            return;
        }
        setIsOcrLoading(true);
        resetResults();
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = async () => {
                const photoDataUri = reader.result as string;
                const { extractedText } = await extractTextFromImage({ photoDataUri });
                setExtractedText(extractedText);
                if (extractedText) {
                    const daOutput = await detectAllergensAndGenerateAlert({
                        ingredients: extractedText,
                        allergens: userAllergens,
                    });
                    setOcrAllergenResult(daOutput);
                }
                setIsOcrLoading(false);
            };
            reader.onerror = () => {
                throw new Error("Could not read file");
            };
        } catch (e) {
            setOcrError("An error occurred during label analysis. Please try again.");
            toast({
                title: "Analysis Failed",
                description: "Could not analyze the product label.",
                variant: "destructive",
            });
            setIsOcrLoading(false);
        }
    };

    const getAlertBadgeProps = (alertLevel?: 'HIGH' | 'MODERATE' | 'SAFE') => {
        switch (alertLevel) {
            case 'HIGH':
                return { variant: 'destructive' as const, className: '', children: 'HIGH RISK' };
            case 'MODERATE':
                return { variant: 'secondary' as const, className: 'border-yellow-500/50', children: 'MODERATE RISK' };
            case 'SAFE':
                return { variant: 'default' as const, className: 'bg-chart-2 text-accent-foreground hover:bg-chart-2/90', children: 'SAFE' };
            default:
                return { variant: 'outline' as const, className: '', children: 'UNKNOWN' };
        }
    };

    const classifyBadgeProps = allergenResult ? getAlertBadgeProps(allergenResult.alert) : getAlertBadgeProps();
    const ocrBadgeProps = ocrAllergenResult ? getAlertBadgeProps(ocrAllergenResult.alert) : getAlertBadgeProps();

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Food Analyzed</CardTitle>
                {/*<CardDescription>Analyze a dish or scan an ingredient label.</CardDescription>*/}
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <Tabs defaultValue="analyze-food" className="w-full" onValueChange={(value) => {
                            setActiveTab(value);
                            resetResults();
                        }}>
                            <TabsList className="w-full">
                                <TabsTrigger value="analyze-food">
                                    <Sparkles className="mr-2 h-4 w-4" /> Analyze Food
                                </TabsTrigger>
                                {/*<TabsTrigger value="scan-label">*/}
                                {/*    <Scan className="mr-2 h-4 w-4" /> Scan Label*/}
                                {/*</TabsTrigger>*/}
                            </TabsList>
                        </Tabs>
                        <FormField
                            control={form.control}
                            name="image"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <div className="w-full">
                                            {preview ? (
                                                <div className="relative group w-full h-64">
                                                    <Image src={preview} alt="Food preview" layout="fill" objectFit="contain" className="rounded-lg p-2" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 z-10 h-8 w-8"
                                                        onClick={(e) => { e.stopPropagation(); resetState(); }}
                                                        disabled={isClassifyLoading || isOcrLoading}
                                                    >
                                                        <X className="h-4 w-4" />
                                                        <span className="sr-only">Clear image</span>
                                                    </Button>
                                                </div>
                                            ) : isCameraOpen && !isNative ? (
                                                <div className="space-y-4">
                                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border">
                                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                                    </div>
                                                    {hasCameraPermission === false && (
                                                        <Alert variant="destructive">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <AlertTitle>Camera Access Required</AlertTitle>
                                                            <AlertDescription>
                                                                Please allow camera access to use this feature.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                    <div className="flex gap-2 justify-center">
                                                        <Button type="button" variant="outline" onClick={() => setIsCameraOpen(false)}>
                                                            Cancel
                                                        </Button>
                                                        <Button type="button" onClick={handleCapture} disabled={isClassifyLoading || isOcrLoading || hasCameraPermission !== true}>
                                                            <CameraIcon className="mr-2 h-4 w-4" />
                                                            Capture Photo
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="relative group flex flex-col justify-center items-center w-full h-64 border-2 border-dashed border-input rounded-lg cursor-pointer bg-card hover:border-primary transition-colors"
                                                    onClick={() => !(isClassifyLoading || isOcrLoading) && fileInputRef.current?.click()}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        disabled={isClassifyLoading || isOcrLoading}
                                                    />
                                                    <div className="text-center text-muted-foreground group-hover:text-primary transition-colors p-4">
                                                        <Upload className="mx-auto h-12 w-12 mb-2" />
                                                        <p className="font-semibold">Click to upload image</p>
                                                        <p className="text-sm">or drag and drop</p>
                                                        {/*<div className="relative flex py-4 items-center">*/}
                                                        {/*    <div className="flex-grow border-t border-muted-foreground/20"></div>*/}
                                                        {/*    <span className="flex-shrink mx-4 text-muted-foreground/50 text-xs">OR</span>*/}
                                                        {/*    <div className="flex-grow border-t border-muted-foreground/20"></div>*/}
                                                        {/*</div>*/}
                                                        {/*<Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); openCamera(); }} disabled={isClassifyLoading || isOcrLoading}>*/}
                                                        {/*    <Video className="mr-2 h-4 w-4" />*/}
                                                        {/*    Use Camera*/}
                                                        {/*</Button>*/}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {(isClassifyLoading || isOcrLoading) && (
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-muted-foreground">{activeTab === 'analyze-food' ? 'Analyzing your food...' : 'Scanning label...'}</p>
                            </div>
                        )}
                        {classifyError && activeTab === 'analyze-food' && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{classifyError}</AlertDescription>
                            </Alert>
                        )}
                        {ocrError && activeTab === 'scan-label' && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{ocrError}</AlertDescription>
                            </Alert>
                        )}
                        {classificationResult && activeTab === 'analyze-food' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-2xl">{classificationResult.classification}</CardTitle>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <span>Confidence</span>
                                                        <Progress value={classificationResult.confidence * 100} className="w-24" />
                                                        <span>{Math.round(classificationResult.confidence * 100)}%</span>
                                                    </div>
                                                </div>
                                                {isClassifyLoading && !allergenResult ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                ) : allergenResult ? (
                                                    <Badge
                                                        variant={classifyBadgeProps.variant}
                                                        className={cn("text-base px-4 py-1 flex-shrink-0", classifyBadgeProps.className)}
                                                    >
                                                        {classifyBadgeProps.children}
                                                    </Badge>
                                                ) : !classificationResult.foodDetails && (
                                                    <Badge variant="outline">UNKNOWN</Badge>
                                                )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(isClassifyLoading && !allergenResult) ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            <p className="text-muted-foreground">Checking for allergens...</p>
                                        </div>
                                    ) : allergenResult && (
                                        <Alert variant={classifyBadgeProps.variant === 'destructive' ? 'destructive' : 'default'}>
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
                                    {classificationResult.isFood && classificationResult.foodDetails ? (
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
                                        !isClassifyLoading && <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>Could Not Analyze Food Details</AlertTitle>
                                            <AlertDescription>
                                                {classificationResult.isFood ? "We classified this food, but we couldn't retrieve detailed ingredient or nutritional data for it at this time." : "The uploaded image does not appear to be food."}
                                            </AlertDescription>
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
                        {extractedText !== null && activeTab === 'scan-label' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle>Scan Results</CardTitle>
                                        {isOcrLoading && !ocrAllergenResult ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        ) : ocrAllergenResult && (
                                            <Badge
                                                variant={ocrBadgeProps.variant}
                                                className={cn("text-base px-4 py-1 flex-shrink-0", ocrBadgeProps.className)}
                                            >
                                                {ocrBadgeProps.children}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription>Review the extracted text and allergen check.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ocrAllergenResult && (
                                        <Alert variant={ocrBadgeProps.variant === 'destructive' ? 'destructive' : 'default'}>
                                            <Shield className="h-4 w-4" />
                                            <AlertTitle>{ocrAllergenResult.allergenDetected ? `Potential Allergen(s) Found!` : 'Looking Good!'}</AlertTitle>
                                            <AlertDescription>
                                                {ocrAllergenResult.allergenDetected ?
                                                    `We detected the following potential allergens based on your profile: ${ocrAllergenResult.detectedAllergens.join(', ')}.` :
                                                    'We did not detect any of your specified allergens in this product.'
                                                }
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Extracted Ingredients</h4>
                                        <Textarea readOnly value={extractedText} rows={8} className="text-sm bg-muted" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                    <CardFooter>
                        {activeTab === 'analyze-food' ? (
                            <Button type="submit" disabled={isClassifyLoading || !preview} className="w-full">
                                {isClassifyLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : "Analyze Food"}
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleScanLabel} disabled={isOcrLoading || !preview} className="w-full">
                                {isOcrLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Scanning...
                                    </>
                                ) : "Scan Product Label"}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Form>
            <canvas ref={canvasRef} className="hidden" />
        </Card>
    );
}
