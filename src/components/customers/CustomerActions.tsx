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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Customer } from "./CustomerTable";

interface CustomerActionsProps {
  customer: Customer;
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleEdit = () => {
    router.push(`/customers/${customer.id}/edit`);
  };
  
  const handleDelete = async () => {
    const confirmed = window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    
    if (!confirmed) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Müşteri silindi",
        description: "Müşteri başarıyla silindi.",
      });
      
      router.refresh();
    } catch (error) {
      console.error("Müşteri silinirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Düzenle
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Siliniyor..." : "Sil"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 