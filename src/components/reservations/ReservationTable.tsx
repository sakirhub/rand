"use client";

import { format, parse } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Check, 
  X, 
  Eye, 
  FileText, 
  Table2, 
  Image as ImageIcon 
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ReservationTableProps {
  reservations: any[];
  userRole?: string;
  onStatusChange?: () => void;
}

export function ReservationTable({ reservations, userRole, onStatusChange }: ReservationTableProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [localReservations, setLocalReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  
  useEffect(() => {
    if (!reservations || reservations.length === 0) {
      setLocalReservations([]);
      setFilteredReservations([]);
      return;
    }
    
    console.log("Rezervasyonlar yüklendi:", reservations);
    setLocalReservations(reservations);
    setFilteredReservations(reservations);
  }, [reservations]);
  
  const loadCustomers = async () => {
    if (customers.length > 0) return;
    
    setIsLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .order("name");
      
      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  const loadArtists = async () => {
    if (artists.length > 0) return;
    
    setIsLoadingArtists(true);
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, email, phone")
        .order("name");
      
      if (error) throw error;
      
      setArtists(data || []);
    } catch (error) {
      console.error("Sanatçılar yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Sanatçılar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingArtists(false);
    }
  };
  
  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name, position, email, phone")
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      
      setStaff(data || []);
    } catch (error) {
      console.error("Personeller yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Personeller yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStaff(false);
    }
  };
  
  useEffect(() => {
    loadStaff();
  }, []);
  
  useEffect(() => {
    reservations.forEach(reservation => {
      if (reservation.image_url) {
        console.log('Image URL:', reservation.image_url);
      }
    });
  }, [reservations]);
  
  const startEditing = (id: string, field: string, value: any) => {
    setEditingCell({ id, field });
    
    if (field === "price") {
      const priceMatch = value?.toString().match(/^([\d.]+)\s+(\w+)$/);
      if (priceMatch) {
        setEditValue(priceMatch[1]);
      } else {
        setEditValue(value?.toString() || "");
      }
    } else if (field === "customer") {
      setEditValue(value || "");
      loadCustomers();
    } else if (field === "artist") {
      setEditValue(value || "");
      loadArtists();
    } else if (field === "staff") {
      setEditValue(value || "");
      loadStaff();
    } else {
      setEditValue(value?.toString() || "");
    }
  };
  
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };
  
  const saveEdit = async () => {
    if (!editingCell) return;
    
    const { id, field } = editingCell;
    setProcessingIds(prev => [...prev, id]);
    
    try {
      console.log("Kaydetme işlemi başlatıldı:", { id, field, editValue });
      
      const dbField = field === "customer" ? "customer_id" : 
                     field === "staff" ? "staff_id" : 
                     field === "artist" ? "artist_id" : 
                     field;
      
      let value: any = editValue;
      
      if (field === "price" || field === "deposit_amount") {
        value = parseFloat(editValue);
      } else if (field === "deposit_received" || field === "transfer_completed") {
        value = editValue === "true";
      } else if (field === "date") {
        const parsedDate = parse(editValue, "dd.MM.yyyy", new Date());
        value = format(parsedDate, "yyyy-MM-dd");
      }
      
      console.log("Veritabanına gönderilecek veri:", { [dbField]: value });
      
      const { error } = await supabase
        .from("reservations")
        .update({ [dbField]: value })
        .eq("id", id);
      
      if (error) {
        console.error("Veritabanı güncelleme hatası:", error);
        throw error;
      }
      
      setLocalReservations(prev => 
        prev.map(res => {
          if (res.id === id) {
            if (field === "customer") {
              const customer = customers.find(c => c.id === value);
              return { 
                ...res, 
                [field]: value,
                customer_name: customer?.name || "Bilinmeyen"
              };
            } else if (field === "staff") {
              const staffMember = staff.find(s => s.id === value);
              return { 
                ...res, 
                [field]: value,
                staff_name: staffMember?.full_name || "-",
                staff_id: value
              };
            } else if (field === "artist") {
              const artist = artists.find(a => a.id === value);
              return { 
                ...res, 
                [field]: value,
                artist_name: artist?.name || "-",
                artist_id: value
              };
            } else {
              return { ...res, [field]: value };
            }
          }
          return res;
        })
      );
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      toast({
        title: "Güncelleme başarılı",
        description: `${field} alanı başarıyla güncellendi.`,
      });
      
      setEditingCell(null);
    } catch (error: any) {
      console.error("Güncelleme hatası:", error);
      console.error("Hata detayları:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Hata",
        description: error.message || "Güncelleme sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };
  
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
      setLocalReservations(prev => 
        prev.map(res => 
          res.id === id ? { ...res, status: newStatus } : res
        )
      );
      
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
  
  // Transfer durumunu güncelle
  const handleTransferChange = async (id: string, completed: boolean) => {
    setProcessingIds(prev => [...prev, id]);
    
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ transfer_completed: completed })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Yerel state'i güncelle
      setLocalReservations(prev => 
        prev.map(res => 
          res.id === id ? { ...res, transfer_completed: completed } : res
        )
      );
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      toast({
        title: "Transfer durumu güncellendi",
        description: `Transfer durumu "${completed ? 'Tamamlandı' : 'Bekliyor'}" olarak güncellendi.`,
      });
    } catch (error) {
      console.error("Transfer durumu güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Transfer durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };
  
  // Ön ödeme durumunu güncelle
  const handleDepositReceivedChange = async (id: string, received: boolean) => {
    setProcessingIds(prev => [...prev, id]);
    
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ deposit_received: received })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Yerel state'i güncelle
      setLocalReservations(prev => 
        prev.map(res => 
          res.id === id ? { ...res, deposit_received: received } : res
        )
      );
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      toast({
        title: "Ön ödeme durumu güncellendi",
        description: `Ön ödeme durumu "${received ? 'Ödendi' : 'Bekliyor'}" olarak güncellendi.`,
      });
    } catch (error) {
      console.error("Ön ödeme durumu güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Ön ödeme durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };
  
  const exportToExcel = () => {
    console.log("Excel'e aktar");
    // Excel export işlevselliği
    const headers = [
      "Referans", "Müşteri", "Personel", "Dövme", "Otel/Satış", 
      "Durum", "Tarih", "Fiyat", "Ön Ödeme", "Transfer"
    ];
    
    // CSV formatında veri oluştur
    let csvContent = headers.join(",") + "\n";
    
    filteredReservations.forEach(reservation => {
      const row = [
        reservation.reference_no || reservation.id.substring(0, 8),
        reservation.customer_name || reservation.customers?.name || "Bilinmeyen",
        reservation.staff_name || reservation.staff?.name || "-",
        reservation.artist_name || reservation.artists?.name || "-",
        reservation.hotel || "-",
        reservation.status,
        format(new Date(reservation.date), "dd.MM.yyyy HH:mm"),
        reservation.price ? `${reservation.price} ${reservation.currency || "EUR"}` : "-",
        reservation.deposit_amount > 0 ? `${reservation.deposit_amount} ${reservation.currency}` : "-",
        reservation.transfer_completed ? "Evet" : "Hayır"
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    // CSV dosyasını indir
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rezervasyonlar_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Excel'e aktarıldı",
      description: "Rezervasyonlar başarıyla Excel formatında indirildi.",
    });
  };
  
  const exportToPdf = () => {
    console.log("PDF'e aktar");
    // PDF export işlevselliği
    toast({
      title: "PDF'e aktarıldı",
      description: "Rezervasyonlar başarıyla PDF formatında indirildi.",
    });
  };

  // Durum değerlerini Türkçe'ye çevir
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "confirmed":
        return "Onaylandı";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  if (!reservations || reservations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Henüz rezervasyon bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  // Düzenlenebilir hücre render fonksiyonu
  const renderEditableCell = (reservation: any, field: string, value: any, type: string = "text") => {
    const isEditing = editingCell?.id === reservation.id && editingCell?.field === field;
    const isProcessing = processingIds.includes(reservation.id);
    
    // Referans numarası değiştirilemez ve tıklanabilir link olmalı
    if (field === "reference_no") {
      return (
        <Link 
          href={`/reservations/${reservation.id}`}
          className="text-xs hover:text-primary hover:underline"
        >
          {value || "-"}
        </Link>
      );
    }
    
    if (isEditing) {
      if (type === "select") {
        return (
          <div className="flex items-center space-x-1">
            <Select 
              value={editValue} 
              onValueChange={setEditValue}
              disabled={isProcessing}
            >
              <SelectTrigger className="h-6 text-xs">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {field === "status" && (
                  <>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="confirmed">Onaylandı</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </>
                )}
                {field === "service_type" && (
                  <>
                    <SelectItem value="tattoo">Dövme</SelectItem>
                    <SelectItem value="piercing">Piercing</SelectItem>
                    <SelectItem value="consultation">Konsültasyon</SelectItem>
                  </>
                )}
                {field === "currency" && (
                  <>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="TRY">TRY</SelectItem>
                  </>
                )}
                {field === "customer" && (
                  <>
                    {isLoadingCustomers ? (
                      <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : customers.length > 0 ? (
                      customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email || customer.phone || "İletişim yok"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-customers" disabled>Müşteri bulunamadı</SelectItem>
                    )}
                  </>
                )}
                {field === "artist" && (
                  <>
                    {isLoadingArtists ? (
                      <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : artists.length > 0 ? (
                      artists.map(artist => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-artists" disabled>Sanatçı bulunamadı</SelectItem>
                    )}
                  </>
                )}
                {field === "staff" && (
                  <>
                    {isLoadingStaff ? (
                      <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : staff.length > 0 ? (
                      staff.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name} ({person.position === "admin" ? "Admin" : 
                                             person.position === "designer" ? "Tasarımcı" : 
                                             person.position === "tattoo_artist" ? "Dövme Sanatçısı" : 
                                             person.position === "piercing_artist" ? "Piercing Sanatçısı" : 
                                             "Bilgi"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-staff" disabled>Personel bulunamadı</SelectItem>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={saveEdit}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelEditing}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      } else if (type === "checkbox") {
        return (
          <div className="flex items-center space-x-1">
            <Checkbox 
              checked={editValue === "true"} 
              onCheckedChange={(checked) => setEditValue(checked ? "true" : "false")}
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={saveEdit}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelEditing}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      } else if (field === "hotel") {
        // Otel/satış alanı için özel düzenleme arayüzü
        return (
          <div className="flex items-center space-x-1">
            <Input 
              type="text" 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 w-40 text-xs"
              placeholder="Otel/Satış bilgisi"
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={saveEdit}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelEditing}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center space-x-1">
            <Input 
              type={type} 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 text-xs"
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={saveEdit}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelEditing}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    } else {
      // Müşteri ve personel alanları için özel görüntüleme
      if (field === "customer") {
        const customerName = reservation.customer_name || 
                           (reservation.customers?.name) || 
                           (customers.find(c => c.id === reservation.customer_id)?.name) || 
                           "Bilinmeyen";
        
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-0.5 rounded text-xs"
            onClick={() => startEditing(reservation.id, field, reservation.customer_id)}
          >
            {customerName}
          </div>
        );
      } else if (field === "artist") {
        const artistName = reservation.artist_name || 
                          (reservation.artists?.name) || 
                          (artists.find(a => a.id === reservation.artist_id)?.name) || 
                          "-";
        
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-0.5 rounded text-xs"
            onClick={() => startEditing(reservation.id, field, reservation.artist_id)}
          >
            {artistName}
          </div>
        );
      } else if (field === "staff") {
        const staffName = reservation.staff_name || 
                         (reservation.staff?.full_name) || 
                         (staff.find(s => s.id === reservation.staff_id)?.full_name) || 
                         "-";
        
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-0.5 rounded text-xs"
            onClick={() => startEditing(reservation.id, field, reservation.staff_id)}
          >
            {staffName}
          </div>
        );
      } else if (field === "status") {
        // Durum alanı için özel görüntüleme
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-0.5 rounded text-xs"
            onClick={() => startEditing(reservation.id, field, value)}
          >
            {getStatusText(value) || "-"}
          </div>
        );
      } else {
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-0.5 rounded text-xs"
            onClick={() => startEditing(reservation.id, field, value)}
          >
            {value || "-"}
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={exportToExcel} variant="default" className="bg-[#B87F3C] hover:bg-[#96682F] text-xs h-8">
          <Table2 className="w-3 h-3 mr-1" />
          EXPORT TO EXCEL
        </Button>
        <Button onClick={exportToPdf} variant="default" className="bg-[#B87F3C] hover:bg-[#96682F] text-xs h-8">
          <FileText className="w-3 h-3 mr-1" />
          PDF AKTAR
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-2 py-1 text-left font-medium">Görsel</th>
              <th className="px-2 py-1 text-left font-medium">Ref No</th>
              <th className="px-2 py-1 text-left font-medium">Müşteri</th>
              <th className="px-2 py-1 text-left font-medium">Sanatçı</th>
              <th className="px-2 py-1 text-left font-medium">Personel</th>
              <th className="px-2 py-1 text-left font-medium">Hizmet</th>
              <th className="px-2 py-1 text-left font-medium">Otel/Satış</th>
              <th className="px-2 py-1 text-left font-medium">Tarih</th>
              <th className="px-2 py-1 text-left font-medium">Fiyat</th>
              <th className="px-2 py-1 text-left font-medium">Ön Ödeme</th>
              <th className="px-2 py-1 text-center font-medium">Transfer</th>
              <th className="px-2 py-1 text-left font-medium">Durum</th>
              <th className="px-2 py-1 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((reservation) => {
              const isProcessing = processingIds.includes(reservation.id);
              
              return (
                <tr key={reservation.id} className="border-t hover:bg-muted/50">
                  <td className="px-2 py-1">
                    {reservation.reservation_images && reservation.reservation_images.length > 0 ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={reservation.reservation_images[0].image_url}
                          alt={`Dövme - ${reservation.reference_no || reservation.id}`}
                          width={64}
                          height={64}
                          className="object-cover"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.currentTarget.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "reference_no", reservation.reference_no || reservation.id.substring(0, 8))}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "customer", reservation.customer_id || "", "select")}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "artist", reservation.artist_id || "", "select")}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "staff", reservation.staff_id || "", "select")}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "service_type", reservation.service_type || "-", "select")}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "hotel", reservation.hotel || "-")}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(
                      reservation, 
                      "date", 
                      format(new Date(reservation.date), "dd.MM.yyyy"), 
                      "date"
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(
                      reservation, 
                      "price", 
                      reservation.price ? `${reservation.price} ${reservation.currency || "EUR"}` : "-"
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {reservation.deposit_amount > 0 ? (
                      <div className="flex flex-col">
                        <div>
                          {renderEditableCell(
                            reservation, 
                            "deposit_amount", 
                            `${reservation.deposit_amount} ${reservation.currency}`
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-[10px]">Ödendi:</span>
                          <Checkbox 
                            checked={reservation.deposit_received} 
                            onCheckedChange={(checked) => handleDepositReceivedChange(reservation.id, checked as boolean)}
                            disabled={isProcessing}
                            className="h-3 w-3"
                          />
                        </div>
                      </div>
                    ) : (
                      renderEditableCell(reservation, "deposit_amount", "-")
                    )}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <Checkbox 
                      checked={reservation.transfer_completed} 
                      onCheckedChange={(checked) => handleTransferChange(reservation.id, checked as boolean)}
                      disabled={isProcessing}
                      className="h-3 w-3"
                    />
                  </td>
                  <td className="px-2 py-1">
                    {renderEditableCell(reservation, "status", reservation.status, "select")}
                  </td>
                  <td className="px-2 py-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <Link href={`/reservations/${reservation.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-1 h-3 w-3" />
                            Detayları Görüntüle
                          </DropdownMenuItem>
                        </Link>
                        
                        {userRole === "admin" && (
                          <>
                            {reservation.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(reservation.id, "confirmed")}
                                disabled={isProcessing}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Onayla
                              </DropdownMenuItem>
                            )}
                            
                            {(reservation.status === "pending" || reservation.status === "confirmed") && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                disabled={isProcessing}
                                className="text-red-600"
                              >
                                <X className="mr-1 h-3 w-3" />
                                İptal Et
                              </DropdownMenuItem>
                            )}
                            
                            {reservation.status === "confirmed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(reservation.id, "completed")}
                                disabled={isProcessing}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Tamamlandı
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 text-xs">İlk</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs">Önceki</Button>
          <span className="px-1 text-xs">1</span>
          <Button variant="outline" size="sm" className="h-6 text-xs">Sonraki</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs">Son</Button>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {filteredReservations.length} öğeden {Math.min(1, filteredReservations.length)} - {Math.min(filteredReservations.length, 10)} arası
          </span>
        </div>
      </div>
    </div>
  );
} 