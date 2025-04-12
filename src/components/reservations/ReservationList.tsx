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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { Calendar, Clock, User, Hash } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Reservation, UserRole } from "@/types";

interface ReservationListProps {
  reservations: Reservation[];
  userRole: UserRole;
  onStatusChange?: () => void;
}

export function ReservationList({ reservations, userRole, onStatusChange }: ReservationListProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      toast({
        title: "Durum güncellendi",
        description: `Rezervasyon durumu "${newStatus}" olarak güncellendi.`,
      });
      
      // Yenileme fonksiyonu varsa çağır
      if (onStatusChange) {
        onStatusChange();
      } else {
        // Yoksa sayfayı yenile
        router.refresh();
      }
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
  
  if (reservations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">Henüz rezervasyon bulunmuyor.</p>
        {(userRole === "admin" || userRole === "designer") && (
          <Button asChild>
            <Link href="/reservations/new">Yeni Rezervasyon Oluştur</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredReservations.map((reservation) => {
        // Tarih ve saat formatlamaları
        const reservationDate = format(parseISO(reservation.date), "d MMMM yyyy", { locale: tr });
        const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
        const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
        
        return (
          <Link key={reservation.id} href={`/reservations/${reservation.id}`}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{reservation.customers?.name || "İsimsiz Müşteri"}</CardTitle>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
                <CardDescription>
                  <div className="flex items-center mt-1">
                    <Hash className="mr-1 h-3 w-3" />
                    <span>#{reservation.id.substring(0, 8)}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{reservationDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{startTime} - {endTime}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{reservation.artists?.name || "Atanmamış"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <div className="text-xs text-muted-foreground mt-2">
                    {reservation.service_type === "tattoo" ? "Dövme" : 
                     reservation.service_type === "piercing" ? "Piercing" : 
                     reservation.service_type === "consultation" ? "Konsültasyon" : 
                     reservation.service_type}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}