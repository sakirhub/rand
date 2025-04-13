"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash, Check, X } from "lucide-react";
import { DeleteReservationButton } from "./DeleteReservationButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { Calendar, Clock, User, Hash } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface Reservation {
  id: string;
  customer_id: string;
  artist_id: string;
  service_type: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  notes?: string;
  artists?: {
    id: string;
    name: string;
    type: string;
  };
  customers?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

interface ReservationListProps {
  reservations: Reservation[];
  userRole?: string;
  userId?: string;
  onStatusChange?: () => void;
}

export function ReservationList({ reservations, userRole, userId, onStatusChange }: ReservationListProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  // Duruma göre filtrele
  const filteredReservations = selectedStatus
    ? reservations.filter(reservation => reservation.status === selectedStatus)
    : reservations;
  
  // Duruma göre badge rengi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Beklemede</Badge>;
      case "confirmed":
        return <Badge variant="secondary">Onaylandı</Badge>;
      case "completed":
        return <Badge variant="default">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge variant="destructive">İptal Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Hizmet türüne göre metin
  const getServiceType = (type: string) => {
    switch (type) {
      case "tattoo":
        return "Dövme";
      case "piercing":
        return "Piercing";
      case "consultation":
        return "Danışma";
      default:
        return type;
    }
  };
  
  // Kullanıcının düzenleme yetkisi var mı?
  const canEdit = userRole === "admin" || userRole === "designer";
  
  // Rezervasyon durumunu güncelle
  const handleStatusChange = async (id: string, newStatus: string) => {
    setProcessingIds(prev => [...prev, id]);
    
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Yerel state'i güncelle
      const updatedReservations = reservations.map(res => 
        res.id === id ? { ...res, status: newStatus } : res
      );
      
      // Ebeveyn bileşeni bilgilendir
      if (onStatusChange) {
        onStatusChange();
      }
      
      toast({
        title: "Durum güncellendi",
        description: `Rezervasyon durumu "${newStatus}" olarak güncellendi.`,
      });
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };
  
  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Henüz rezervasyon bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredReservations.map((reservation) => {
        // Tarih ve saat formatla
        const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", { locale: tr });
        const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
        const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
        
        // Hizmet türünü Türkçe'ye çevir
        const serviceType = 
          reservation.service_type === "tattoo" ? "Dövme" : 
          reservation.service_type === "piercing" ? "Piercing" : 
          reservation.service_type === "consultation" ? "Konsültasyon" : 
          reservation.service_type;
        
        // İşlem yapılıyor mu?
        const isProcessing = processingIds.includes(reservation.id);
        
        return (
          <Card key={reservation.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{serviceType}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Hash className="mr-1 h-3 w-3" />
                      <span>#{reservation.id.substring(0, 8)}</span>
                    </div>
                  </div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{reservationDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{startTime} - {endTime}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{reservation.customers?.full_name || reservation.customers?.email || "Bilinmeyen Müşteri"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{reservation.artists?.name || "Bilinmeyen Sanatçı"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-3 flex flex-col space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/reservations/${reservation.id}`}>
                  Detayları Görüntüle
                </Link>
              </Button>
              
              {userRole === "admin" && (
                <div className="flex w-full space-x-2">
                  {reservation.status === "pending" && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStatusChange(reservation.id, "confirmed")}
                      disabled={isProcessing}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Onayla
                    </Button>
                  )}
                  
                  {(reservation.status === "pending" || reservation.status === "confirmed") && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStatusChange(reservation.id, "cancelled")}
                      disabled={isProcessing}
                    >
                      <X className="mr-1 h-4 w-4" />
                      İptal Et
                    </Button>
                  )}
                  
                  {reservation.status === "confirmed" && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStatusChange(reservation.id, "completed")}
                      disabled={isProcessing}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Tamamlandı
                    </Button>
                  )}
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}