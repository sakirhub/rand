"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Reservation} from "@/types/reservation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {format, parseISO} from "date-fns";
import {tr} from "date-fns/locale";
import {Calendar, Clock, DollarSign, FileText, Info, Mail, MapPin, Phone, Upload, User, X} from "lucide-react";
import Image from "next/image";
import {TabsContent} from "@/components/ui/tabs";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {PlusCircle, Trash2} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {toast} from "@/components/ui/use-toast";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircle} from "lucide-react";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

interface ReservationImage {
    id: string;
    url: string;
    type: string;
}

interface ReservationDetailProps {
    reservation: Reservation;
    userRole: string;
}

interface Payment {
    id: string;
    amount: number;
    payment_type: string;
    payment_date: string;
    status: string;
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

export function ReservationDetail({reservation: initialReservation, userRole}: ReservationDetailProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [status, setStatus] = useState(initialReservation.status);
    const [notes, setNotes] = useState(initialReservation.notes || "");
    const [beforeImage, setBeforeImage] = useState<File | null>(null);
    const [afterImage, setAfterImage] = useState<File | null>(null);
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [newPayment, setNewPayment] = useState({
        amount: 0,
        payment_type: "cash",
        payment_date: format(new Date(), "yyyy-MM-dd"),
    });
    const [reservation, setReservation] = useState<Reservation>(initialReservation);

    const router = useRouter();
    const supabase = createClientComponentClient();

    const typeLabels: Record<string, string> = {
        tattoo: "Dövme",
        piercing: "Piercing",
    };

    const currencySymbols: Record<string, string> = {
        TRY: "₺",
        USD: "$",
        EUR: "€"
    };

    useEffect(() => {
        const fetchReservationDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('reservations')
                    .select(`
                        *,
                        customer:customers(*),
                        tattoo_artist_user:artists(*)
                    `)
                    .eq('id', initialReservation.id)
                    .single();

                if (error) throw error;

                if (data) {
                    console.log("Fetched reservation data:", data);
                    // Ensure currency is set and log it
                    const updatedData = {
                        ...data,
                        currency: data.currency || initialReservation.currency || "TRY"
                    };
                    console.log("Currency from database:", data.currency);
                    console.log("Initial reservation currency:", initialReservation.currency);
                    console.log("Updated reservation data:", updatedData);
                    setReservation(updatedData);
                }
            } catch (error) {
                console.error("Error fetching reservation details:", error);
            }
        };

        fetchReservationDetails();
    }, [initialReservation.id, initialReservation.currency, supabase]);

    useEffect(() => {
        console.log("Initial reservation:", initialReservation);
        console.log("Current reservation:", reservation);
    }, [initialReservation, reservation]);

    const formatCurrency = (amount: number, currency: string) => {
        console.log('Formatting currency:', { amount, currency });
        const symbol = currencySymbols[currency] || "₺";
        const formatted = `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
        console.log('Formatted result:', formatted);
        return formatted;
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
    const formattedDate = reservation.date ? format(parseISO(reservation.date), "PPP", {locale: tr}) : "-";
    const formattedTime = reservation.date ? format(parseISO(reservation.date), "HH:mm", {locale: tr}) : "-";

    // Özet bilgileri
    const summaryItems = [
        {label: "Durum", value: getStatusLabel(reservation.status)},
        {label: "Hizmet", value: typeLabels[reservation.type] || reservation.type},
        {label: "Tarih", value: reservation.date ? format(parseISO(reservation.date), 'dd MMMM yyyy', { locale: tr }) : '-'},
        {label: "Saat", value: `${reservation.start_time?.substring(0, 5) || ''} - ${reservation.end_time?.substring(0, 5) || ''}`},
        {label: "Süre", value: `${reservation.duration} dakika`},
        {label: "Ücret", value: formatCurrency(reservation.price, reservation.currency)},
        {label: "Ön Ödeme", value: formatCurrency(reservation.deposit_amount || 0, reservation.currency)},
        {label: "Kalan", value: formatCurrency(reservation.remaining_amount, reservation.currency)},
    ];

    // Ödeme türü metinleri
    const getPaymentTypeText = (type: string) => {
        const types: Record<string, string> = {
            cash: "Nakit",
            credit_card: "Kredi Kartı",
            bank_transfer: "Banka Transferi",
        };
        return types[type] || type;
    };

    // Ödeme durumu metinleri
    const getPaymentStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            completed: "Tamamlandı",
            pending: "Beklemede",
            cancelled: "İptal Edildi",
        };
        return statuses[status] || status;
    };

    // Ödeme silme fonksiyonu
    const handleDeletePayment = async (paymentId: string) => {
        try {
            const {error} = await supabase
                .from("payments")
                .delete()
                .eq("id", paymentId);

            if (error) throw error;

            setPayments(payments.filter(payment => payment.id !== paymentId));
            toast({
                title: "Başarılı",
                description: "Ödeme başarıyla silindi.",
            });
        } catch (error) {
            console.error("Ödeme silinirken hata:", error);
            toast({
                title: "Hata",
                description: "Ödeme silinirken bir hata oluştu.",
                variant: "destructive",
            });
        }
    };

    // Yeni ödeme ekleme fonksiyonu
    const handleAddPayment = async () => {
        try {
            const {data, error} = await supabase
                .from("payments")
                .insert({
                    reservation_id: reservation.id,
                    amount: newPayment.amount,
                    payment_type: newPayment.payment_type,
                    payment_date: newPayment.payment_date,
                    status: "completed",
                })
                .select()
                .single();

            if (error) throw error;

            setPayments([...payments, data]);
            setShowPaymentDialog(false);
            setNewPayment({
                amount: 0,
                payment_type: "cash",
                payment_date: format(new Date(), "yyyy-MM-dd"),
            });

            toast({
                title: "Başarılı",
                description: "Ödeme başarıyla eklendi.",
            });
        } catch (error) {
            console.error("Ödeme eklenirken hata:", error);
            toast({
                title: "Hata",
                description: "Ödeme eklenirken bir hata oluştu.",
                variant: "destructive",
            });
        }
    };

    // Ödemeleri getir
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const {data, error} = await supabase
                    .from("payments")
                    .select("*")
                    .eq("reservation_id", reservation.id)
                    .order("payment_date", {ascending: false});

                if (error) throw error;

                setPayments(data || []);
            } catch (error) {
                console.error("Ödemeler getirilirken hata:", error);
                toast({
                    title: "Hata",
                    description: "Ödemeler yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            }
        };

        fetchPayments();
    }, [reservation.id, supabase, toast]);

    // Tarih formatlama
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return "-";
        try {
            const parsedDate = parseISO(dateStr);
            return format(parsedDate, "dd MMMM yyyy", { locale: tr });
        } catch (error) {
            console.error("Tarih formatlanırken hata:", error);
            return "-";
        }
    };

    const handleRemoveImage = async (index: number) => {
        if (!reservation.reservation_images) return;
        
        const imageToRemove = reservation.reservation_images[index];
        if (!imageToRemove) return;

        try {
            const { error } = await supabase
                .from('reservation_images')
                .delete()
                .eq('id', imageToRemove.id);

            if (error) throw error;

            // Update local state
            const updatedImages = [...reservation.reservation_images];
            updatedImages.splice(index, 1);
            setReservation({ ...reservation, reservation_images: updatedImages });

            toast({
                title: "Başarılı",
                description: "Görsel başarıyla kaldırıldı",
            });
        } catch (error) {
            console.error('Error removing image:', error);
            toast({
                title: "Hata",
                description: "Görsel kaldırılırken bir hata oluştu",
                variant: "destructive",
            });
        }
    };

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
                                {summaryItems.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Info className="h-4 w-4 text-muted-foreground"/>
                                        <span>{item.label}: {item.value}</span>
                                    </div>
                                ))}
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
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground"/>
                                    <span>{reservation.customer?.name || "Müşteri bilgisi yok"}</span>
                                </div>
                                {reservation.customer?.email && (
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customer.email}</span>
                                    </div>
                                )}
                                {reservation.customer?.phone && (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customer.phone}</span>
                                    </div>
                                )}
                                {reservation.customer?.address && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground"/>
                                        <span>{reservation.customer.address}</span>
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
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Toplam Tutar</div>
                                <div className="text-lg font-semibold">
                                    {formatCurrency(reservation.price, reservation.currency)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Ödenen</div>
                                <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(reservation.deposit_amount, reservation.currency)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Kalan</div>
                                <div className="text-lg font-semibold text-orange-600">
                                    {formatCurrency(reservation.remaining_amount, reservation.currency)}
                                </div>
                            </div>
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
                                    {reservation.reservation_images.map((image: ReservationImage, index: number) => (
                                        <div key={image.id} className="relative group">
                                            <Image
                                                src={image.url}
                                                alt={`Reservation image ${index + 1}`}
                                                width={200}
                                                height={200}
                                                className="object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
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

            {/* Ödemeler sekmesi */}
            <TabsContent value="payments" className="space-y-4">
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Ödeme Bilgileri</h3>
                            <p className="text-sm text-muted-foreground">
                                Toplam: {formatCurrency(reservation.price, reservation.currency)}
                            </p>
                        </div>
                        <Button onClick={() => setShowPaymentDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Ödeme Ekle
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Ödeme Türü</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {format(new Date(payment.payment_date), "dd MMMM yyyy", {locale: tr})}
                                        </TableCell>
                                        <TableCell>{formatCurrency(payment.amount, reservation.currency)}</TableCell>
                                        <TableCell>{getPaymentTypeText(payment.payment_type)}</TableCell>
                                        <TableCell>
                                            <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                                                {getPaymentStatusText(payment.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeletePayment(payment.id)}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>

            {/* Yeni ödeme diyaloğu */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
                        <DialogDescription>
                            Rezervasyon için yeni bir ödeme ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Tutar ({reservation.currency})
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={newPayment.amount}
                                onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment_type" className="text-right">
                                Ödeme Türü
                            </Label>
                            <Select
                                value={newPayment.payment_type}
                                onValueChange={(value) => setNewPayment({...newPayment, payment_type: value})}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Ödeme türü seçin"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Nakit</SelectItem>
                                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                                    <SelectItem value="bank_transfer">Banka Transferi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment_date" className="text-right">
                                Tarih
                            </Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={newPayment.payment_date}
                                onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleAddPayment}>
                            Ödeme Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {reservation.remaining_amount > 0 && (
                <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Ödenmemiş Tutar</AlertTitle>
                    <AlertDescription>
                        Bu rezervasyon için {formatCurrency(reservation.remaining_amount, reservation.currency)}
                        ödenmemiş tutar bulunmaktadır.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
} 