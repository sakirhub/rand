import { Suspense } from "react";
import { AdminReservationsClient } from "./client";

export default async function AdminReservationsPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <AdminReservationsClient />
    </Suspense>
  );
} 