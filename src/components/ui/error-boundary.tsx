"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Yakalanan hata:", error);
      setError(error.error);
      setHasError(true);
    };
    
    window.addEventListener("error", errorHandler);
    
    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);
  
  const handleReset = () => {
    setHasError(false);
    setError(null);
  };
  
  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Bir Hata Oluştu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Üzgünüz, bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          {error && (
            <div className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
              <p className="font-mono">{error.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Yeniden Dene
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return <>{children}</>;
} 