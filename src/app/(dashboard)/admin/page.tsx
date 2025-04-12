import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { Calendar, Clock, User, Hash, Users, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Kullanıcı oturumunu kontrol et
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  // Kullanıcı rolünü kontrol et
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  if (userError || userData?.role !== "admin") {
    redirect("/dashboard");
  }
  
  // Bekleyen rezervasyonları getir
  const { data: pendingReservations, error: pendingError } = await supabase
    .from("reservations")
    .select(`
      *,
      customers:customer_id (*),
      artists:artist_id (*)
    `)
    .eq("status", "pending")
    .order("date", { ascending: true });
  
  if (pendingError) {
    console.error("Bekleyen rezervasyonlar getirilirken hata:", pendingError);
  }
  
  // Bugünkü rezervasyonları getir
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayReservations, error: todayError } = await supabase
    .from("reservations")
    .select(`
      *,
      customers:customer_id (*),
      artists:artist_id (*)
    `)
    .eq("date", today)
    .order("start_time", { ascending: true });
  
  if (todayError) {
    console.error("Bugünkü rezervasyonlar getirilirken hata:", todayError);
  }
  
  // Toplam rezervasyon sayısını getir
  const { count: totalReservations, error: totalError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true });
  
  if (totalError) {
    console.error("Toplam rezervasyon sayısı getirilirken hata:", totalError);
  }
  
  // Tamamlanan rezervasyon sayısını getir
  const { count: completedReservations, error: completedError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");
  
  if (completedError) {
    console.error("Tamamlanan rezervasyon sayısı getirilirken hata:", completedError);
  }
  
  // İptal edilen rezervasyon sayısını getir
  const { count: cancelledReservations, error: cancelledError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled");
  
  if (cancelledError) {
    console.error("İptal edilen rezervasyon sayısı getirilirken hata:", cancelledError);
  }
  
  // Toplam kullanıcı sayısını getir
  const { count: totalUsers, error: usersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  
  if (usersError) {
    console.error("Toplam kullanıcı sayısı getirilirken hata:", usersError);
  }
  
  // Hizmet türüne göre metin
  const getServiceType = (type: string) => {
    switch (type) {
      case "tattoo": return "Dövme";
      case "piercing": return "Piercing";
      case "consultation": return "Danışma";
      default: return type;
    }
  };
  
  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Admin Paneli
        </h1>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Rezervasyon
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tamamlanan Rezervasyon
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              İptal Edilen Rezervasyon
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kullanıcı
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Bekleyen Rezervasyonlar ve Bugünkü Rezervasyonlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bekleyen Rezervasyonlar */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bekleyen Rezervasyonlar</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/reservations?status=pending">
                  Tümünü Gör
                </Link>
              </Button>
            </div>
            <CardDescription>
              Onay bekleyen rezervasyonlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReservations && pendingReservations.length > 0 ? (
              <div className="space-y-4">
                {pendingReservations.slice(0, 5).map((reservation) => {
                  const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", { locale: tr });
                  const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
                  const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
                  
                  return (
                    <div key={reservation.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{getServiceType(reservation.service_type)}</h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Hash className="mr-1 h-3 w-3" />
                            <span>#{reservation.id.substring(0, 8)}</span>
                          </div>
                        </div>
                        <ReservationStatusBadge status={reservation.status} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{reservationDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {reservation.customers?.full_name || reservation.customers?.email || "Bilinmeyen Müşteri"}
                          </span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{reservation.artists?.name || "Bilinmeyen Sanatçı"}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/reservations/${reservation.id}`}>
                            Detayları Görüntüle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Bekleyen rezervasyon bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Bugünkü Rezervasyonlar */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bugünkü Rezervasyonlar</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/reservations?date=${today}`}>
                  Tümünü Gör
                </Link>
              </Button>
            </div>
            <CardDescription>
              {format(new Date(), "d MMMM yyyy", { locale: tr })} tarihli rezervasyonlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayReservations && todayReservations.length > 0 ? (
              <div className="space-y-4">
                {todayReservations.slice(0, 5).map((reservation) => {
                  const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
                  const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
                  
                  return (
                    <div key={reservation.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{getServiceType(reservation.service_type)}</h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Hash className="mr-1 h-3 w-3" />
                            <span>#{reservation.id.substring(0, 8)}</span>
                          </div>
                        </div>
                        <ReservationStatusBadge status={reservation.status} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center col-span-2">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {reservation.customers?.full_name || reservation.customers?.email || "Bilinmeyen Müşteri"}
                          </span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{reservation.artists?.name || "Bilinmeyen Sanatçı"}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/reservations/${reservation.id}`}>
                            Detayları Görüntüle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Bugün için rezervasyon bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Haftalık Çalışma Programı */}
      <WeeklySchedule />
    </div>
  );
} 