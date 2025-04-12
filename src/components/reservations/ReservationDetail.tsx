"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Reservation } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Calendar, 
  User, 
  DollarSign, 
  FileText, 
  Image as ImageIcon,
  Check,
  X,
  Upload
} from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ReservationDetailProps {
  reservation: Reservation & { tattoo_artist_user?: { name: string } };
  userRole: string;
}

export function ReservationDetail({ reservation, userRole }: ReservationDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(reservation.status);
  const [notes, setNotes] = useState(reservation.notes || "");
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    completed: "bg-blue-500",
  };

  const statusLabels = {
    pending: "Beklemede",
    approved: "Onaylandı",
    completed: "Tamamlandı",
  };

  const typeLabels = {
    tattoo: "Dövme",
    piercing: "Piercing",
  };

  const currencySymbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
  };

  const handleStatusChange = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status, notes })
        .eq("id", reservation.id);

      if (error) throw error;
      
      router.refresh();
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Rezervasyon güncellenirken bir hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBeforeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setBeforeImage(file);
    setUploadingBefore(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reservation.id}_before_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reservation-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('reservation-images')
        .getPublicUrl(filePath);
        
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ image_before: data.publicUrl })
        .eq('id', reservation.id);
        
      if (updateError) throw updateError;
      
      router.refresh();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingBefore(false);
    }
  };

  const handleAfterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setAfterImage(file);
    setUploadingAfter(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reservation.id}_after_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reservation-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('reservation-images')
        .getPublicUrl(filePath);
        
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ image_after: data.publicUrl })
        .eq('id', reservation.id);
        
      if (updateError) throw updateError;
      
      router.refresh();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingAfter(false);
    }
  };

  // Tarih ve saati formatla
  const formattedDate = format(new Date(reservation.date), "PPP", { locale: tr });
  const formattedTime = format(new Date(reservation.date), "HH:mm");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">
              Rezervasyon #{reservation.reservation_no}
            </CardTitle>
            <Badge className={statusColors[reservation.status]}>
              {statusLabels[reservation.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Detaylar</TabsTrigger>
              <TabsTrigger value="images">Fotoğraflar</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Müşteri</h3>
                    <p>{reservation.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Tür</h3>
                    <p>{typeLabels[reservation.type]}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Tarih</h3>
                    <p>{formattedDate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Saat</h3>
                    <p>{formattedTime}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Fiyat</h3>
                    <p>
                      {reservation.price} {currencySymbols[reservation.currency]}
                      {reservation.transfer && " (Havale/EFT)"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Satış Kaynağı</h3>
                    <p>{reservation.sales_source || "-"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Dövme Sanatçısı</h3>
                    <p>{reservation.tattoo_artist_user?.name || "-"}</p>
                  </div>
                </div>

                {reservation.notes && (
                  <div>
                    <h3 className="font-medium">Notlar</h3>
                    <p className="whitespace-pre-wrap">{reservation.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="images">
              <div className="space-y-4 mt-4">
                {reservation.image_before ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={reservation.image_before}
                      alt="Öncesi"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Öncesi fotoğrafı yok</p>
                  </div>
                )}
                
                {(userRole === "admin" || userRole === "designer" || userRole === "tattoo_artist") && (
                  <div className="space-y-2">
                    <Label htmlFor="before-image">Öncesi Fotoğrafı Yükle</Label>
                    <Input
                      id="before-image"
                      type="file"
                      accept="image/*"
                      onChange={handleBeforeImageUpload}
                      disabled={uploadingBefore}
                    />
                    {uploadingBefore && <p className="text-sm">Yükleniyor...</p>}
                  </div>
                )}
              </div>
              <div className="space-y-4 mt-4">
                {reservation.image_after ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={reservation.image_after}
                      alt="Sonrası"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Sonrası fotoğrafı yok</p>
                  </div>
                )}
                
                {(userRole === "admin" || userRole === "designer" || userRole === "tattoo_artist") && (
                  <div className="space-y-2">
                    <Label htmlFor="after-image">Sonrası Fotoğrafı Yükle</Label>
                    <Input
                      id="after-image"
                      type="file"
                      accept="image/*"
                      onChange={handleAfterImageUpload}
                      disabled={uploadingAfter}
                    />
                    {uploadingAfter && <p className="text-sm">Yükleniyor...</p>}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.back()} className="w-full">
            Geri Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 