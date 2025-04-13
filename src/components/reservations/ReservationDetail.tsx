"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Reservation} from "@/types";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";
import {tr} from "date-fns/locale";
import {Calendar, Clock, DollarSign, FileText, Info, Mail, MapPin, Phone, Upload, User} from "lucide-react";
import Image from "next/image";

interface ReservationDetailProps {
    reservation: Reservation & { tattoo_artist_user?: { name: string } };
    userRole: string;
}

// Helper functions for status
const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
        case "pending":
            return "secondary";
        case "confirmed":
            return "default";
        case "completed":
            return "default";
        case "cancelled":
            return "destructive";
        default:
            return "default";
    }
};

const getStatusLabel = (status: string) => {
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

export function ReservationDetail({reservation, userRole}: ReservationDetailProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [status, setStatus] = useState(reservation.status);
    const [notes, setNotes] = useState(reservation.notes || "");
    const [beforeImage, setBeforeImage] = useState<File | null>(null);
    const [afterImage, setAfterImage] = useState<File | null>(null);
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);

    const router = useRouter();
    const supabase = createClientComponentClient();

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
            const {error} = await supabase
                .from("reservations")
                .update({status, notes})
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

            const {error: uploadError} = await supabase.storage
                .from('reservation-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {data} = supabase.storage
                .from('reservation-images')
                .getPublicUrl(filePath);

            const {error: updateError} = await supabase
                .from('reservations')
                .update({image_before: data.publicUrl})
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

            const {error: uploadError} = await supabase.storage
                .from('reservation-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {data} = supabase.storage
                .from('reservation-images')
                .getPublicUrl(filePath);

            const {error: updateError} = await supabase
                .from('reservations')
                .update({image_after: data.publicUrl})
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
    const formattedDate = format(new Date(reservation.date), "PPP", {locale: tr});
    const formattedTime = format(new Date(reservation.date), "HH:mm");

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Rezervasyon
                            #{reservation.reference_no || reservation.id.substring(0, 8)}</CardTitle>
                        <Badge
                            variant={getStatusVariant(reservation.status)}>{getStatusLabel(reservation.status)}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Temel Bilgiler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Randevu Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Info className="h-4 w-4 text-muted-foreground"/>
                                    <span>Rezervasyon ID: {reservation.id}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>Tarih: {formattedDate}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span>Saat: {formattedTime}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Info className="h-4 w-4 text-muted-foreground"/>
                                    <span>İşlem Türü: {typeLabels[reservation.type] || reservation.type}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Info className="h-4 w-4 text-muted-foreground"/>
                                    <span>Hizmet: {reservation.service_type}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span>Süre: {reservation.duration} dakika</span>
                                </div>
                                {reservation.tattoo_artist_user ? (
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <span>Dövme Sanatçısı: {reservation.tattoo_artist_user.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <span>Dövme Sanatçısı: <span
                                            className="text-muted-foreground">Belirtilmemiş</span></span>
                                    </div>
                                )}
                                {reservation.sales_source && (
                                    <div className="flex items-center space-x-2">
                                        <Info className="h-4 w-4 text-muted-foreground"/>
                                        <span>Satış Kaynağı: {reservation.sales_source}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>Oluşturulma: {format(new Date(reservation.created_at), "dd.MM.yyyy HH:mm", {locale: tr})}</span>
                                </div>
                                {reservation.updated_at && (
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                                        <span>Son Güncelleme: {format(new Date(reservation.updated_at), "dd.MM.yyyy HH:mm", {locale: tr})}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Info className="h-4 w-4 text-muted-foreground"/>
                                    <span>Transfer: {reservation.transfer ? "Evet" : "Hayır"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Info className="h-4 w-4 text-muted-foreground"/>
                                    <span>Durum: {getStatusLabel(reservation.status)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground"/>
                                    <span>{reservation.customers?.name || "Müşteri bilgisi yok"}</span>
                                </div>
                                {reservation.customers?.email && (
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customers.email}</span>
                                    </div>
                                )}
                                {reservation.customers?.phone && (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customers.phone}</span>
                                    </div>
                                )}
                                {reservation.customers?.address && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customers.address}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ödeme Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground"/>
                                <span>Toplam Ücret: {reservation.price} {reservation.currency}</span>
                            </div>
                            {reservation.deposit_amount && reservation.deposit_amount > 0 && (
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground"/>
                                    <div className="flex flex-col">
                                        <span>Ön Ödeme: {reservation.deposit_amount} {reservation.currency}</span>
                                        <span
                                            className={`text-sm ${reservation.deposit_received ? 'text-green-600' : 'text-yellow-600'}`}>
                      {reservation.deposit_received ? 'Ödendi' : 'Bekliyor'}
                    </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notlar */}
                    {reservation.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notlar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-1"/>
                                    <p className="whitespace-pre-wrap">{reservation.notes}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Fotoğraflar */}
                    {reservation.reservation_images && reservation.reservation_images.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Fotoğraflar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {reservation.reservation_images.map((image, index) => (
                                        <div key={image.id} className="relative w-32 h-32 rounded-md overflow-hidden">
                                            <Image
                                                src={image.image_url}
                                                alt={`Dövme - ${reservation.reference_no || reservation.id}`}
                                                width={128}
                                                height={128}
                                                className="object-cover"
                                                onError={(e) => {
                                                    console.error('Image load error:', e);
                                                    e.currentTarget.src = '/placeholder.jpg';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Fotoğraf Yükleme */}
                    {userRole === "admin" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Fotoğraf Yükle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="before-photo" className="block text-sm font-medium mb-2">
                                            Öncesi Fotoğrafı
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="file"
                                                id="before-photo"
                                                accept="image/*"
                                                onChange={handleBeforeImageUpload}
                                                disabled={uploadingBefore}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('before-photo')?.click()}
                                                disabled={uploadingBefore}
                                            >
                                                <Upload className="h-4 w-4 mr-2"/>
                                                {uploadingBefore ? 'Yükleniyor...' : 'Fotoğraf Seç'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="after-photo" className="block text-sm font-medium mb-2">
                                            Sonrası Fotoğrafı
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="file"
                                                id="after-photo"
                                                accept="image/*"
                                                onChange={handleAfterImageUpload}
                                                disabled={uploadingAfter}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('after-photo')?.click()}
                                                disabled={uploadingAfter}
                                            >
                                                <Upload className="h-4 w-4 mr-2"/>
                                                {uploadingAfter ? 'Yükleniyor...' : 'Fotoğraf Seç'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 