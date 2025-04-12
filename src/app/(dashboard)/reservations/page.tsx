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
import { ReservationFilters } from "@/components/reservations/ReservationFilters";
import { useSearchParams } from "next/navigation";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Yenileme tetikleyicisi
  const [view, setView] = useLocalStorage<"list" | "table">("reservations-view", "list");
  
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  
  // Manuel yenileme fonksiyonu
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Kullanıcı oturumunu kontrol et
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = "/login";
          return;
        }
        
        // Kullanıcı rolünü kontrol et
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (userError) {
          console.error("Kullanıcı rolü getirme hatası:", userError);
          setLoading(false);
          return;
        }
        
        const userRole = userData?.role;
        
        // Filtreleri al
        const status = searchParams.get("status");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const search = searchParams.get("search");
        
        // Sorguyu oluştur
        let query = supabase
          .from("reservations")
          .select(`
            *,
            customers:customer_id(*),
            artists:artist_id(*)
          `);
        
        // Filtreleri uygula
        if (status && status !== "all") {
          query = query.eq("status", status);
        }
        
        if (dateFrom) {
          query = query.gte("date", dateFrom);
        }
        
        if (dateTo) {
          query = query.lte("date", dateTo);
        }
        
        if (search) {
          query = query.or(`
            customers.name.ilike.%${search}%,
            customers.email.ilike.%${search}%,
            customers.phone.ilike.%${search}%
          `);
        }
        
        // Kullanıcı rolüne göre filtreleme
        if (userRole === "tattoo_artist") {
          query = query.eq("artist_id", session.user.id);
        }
        
        // Sıralama
        query = query.order("date", { ascending: false });
        
        // Sorguyu çalıştır
        const { data, error } = await query;
        
        if (error) {
          console.error("Rezervasyonlar yüklenirken hata:", error);
          throw error;
        }
        
        setReservations(data || []);
      } catch (error) {
        console.error("Rezervasyonlar sayfası yüklenirken beklenmeyen hata:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [supabase, searchParams, refreshKey]); // refreshKey değiştiğinde yeniden veri çek
  
  // Kullanıcı rolünü al
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    async function getUserRole() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        setUserRole(data?.role || null);
      }
    }
    
    getUserRole();
  }, [supabase]);
  
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rezervasyonlar</h1>
        
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
          
          {(userRole === "admin" || userRole === "designer") && (
            <Button asChild>
              <Link href="/reservations/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Rezervasyon
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <ReservationFilters />
      
      {view === "list" ? (
        <ReservationList 
          reservations={reservations} 
          userRole={userRole || "info"} 
          onStatusChange={handleRefresh}
        />
      ) : (
        <ReservationTable 
          reservations={reservations} 
          userRole={userRole || "info"} 
          onStatusChange={handleRefresh}
        />
      )}
    </div>
  );
} 