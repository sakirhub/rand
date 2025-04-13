import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    
    // Rezervasyon fotoğraflarını getir
    const { data: images, error: imagesError } = await supabase
      .from("reservation_images")
      .select("*")
      .eq("reservation_id", id);
    
    if (imagesError) {
      console.error("Rezervasyon fotoğrafları getirme hatası:", imagesError);
    }
    
    // Ödeme bilgilerini getir - Payments tablosu henüz oluşturulmadığı için bu kısmı kaldırıyoruz
    // const { data: payments, error: paymentsError } = await supabase
    //   .from("payments")
    //   .select("*")
    //   .eq("reservation_id", id);
    
    // if (paymentsError) {
    //   console.error("Ödeme bilgileri getirme hatası:", paymentsError);
    // }
    
    // Sanatçı bilgilerini getir
    console.log("Sanatçı ID:", reservation.artist_id);
    
    // Veritabanı tablolarını kontrol et
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");
    
    if (tablesError) {
      console.error("Tablo listesi getirme hatası:", tablesError);
    } else {
      console.log("Veritabanı tabloları:", tables?.map(t => t.table_name).join(", "));
    }
    
    // Artists tablosunu kontrol et
    const { data: artistsColumns, error: artistsColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "artists");
    
    if (artistsColumnsError) {
      console.error("Artists tablosu kolonları getirme hatası:", artistsColumnsError);
    } else {
      console.log("Artists tablosu kolonları:", artistsColumns?.map(c => c.column_name).join(", "));
    }
    
    let artist = null;
    
    if (!reservation.artist_id) {
      console.log("Sanatçı ID bulunamadı, bu rezervasyona atanmış sanatçı yok.");
    } else {
      // Artists tablosundan sanatçı bilgilerini çek
      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .select("id, name, email, phone, bio")
        .eq("id", reservation.artist_id)
        .maybeSingle();
      
      if (artistError) {
        console.error("Artists tablosundan sanatçı getirme hatası:", artistError);
        console.error("Hata detayları:", JSON.stringify(artistError, null, 2));
      } else if (!artistData) {
        console.log("Artists tablosunda sanatçı bulunamadı, ID:", reservation.artist_id);
      } else {
        console.log("Artists tablosundan sanatçı bulundu:", artistData.name);
        artist = artistData;
      }
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