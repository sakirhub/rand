import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Trash, Calendar, Clock, User, Phone, Mail, MapPin, CreditCard, Info, AlertCircle } from "lucide-react";
import { DeleteReservationButton } from "@/components/reservations/DeleteReservationButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { ReservationActions } from "@/components/reservations/ReservationActions";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { PaymentHistory } from "@/components/reservations/PaymentHistory";
import { AddPaymentForm } from "@/components/reservations/AddPaymentForm";

export const metadata = {
  title: "Rezervasyon Detayı | Stüdyo Yönetim Sistemi",
  description: "Rezervasyon detaylarını görüntüleyin",
};

export const dynamic = "force-dynamic";

async function getReservation(id: string) {
  const supabase = createServerComponentClient({ cookies });
  
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
    
    console.log("Rezervasyon bulundu:", reservation.id);
    
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
    
    // Rezervasyon fotoğraflarını alalım
    const { data: reservationImages, error: imagesError } = await supabase
      .from("reservation_images")
      .select("*")
      .eq("reservation_id", id);
    
    if (imagesError) {
      console.error("Rezervasyon fotoğrafları getirme hatası:", imagesError);
    }
    
    // Ödeme bilgilerini alalım
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("reservation_id", id)
      .order("created_at", { ascending: false });
    
    if (paymentsError) {
      console.error("Ödeme bilgileri getirme hatası:", paymentsError);
    }
    
    // Tüm verileri birleştirelim
    const result = {
      ...reservation,
      customers: customer || null,
      artists: artist || null,
      reservation_images: reservationImages || [],
      payments: payments || []
    };
    
    console.log("Birleştirilmiş rezervasyon verisi:", {
      id: result.id,
      customer: result.customers ? "Var" : "Yok",
      artist: result.artists ? "Var" : "Yok",
      images: result.reservation_images.length,
      payments: result.payments.length
    });
    
    return result;
  } catch (error) {
    console.error("Rezervasyon getirme işlemi sırasında hata:", error);
    return null;
  }
}

// Kullanıcı rolünü getir
async function getUserRole() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
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
  console.log("Sayfa parametreleri:", params);
  
  try {
    const reservation = await getReservation(params.id);
    const userRole = await getUserRole();
    
    console.log("Rezervasyon durumu:", reservation ? "Bulundu" : "Bulunamadı");
    
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
            <p className="text-muted-foreground mb-2">
              Aradığınız rezervasyon bulunamadı veya erişim izniniz yok.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Rezervasyon ID: {params.id}
            </p>
            <Button asChild>
              <Link href="/reservations">Rezervasyonlara Dön</Link>
            </Button>
          </div>
        </div>
      );
    }
    
    // Tarih ve saat formatlamaları
    const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", { locale: tr });
    const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
    const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
    
    // Hizmet türü çevirisi
    const getServiceTypeText = (type: string) => {
      switch (type) {
        case "tattoo":
          return "Dövme";
        case "piercing":
          return "Piercing";
        case "consultation":
          return "Konsültasyon";
        default:
          return type;
      }
    };
    
    // Toplam ödeme tutarı hesapla
    const totalPaid = reservation.payments?.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0) || 0;
    const remainingAmount = reservation.price - totalPaid;
    
    return (
      <div className="container py-8">
        {/* Üst Navigasyon */}
        <div className="mb-6">
          <Link href="/reservations" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Rezervasyonlara Dön
          </Link>
        </div>
        
        {/* Başlık ve İşlemler */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Rezervasyon #{reservation.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {reservationDate} • {startTime} - {endTime}
            </p>
          </div>
          <ReservationActions reservation={reservation} userRole={userRole} />
        </div>
        
        {/* Ana İçerik */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Detaylar</TabsTrigger>
            <TabsTrigger value="customer">Müşteri</TabsTrigger>
            <TabsTrigger value="artist">Sanatçı</TabsTrigger>
            <TabsTrigger value="payments">Ödemeler</TabsTrigger>
            <TabsTrigger value="images">Fotoğraflar</TabsTrigger>
          </TabsList>
          
          {/* Detaylar Sekmesi */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rezervasyon Bilgileri */}
              <Card>
                <CardHeader>
                  <CardTitle>Rezervasyon Bilgileri</CardTitle>
                  <CardDescription>
                    Temel rezervasyon detayları
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Durum</div>
                      <ReservationStatusBadge status={reservation.status} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Hizmet Türü</div>
                      <div className="capitalize">
                        {getServiceTypeText(reservation.service_type)}
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
                      <div className="text-sm font-medium text-muted-foreground">Süre</div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {reservation.duration} dakika
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
              
              {/* Özet Bilgiler */}
              <Card>
                <CardHeader>
                  <CardTitle>Özet Bilgiler</CardTitle>
                  <CardDescription>
                    Rezervasyon özeti ve durumu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Toplam Tutar</div>
                      <div className="text-lg font-semibold">
                        {reservation.price.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Ödenen</div>
                      <div className="text-lg font-semibold text-green-600">
                        {totalPaid.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Kalan</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {remainingAmount.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Oluşturulma</div>
                      <div className="text-sm">
                        {format(new Date(reservation.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
                      </div>
                    </div>
                  </div>
                  
                  {remainingAmount > 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ödenmemiş Tutar</AlertTitle>
                      <AlertDescription>
                        Bu rezervasyon için {remainingAmount.toLocaleString('tr-TR')} ₺ ödenmemiş tutar bulunmaktadır.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Müşteri Sekmesi */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
                <CardDescription>
                  Rezervasyonu yapan müşterinin detaylı bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Adres</div>
                    <div>{reservation.customers?.address || "Belirtilmemiş"}</div>
                  </div>
                </div>
                
                {reservation.customers?.notes && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium text-muted-foreground">Müşteri Notları</div>
                    <div className="text-sm">{reservation.customers.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Sanatçı Sekmesi */}
          <TabsContent value="artist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sanatçı Bilgileri</CardTitle>
                <CardDescription>
                  Rezervasyonda görevli sanatçının detaylı bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Ad Soyad</div>
                    <div>{reservation.artists?.name || "Belirtilmemiş"}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">E-posta</div>
                    <div>{reservation.artists?.email || "Belirtilmemiş"}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Telefon</div>
                    <div>{reservation.artists?.phone || "Belirtilmemiş"}</div>
                  </div>
                </div>
                
                {reservation.artists?.bio && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium text-muted-foreground">Hakkında</div>
                    <div className="text-sm">{reservation.artists.bio}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Ödemeler Sekmesi */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PaymentHistory 
                reservationId={reservation.id} 
                totalPrice={reservation.price} 
              />
              
              {(userRole === "admin" || userRole === "designer") && (
                <AddPaymentForm 
                  reservationId={reservation.id} 
                  totalPrice={reservation.price} 
                  totalPaid={totalPaid} 
                />
              )}
            </div>
          </TabsContent>
          
          {/* Fotoğraflar Sekmesi */}
          <TabsContent value="images" className="space-y-6">
            {reservation.reservation_images && reservation.reservation_images.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Referans Fotoğrafları</CardTitle>
                  <CardDescription>
                    Rezervasyona ait tüm fotoğraflar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reservation.reservation_images.map((image: { id: string; image_url: string }) => (
                      <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                        <img 
                          src={image.image_url} 
                          alt="Referans fotoğrafı" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    Henüz fotoğraf eklenmemiş
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Rezervasyon detay sayfası yüklenirken hata oluştu:", error);
    
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/reservations" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Rezervasyonlara Dön
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">Bir Hata Oluştu</h1>
          <p className="text-muted-foreground mb-2">
            Rezervasyon detayları yüklenirken bir hata oluştu.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Lütfen daha sonra tekrar deneyin veya sistem yöneticisiyle iletişime geçin.
          </p>
          <Button asChild>
            <Link href="/reservations">Rezervasyonlara Dön</Link>
          </Button>
        </div>
      </div>
    );
  }
} 