import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Clock, Calendar, User } from "lucide-react";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { ReservationActions } from "@/components/reservations/ReservationActions";
import { ReservationImage } from "@/components/reservations/ReservationImage";
import Image from "next/image";

export const metadata = {
  title: "Rezervasyon Detayı | Stüdyo Yönetim Sistemi",
  description: "Rezervasyon detaylarını görüntüleyin",
};

export const dynamic = "force-dynamic";

async function getReservation(id: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Daha fazla hata ayıklama bilgisi ekleyelim
  console.log("Rezervasyon ID:", id);
  
  try {
    // Önce rezervasyonu temel bilgilerle alalım
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
    
    // Şimdi müşteri bilgilerini alalım
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", reservation.customer_id)
      .single();
    
    if (customerError) {
      console.error("Müşteri getirme hatası:", customerError);
    }
    
    // Sanatçı bilgilerini alalım
    const { data: artist, error: artistError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", reservation.artist_id)
      .maybeSingle();
    
    if (artistError) {
      console.error("Sanatçı getirme hatası:", artistError);
    }
    
    // Rezervasyon fotoğraflarını alalım
    const { data: reservationImages, error: imagesError } = await supabase
      .from("reservation_images")
      .select("*")
      .eq("reservation_id", id);
    
    if (imagesError) {
      console.error("Rezervasyon fotoğrafları getirme hatası:", imagesError);
    }
    
    // Fotoğrafları kategorilere ayır
    const beforeImages = reservationImages?.filter(img => img.is_before) || [];
    const afterImages = reservationImages?.filter(img => !img.is_before) || [];
    
    // Tüm verileri birleştirelim
    return {
      ...reservation,
      customers: customer || null,
      artists: artist || null,
      reservation_images: reservationImages || [],
      beforeImages: beforeImages,
      afterImages: afterImages
    };
  } catch (error) {
    console.error("Rezervasyon getirme işlemi sırasında hata:", error);
    return null;
  }
}

// Kullanıcı rolünü getir
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

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await getReservation(params.id);
  const userRole = await getUserRole();
  
  if (!reservation) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/reservations" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Rezervasyonlara Dön
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">Rezervasyon Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">
            Aradığınız rezervasyon bulunamadı veya erişim izniniz yok.
          </p>
          <Button asChild>
            <Link href="/reservations">Rezervasyonlara Dön</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Rezervasyon tarihini ve saatini formatla
  const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", { locale: tr });
  const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
  const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/reservations" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Rezervasyonlara Dön
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Rezervasyon Detayları
        </h1>
        <ReservationActions reservation={reservation} userRole={userRole} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Rezervasyon Bilgileri</CardTitle>
            <CardDescription>
              Rezervasyon ID: {reservation.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Durum</div>
                <div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Hizmet Türü</div>
                <div className="capitalize">
                  {reservation.service_type === "tattoo" ? "Dövme" : 
                   reservation.service_type === "piercing" ? "Piercing" : 
                   reservation.service_type === "consultation" ? "Konsültasyon" : 
                   reservation.service_type}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Tarih</div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {reservationDate}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Saat</div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {startTime} - {endTime} ({reservation.duration} dakika)
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Sanatçı</div>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  {reservation.artists?.name || "Belirtilmemiş"}
                </div>
              </div>
            </div>
            
            {reservation.notes && (
              <div className="space-y-2 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground">Notlar</div>
                <div className="text-sm">{reservation.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Ad Soyad</div>
              <div>{reservation.customers?.name || "Belirtilmemiş"}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">E-posta</div>
              <div>{reservation.customers?.email || "Belirtilmemiş"}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Telefon</div>
              <div>{reservation.customers?.phone || "Belirtilmemiş"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {reservation.beforeImages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Öncesi Fotoğrafları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reservation.beforeImages.map((image: ReservationImage) => (
                <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image 
                    src={image.image_url}
                    alt="Öncesi fotoğrafı"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {reservation.afterImages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sonrası Fotoğrafları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reservation.afterImages.map((image: ReservationImage) => (
                <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image 
                    src={image.image_url}
                    alt="Sonrası fotoğrafı"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 