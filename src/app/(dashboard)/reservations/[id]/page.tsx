import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import Link from "next/link";
import {format} from "date-fns";
import {tr} from "date-fns/locale";
import {Button} from "@/components/ui/button";
import {AlertCircle, Calendar, ChevronLeft, Clock, ArrowLeft, Edit, Printer} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ReservationStatusBadge} from "@/components/reservations/ReservationStatusBadge";
import {ReservationActions} from "@/components/reservations/ReservationActions";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {PaymentHistory} from "@/components/reservations/PaymentHistory";
import {AddPaymentForm} from "@/components/reservations/AddPaymentForm";
import {ReservationImage} from "@/components/reservations/ReservationImage";

export const metadata = {
    title: "Rezervasyon Detayı | Stüdyo Yönetim Sistemi",
    description: "Rezervasyon detaylarını görüntüleyin",
};

export const dynamic = "force-dynamic";

interface ReferenceImage {
    id: string;
    image_url: string;
    notes?: string;
}

interface ReservationImage {
    id: string;
    image_url: string;
    created_at?: string;
}

// Para birimi sembolleri
const currencySymbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€"
};

// Para birimi formatlama fonksiyonu
const formatCurrency = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || "₺";
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
};

async function getReservation(id: string) {
    const supabase = createServerComponentClient({cookies});
    try {
        console.log("Rezervasyon ID:", id);
        
        // Rezervasyon detaylarını getir
        const {data: reservation, error: reservationError} = await supabase
            .from("reservations")
            .select(`
                *,
                customer:customers (
                    id,
                    name,
                    email,
                    phone
                ),
                reservation_images (
                    id,
                    image_url,
                    created_at
                ),
                payments (
                    id,
                    amount,
                    payment_date,
                    payment_method,
                    notes
                )
            `)
            .eq("id", id)
            .single();

        if (reservationError) {
            console.error("Rezervasyon getirme hatası:", reservationError);
            return null;
        }
        
        if (!reservation) {
            console.error("Rezervasyon bulunamadı, ID:", id);
            return null;
        }

        console.log("Rezervasyon bulundu:", {
            id: reservation.id,
            images: reservation.reservation_images?.length || 0,
            imageUrls: reservation.reservation_images?.map((img: ReservationImage) => img.image_url) || []
        });

        // Sanatçı bilgilerini getir
        let artist = null;
        if (reservation.artist_id) {
            console.log("Sanatçı ID:", reservation.artist_id);
            
            try {
                const {data: artistData, error: artistError} = await supabase
                    .from("artists")
                    .select("id, name, email, phone")
                    .eq("id", reservation.artist_id)
                    .single();

                if (artistError) {
                    console.error("Artists tablosundan veri çekme hatası:", artistError);
                } else if (artistData) {
                    console.log("Artists tablosundan sanatçı bulundu:", artistData.name);
                    artist = artistData;
                }
            } catch (error) {
                console.error("Sanatçı bilgileri alınırken hata:", error);
            }
        }

        // Sonuçları birleştir
        const result = {
            ...reservation,
            artist,
            reservation_images: reservation.reservation_images?.map((img: ReservationImage) => ({
                ...img,
                image_url: img.image_url.startsWith('http') 
                    ? img.image_url 
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.image_url}`
            })) || []
        };
        
        console.log("Birleştirilmiş rezervasyon verisi:", {
            id: result.id,
            customer: result.customer ? "Var" : "Yok",
            artist: result.artist ? "Var" : "Yok",
            reservationImages: result.reservation_images?.length || 0,
            payments: result.payments?.length || 0
        });
        
        return result;
    } catch (error) {
        console.error("Rezervasyon detayları alınırken hata:", error);
        return null;
    }
}

// Kullanıcı rolünü getir
async function getUserRole() {
    const supabase = createServerComponentClient({cookies});

    try {
        const {data: {session}} = await supabase.auth.getSession();

        if (!session) {
            return null;
        }

        const {data: user, error} = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (error || !user) {
            console.error("Kullanıcı rolü getirme hatası:", error);
            return null;
        }

        return user.role;
    } catch (error) {
        console.error("Kullanıcı rolü getirme işlemi sırasında hata:", error);
        return null;
    }
}

export default async function ReservationDetailPage({
    params,
}: {
    params: { id: string };
}) {
    console.log("Sayfa parametreleri:", params);

    try {
        // params.id'yi doğrudan kullanmak yerine, bir değişkene atayalım
        const reservationId = params.id;
        console.log("Rezervasyon ID:", reservationId);
        
        const reservation = await getReservation(reservationId);
        const userRole = await getUserRole();

        console.log("Rezervasyon durumu:", reservation ? "Bulundu" : "Bulunamadı");

        if (!reservation) {
            return (
                <div className="container py-8">
                    <div className="mb-6">
                        <Link href="/reservations"
                              className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="mr-1 h-4 w-4"/>
                            Rezervasyonlara Dön
                        </Link>
                    </div>

                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <h1 className="text-2xl font-bold mb-4">Rezervasyon Bulunamadı</h1>
                        <p className="text-muted-foreground mb-2">
                            Aradığınız rezervasyon bulunamadı veya erişim izniniz yok.
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Rezervasyon ID: {reservationId}
                        </p>
                        <Button asChild>
                            <Link href="/reservations">Rezervasyonlara Dön</Link>
                        </Button>
                    </div>
                </div>
            );
        }

        // Tarih ve saat formatlamaları
        const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", {locale: tr});
        const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
        const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";

        // Hizmet türü çevirisi
        const getServiceTypeText = (type: string) => {
            switch (type) {
                case "tattoo":
                    return "Dövme";
                case "piercing":
                    return "Piercing";
                case "consultation":
                    return "Konsültasyon";
                default:
                    return type;
            }
        };

        // Toplam ödeme tutarı hesapla
        const totalPaid = (reservation.payments?.reduce((sum: number, payment: {
            amount: number
        }) => sum + payment.amount, 0) || 0) + (reservation.deposit_amount || 0);
        const remainingAmount = reservation.price - totalPaid;

        return (
            <div className="container py-8">
                {/* Üst Navigasyon */}
                <div className="mb-6">
                    <Link href="/reservations"
                          className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="mr-1 h-4 w-4"/>
                        Rezervasyonlara Dön
                    </Link>
                </div>

                {/* Başlık ve İşlemler */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Rezervasyon #{reservation.id.slice(0, 8)}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {reservationDate} • {startTime} - {endTime}
                        </p>
                    </div>
                    <ReservationActions reservation={reservation} userRole={userRole}/>
                </div>

                {/* Ana İçerik */}
                <Tabs defaultValue="details" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="details">Detaylar</TabsTrigger>
                        <TabsTrigger value="customer">Müşteri</TabsTrigger>
                        <TabsTrigger value="artist">Sanatçı</TabsTrigger>
                        <TabsTrigger value="payments">Ödemeler</TabsTrigger>
                        <TabsTrigger value="images">Fotoğraflar</TabsTrigger>
                    </TabsList>

                    {/* Detaylar Sekmesi */}
                    <TabsContent value="details" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Rezervasyon Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rezervasyon Bilgileri</CardTitle>
                                    <CardDescription>
                                        Temel rezervasyon detayları
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Durum</div>
                                            <ReservationStatusBadge status={reservation.status}/>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Hizmet Türü</div>
                                            <div className="capitalize">
                                                {getServiceTypeText(reservation.service_type)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Tarih</div>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground"/>
                                                {reservationDate}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Süre</div>
                                            <div className="flex items-center">
                                                <Clock className="mr-2 h-4 w-4 text-muted-foreground"/>
                                                {reservation.duration} dakika
                                            </div>
                                        </div>
                                    </div>

                                    {reservation.notes && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <div className="text-sm font-medium text-muted-foreground">Notlar</div>
                                            <div className="text-sm">{reservation.notes}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Özet Bilgiler */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Özet Bilgiler</CardTitle>
                                    <CardDescription>
                                        Rezervasyon özeti ve durumu
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Toplam Tutar</div>
                                            <div className="text-lg font-semibold">
                                                {formatCurrency(reservation.price, reservation.currency)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Ödenen</div>
                                            <div className="text-lg font-semibold text-green-600">
                                                {formatCurrency(totalPaid, reservation.currency)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Kalan</div>
                                            <div className="text-lg font-semibold text-orange-600">
                                                {formatCurrency(remainingAmount, reservation.currency)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Oluşturulma</div>
                                            <div className="text-sm">
                                                {format(new Date(reservation.created_at), "d MMMM yyyy HH:mm", {locale: tr})}
                                            </div>
                                        </div>
                                    </div>

                                    {remainingAmount > 0 && (
                                        <Alert className="mt-4">
                                            <AlertCircle className="h-4 w-4"/>
                                            <AlertTitle>Ödenmemiş Tutar</AlertTitle>
                                            <AlertDescription>
                                                Bu rezervasyon için {formatCurrency(remainingAmount, reservation.currency)}
                                                ödenmemiş tutar bulunmaktadır.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Müşteri Sekmesi */}
                    <TabsContent value="customer" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Müşteri Bilgileri</CardTitle>
                                <CardDescription>
                                    Rezervasyonu yapan müşterinin detaylı bilgileri
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Ad Soyad</div>
                                        <div>{reservation.customer?.name || "Belirtilmemiş"}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">E-posta</div>
                                        <div>{reservation.customer?.email || "Belirtilmemiş"}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Telefon</div>
                                        <div>{reservation.customer?.phone || "Belirtilmemiş"}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Adres</div>
                                        <div>{reservation.customers?.address || "Belirtilmemiş"}</div>
                                    </div>
                                </div>

                                {reservation.customers?.notes && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="text-sm font-medium text-muted-foreground">Müşteri Notları</div>
                                        <div className="text-sm">{reservation.customers.notes}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sanatçı Sekmesi */}
                    <TabsContent value="artist" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sanatçı Bilgileri</CardTitle>
                                <CardDescription>
                                    Rezervasyonda görevli sanatçının detaylı bilgileri
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Ad Soyad</div>
                                        <div>{reservation.artist?.name || "Belirtilmemiş"}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">E-posta</div>
                                        <div>{reservation.artist?.email || "Belirtilmemiş"}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Telefon</div>
                                        <div>{reservation.artist?.phone || "Belirtilmemiş"}</div>
                                    </div>
                                </div>

                                {reservation.artist?.bio && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="text-sm font-medium text-muted-foreground">Hakkında</div>
                                        <div className="text-sm">{reservation.artist.bio}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ödemeler Sekmesi */}
                    <TabsContent value="payments" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PaymentHistory
                                reservationId={reservation.id}
                                totalPrice={reservation.price}
                            />

                            {(userRole === "admin" || userRole === "designer") && (
                                <AddPaymentForm
                                    reservationId={reservation.id}
                                    totalPrice={reservation.price}
                                    totalPaid={totalPaid}
                                />
                            )}
                        </div>
                    </TabsContent>

                    {/* Fotoğraflar Sekmesi */}
                    <TabsContent value="images" className="space-y-6">
                        {reservation.reservation_images && reservation.reservation_images.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rezervasyon Fotoğrafları</CardTitle>
                                    <CardDescription>
                                        Rezervasyona ait tüm fotoğraflar
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {reservation.reservation_images.map((image: {
                                            id: string;
                                            image_url: string
                                        }) => {
                                            // Supabase storage URL'sini düzelt
                                            const imageUrl = image.image_url.startsWith('http') 
                                                ? image.image_url 
                                                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.image_url}`;
                                            
                                            return (
                                                <ReservationImage
                                                    key={image.id}
                                                    id={image.id}
                                                    imageUrl={imageUrl}
                                                    alt="Rezervasyon fotoğrafı"
                                                />
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center text-muted-foreground">
                                        Henüz fotoğraf eklenmemiş
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between">
                    <Link href="/reservations">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Geri Dön
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href={`/reservations/${params.id}/print`}>
                            <Button variant="outline">
                                <Printer className="mr-2 h-4 w-4"/>
                                Yazdır
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Rezervasyon detay sayfası yüklenirken hata oluştu:", error);

        return (
            <div className="container py-8">
                <div className="mb-6">
                    <Link href="/reservations"
                          className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="mr-1 h-4 w-4"/>
                        Rezervasyonlara Dön
                    </Link>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <h1 className="text-2xl font-bold mb-4">Bir Hata Oluştu</h1>
                    <p className="text-muted-foreground mb-2">
                        Rezervasyon detayları yüklenirken bir hata oluştu.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Lütfen daha sonra tekrar deneyin veya sistem yöneticisiyle iletişime geçin.
                    </p>
                    <Button asChild>
                        <Link href="/reservations">Rezervasyonlara Dön</Link>
                    </Button>
                </div>
            </div>
        );
    }
} 