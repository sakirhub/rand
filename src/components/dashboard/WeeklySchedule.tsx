"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Hash } from "lucide-react";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WeeklySchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<any[]>([]);
  
  const supabase = createClientComponentClient();
  
  // Haftanın başlangıç gününü al (Pazartesi)
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Haftanın günlerini oluştur
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfCurrentWeek, i);
    return {
      date: day,
      dayName: format(day, "EEEE", { locale: tr }),
      dayNumber: format(day, "d", { locale: tr }),
      month: format(day, "MMMM", { locale: tr }),
    };
  });
  
  // Önceki haftaya git
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };
  
  // Sonraki haftaya git
  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };
  
  // Bugüne git
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Sanatçıları ve rezervasyonları getir
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Sanatçıları getir
      const { data: artistsData, error: artistsError } = await supabase
        .from("users")
        .select("id, name, avatar_url, role")
        .in("role", ["tattoo_artist", "designer"]);
      
      if (artistsError) {
        console.error("Sanatçılar getirilirken hata:", artistsError);
      } else {
        setArtists(artistsData || []);
      }
      
      // Haftanın başlangıç ve bitiş tarihlerini formatla
      const startDate = format(startOfCurrentWeek, "yyyy-MM-dd");
      const endDate = format(addDays(startOfCurrentWeek, 6), "yyyy-MM-dd");
      
      // Rezervasyonları getir
      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          *,
          customers:customer_id (*),
          artists:artist_id (*)
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("start_time", { ascending: true });
      
      if (reservationsError) {
        console.error("Rezervasyonlar getirilirken hata:", reservationsError);
      } else {
        setReservations(reservationsData || []);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [supabase, currentDate]);
  
  // Belirli bir gün ve sanatçı için rezervasyonları filtrele
  const getReservationsForDayAndArtist = (day: Date, artistId: string) => {
    return reservations.filter(reservation => 
      isSameDay(new Date(reservation.date), day) && 
      reservation.artist_id === artistId
    );
  };
  
  // Hizmet türünü Türkçe'ye çevir
  const getServiceType = (type: string) => {
    switch (type) {
      case "tattoo": return "Dövme";
      case "piercing": return "Piercing";
      case "consultation": return "Danışma";
      default: return type;
    }
  };
  
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Haftalık Çalışma Programı</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Bugün
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : artists.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Henüz sanatçı bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left font-medium">Sanatçı</th>
                  {weekDays.map((day) => (
                    <th 
                      key={day.date.toString()} 
                      className={`p-2 border-b text-left font-medium ${
                        isSameDay(day.date, new Date()) ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-normal">{day.dayName}</span>
                        <span>{day.dayNumber} {day.month}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {artists.map((artist) => (
                  <tr key={artist.id}>
                    <td className="p-2 border-b">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={artist.avatar_url} alt={artist.name} />
                          <AvatarFallback>{artist.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{artist.name}</span>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dayReservations = getReservationsForDayAndArtist(day.date, artist.id);
                      
                      return (
                        <td 
                          key={day.date.toString()} 
                          className={`p-2 border-b align-top ${
                            isSameDay(day.date, new Date()) ? "bg-muted/50" : ""
                          }`}
                        >
                          <div className="space-y-2">
                            {dayReservations.length > 0 ? (
                              dayReservations.map((reservation) => (
                                <Link key={reservation.id} href={`/reservations/${reservation.id}`}>
                                  <div className="p-2 rounded-md bg-card border text-sm hover:bg-muted transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="font-medium">
                                        {reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}
                                      </div>
                                      <ReservationStatusBadge status={reservation.status} />
                                    </div>
                                    
                                    <div className="flex items-center text-xs font-medium mb-1">
                                      <User className="mr-1 h-3 w-3" />
                                      <span className="truncate max-w-[120px]">
                                        {reservation.customers?.full_name || reservation.customers?.email || "Bilinmeyen Müşteri"}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                                      <Hash className="mr-1 h-3 w-3" />
                                      <span>#{reservation.id.substring(0, 8)}</span>
                                    </div>
                                    
                                    <div className="text-xs">
                                      {getServiceType(reservation.service_type)}
                                    </div>
                                  </div>
                                </Link>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground text-center py-2">
                                Rezervasyon yok
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 