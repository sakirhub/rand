"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";

interface ReservationActionsProps {
  reservation: any;
  userRole?: string | null;
}

export function ReservationActions({ reservation, userRole }: ReservationActionsProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleEdit = () => {
    router.push(`/reservations/${reservation.id}/edit`);
  };
  
  const handleDelete = async () => {
    // Kullanıcıdan onay al
    const confirmed = window.confirm("Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    
    if (!confirmed) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Önce rezervasyon fotoğraflarını sil
      if (reservation.reservation_images && reservation.reservation_images.length > 0) {
        const { error: imagesError } = await supabase
          .from("reservation_images")
          .delete()
          .eq("reservation_id", reservation.id);
        
        if (imagesError) {
          console.error("Rezervasyon fotoğrafları silinirken hata:", imagesError);
        }
      }
      
      // Rezervasyonu sil
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Rezervasyon silindi",
        description: "Rezervasyon başarıyla silindi.",
      });
      
      router.push("/reservations");
      router.refresh();
    } catch (error) {
      console.error("Rezervasyon silinirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Rezervasyon silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", reservation.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Durum güncellendi",
        description: `Rezervasyon durumu "${newStatus}" olarak güncellendi.`,
      });
      
      router.refresh();
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  const canEdit = userRole === "admin" || userRole === "designer";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
        )}
        
        {userRole === "admin" && (
          <>
            {reservation.status === "pending" && (
              <DropdownMenuItem onClick={() => handleStatusChange("confirmed")}>
                <Check className="mr-2 h-4 w-4" />
                Onayla
              </DropdownMenuItem>
            )}
            
            {reservation.status === "confirmed" && (
              <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                <Check className="mr-2 h-4 w-4" />
                Tamamlandı Olarak İşaretle
              </DropdownMenuItem>
            )}
            
            {(reservation.status === "pending" || reservation.status === "confirmed") && (
              <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                <X className="mr-2 h-4 w-4" />
                İptal Et
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Siliniyor..." : "Sil"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 