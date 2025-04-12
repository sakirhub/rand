import { Suspense } from "react";
import { ReservationsClient } from "./client";

export default async function ReservationsPage() {
  return (
    <Suspense fallback={
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ReservationsClient />
    </Suspense>
  );
} 