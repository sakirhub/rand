import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ReservationForm } from "@/components/reservations/ReservationForm";

export const metadata = {
  title: "Yeni Rezervasyon | Stüdyo Yönetim Sistemi",
  description: "Yeni rezervasyon oluşturun",
};

export default async function NewReservationPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Kullanıcı oturumunu kontrol et
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  
  return (
    <div className="space-y-6">
      <div>
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Rezervasyonlar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Yeni Rezervasyon</h1>
        <p className="text-muted-foreground">Yeni bir rezervasyon oluşturun.</p>
      </div>
      <div className="grid gap-8">
        <ReservationForm />
      </div>
    </div>
  );
} 