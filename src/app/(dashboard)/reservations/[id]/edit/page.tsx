import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditReservationForm } from "@/components/reservations/EditReservationForm";

export const metadata = {
  title: "Rezervasyon Düzenle | Stüdyo Yönetim Sistemi",
  description: "Rezervasyon bilgilerini düzenleyin",
};

export const dynamic = "force-dynamic";

async function getReservation(id: string) {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    // Rezervasyonu getir
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Rezervasyon getirme hatası:", error);
      return null;
    }
    
    if (!reservation) {
      console.error("Rezervasyon bulunamadı");
      return null;
    }
    
    // Müşteri bilgilerini getir
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", reservation.customer_id)
      .single();
    
    if (customerError) {
      console.error("Müşteri getirme hatası:", customerError);
    }
    
    // Sanatçı bilgilerini getir
    const { data: artist, error: artistError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", reservation.artist_id)
      .maybeSingle();
    
    if (artistError) {
      console.error("Sanatçı getirme hatası:", artistError);
    }
    
    // Rezervasyon fotoğraflarını getir
    const { data: images, error: imagesError } = await supabase
      .from("reservation_images")
      .select("*")
      .eq("reservation_id", id);
    
    if (imagesError) {
      console.error("Rezervasyon fotoğrafları getirme hatası:", imagesError);
    }
    
    // Tüm verileri birleştir
    return {
      ...reservation,
      customers: customer || null,
      artists: artist || null,
      reservation_images: images || []
    };
  } catch (error) {
    console.error("Rezervasyon getirme işlemi sırasında hata:", error);
    return null;
  }
}

async function getUserRole() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    // Kullanıcı oturumunu kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    // Kullanıcı rolünü getir
    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();
    
    if (error || !user) {
      console.error("Kullanıcı rolü getirme hatası:", error);
      return null;
    }
    
    return user.role;
  } catch (error) {
    console.error("Kullanıcı rolü getirme işlemi sırasında hata:", error);
    return null;
  }
}

export default async function EditReservationPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await getReservation(params.id);
  const userRole = await getUserRole();
  
  // Rezervasyon bulunamadıysa 404 sayfasına yönlendir
  if (!reservation) {
    notFound();
  }
  
  // Yetkilendirme kontrolü
  if (userRole !== "admin" && userRole !== "designer") {
    // Yetkisiz erişim, ana sayfaya yönlendir
    redirect("/");
  }
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href={`/reservations/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Rezervasyon Detayına Dön
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Rezervasyon Düzenle
        </h1>
        <p className="text-muted-foreground mt-2">
          Rezervasyon bilgilerini güncelleyin
        </p>
      </div>
      
      <EditReservationForm reservation={reservation} userRole={userRole} />
    </div>
  );
} 