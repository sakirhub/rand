"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ReservationList } from "@/components/reservations/ReservationList";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import { ViewToggle } from "@/components/reservations/ViewToggle";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Yenileme tetikleyicisi
  const [view, setView] = useLocalStorage<"list" | "table">("reservations-view", "list");
  
  const supabase = createClientComponentClient();
  
  // Manuel yenileme fonksiyonu
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Kullanıcı oturumunu kontrol et
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }
      
      // Kullanıcı rolünü getir
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      if (userError) {
        console.error("Kullanıcı rolü getirilirken hata:", userError);
      } else {
        setUser(userData);
      }
      
      // Rezervasyonları getir
      let query = supabase
        .from("reservations")
        .select(`
          *,
          customers:customer_id (*),
          artists:artist_id (*),
          reservation_images (*)
        `);
      
      // Kullanıcı rolüne göre filtreleme yap
      if (userData?.role === "tattoo_artist") {
        // Dövme sanatçıları sadece kendilerine atanan rezervasyonları görebilir
        query = query.eq("artist_id", session.user.id);
      } else if (userData?.role === "info") {
        // Info kullanıcıları sadece kendi yönlendirdikleri müşterilerin rezervasyonlarını görebilir
        query = query.eq("referred_by", session.user.id);
      }
      
      // Rezervasyonları tarihe göre sırala
      const { data, error } = await query.order("date", { ascending: false });
      
      if (error) {
        console.error("Rezervasyonlar getirilirken hata:", error);
      } else {
        console.log("Gelen rezervasyon verileri:", data);
        setReservations(data || []);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [supabase, refreshKey]); // refreshKey değiştiğinde yeniden veri çek
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  // Kullanıcı giriş yapmamışsa
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">Erişim Reddedildi</h1>
          <p className="text-muted-foreground mb-6">
            Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.
          </p>
          <Button asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Rezervasyonlar
        </h1>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <ViewToggle currentView={view} onViewChange={setView} />
          {(user?.role === "admin" || user?.role === "designer") && (
            <Button asChild>
              <Link href="/reservations/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Rezervasyon
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {view === "list" ? (
        <ReservationList 
          reservations={reservations} 
          userRole={user?.role} 
          onStatusChange={handleRefresh} 
        />
      ) : (
        <ReservationTable 
          reservations={reservations} 
          userRole={user?.role} 
          onStatusChange={handleRefresh}
        />
      )}
    </div>
  );
} 