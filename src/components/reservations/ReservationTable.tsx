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
import { MoreHorizontal, Eye, Edit, Trash, Check, X } from "lucide-react";
import { DeleteReservationButton } from "./DeleteReservationButton";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Reservation, UserRole } from "@/types";

interface ReservationTableProps {
  reservations: Reservation[];
  userRole: UserRole;
  onStatusChange?: () => void;
}

export function ReservationTable({ reservations, userRole, onStatusChange }: ReservationTableProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Müşteri</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Saat</TableHead>
            <TableHead>Sanatçı</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => {
            // Tarih ve saat formatlamaları
            const reservationDate = format(parseISO(reservation.date), "d MMMM yyyy", { locale: tr });
            const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
            const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";
            
            return (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">
                  {reservation.customers?.name || "İsimsiz Müşteri"}
                </TableCell>
                <TableCell>{reservationDate}</TableCell>
                <TableCell>{startTime} - {endTime}</TableCell>
                <TableCell>{reservation.artists?.name || "Atanmamış"}</TableCell>
                <TableCell>
                  <ReservationStatusBadge status={reservation.status} />
                </TableCell>
                <TableCell>
                  {reservation.service_type === "tattoo" ? "Dövme" : 
                   reservation.service_type === "piercing" ? "Piercing" : 
                   reservation.service_type === "consultation" ? "Konsültasyon" : 
                   reservation.service_type}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menüyü aç</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/reservations/${reservation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Görüntüle
                        </Link>
                      </DropdownMenuItem>
                      
                      {canEdit && (
                        <DropdownMenuItem asChild>
                          <Link href={`/reservations/${reservation.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      {userRole === "admin" && (
                        <>
                          {reservation.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(reservation.id, "completed")}
                              disabled={processingIds.includes(reservation.id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Tamamlandı Olarak İşaretle
                            </DropdownMenuItem>
                          )}
                          
                          {reservation.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(reservation.id, "cancelled")}
                              disabled={processingIds.includes(reservation.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              İptal Et
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem asChild>
                            <DeleteReservationButton id={reservation.id} onDelete={onStatusChange}>
                              <Trash className="mr-2 h-4 w-4" />
                              Sil
                            </DeleteReservationButton>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 