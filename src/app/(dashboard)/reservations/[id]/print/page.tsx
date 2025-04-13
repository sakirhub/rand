"use client";

import {useEffect, useState} from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {format} from "date-fns";
import {tr} from "date-fns/locale";
import {ArrowLeft, Printer} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {use} from "react";

interface PrintPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function PrintPage({params}: PrintPageProps) {
    const [reservation, setReservation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();
    const resolvedParams = use(params);
    const reservationId = resolvedParams.id;

    useEffect(() => {
        const fetchReservation = async () => {
            try {
                console.log("Rezervasyon ID:", reservationId);
                
                // Rezervasyon detaylarını getir
                const {data: reservationData, error: reservationError} = await supabase
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
                    .eq("id", reservationId)
                    .single();

                if (reservationError) {
                    console.error("Rezervasyon getirme hatası:", reservationError);
                    return;
                }
                
                if (!reservationData) {
                    console.error("Rezervasyon bulunamadı, ID:", reservationId);
                    return;
                }

                console.log("Rezervasyon bulundu:", {
                    id: reservationData.id,
                    images: reservationData.reservation_images?.length || 0,
                    imageUrls: reservationData.reservation_images?.map((img: any) => img.image_url) || []
                });

                // Sanatçı bilgilerini getir
                let artist = null;
                if (reservationData.artist_id) {
                    console.log("Sanatçı ID:", reservationData.artist_id);
                    
                    try {
                        // Önce artists tablosundan deneyelim
                        const {data: artistData, error: artistError} = await supabase
                            .from("artists")
                            .select("id, name, email, phone")
                            .eq("id", reservationData.artist_id)
                            .single();

                        if (artistError) {
                            console.error("Artists tablosundan veri çekme hatası:", artistError);
                            
                            // Artists tablosundan veri çekilemezse users tablosundan deneyelim
                            const {data: userData, error: userError} = await supabase
                                .from("users")
                                .select("id, full_name, email, phone")
                                .eq("id", reservationData.artist_id)
                                .single();

                            if (userError) {
                                console.error("Users tablosundan veri çekme hatası:", userError);
                            } else if (userData) {
                                console.log("Users tablosundan sanatçı bulundu:", userData.full_name);
                                artist = {
                                    id: userData.id,
                                    name: userData.full_name,
                                    email: userData.email,
                                    phone: userData.phone
                                };
                            }
                        } else if (artistData) {
                            console.log("Artists tablosundan sanatçı bulundu:", artistData.name);
                            artist = artistData;
                        }
                    } catch (error) {
                        console.error("Sanatçı bilgileri alınırken hata:", error);
                    }
                } else {
                    console.log("Rezervasyonda sanatçı ID bulunamadı");
                }

                // Sonuçları birleştir
                const result = {
                    ...reservationData,
                    artist,
                    customer: reservationData.customer,
                    payments: reservationData.payments || []
                };
                
                console.log("Birleştirilmiş rezervasyon verisi:", {
                    id: result.id,
                    customer: result.customer ? "Var" : "Yok",
                    artist: result.artist ? "Var" : "Yok",
                    reservationImages: result.reservation_images?.length || 0,
                    payments: result.payments?.length || 0
                });
                
                setReservation(result);
            } catch (error) {
                console.error("Rezervasyon detayları alınırken hata:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReservation();
    }, [reservationId, supabase]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    if (!reservation) {
        return <div>Rezervasyon bulunamadı</div>;
    }

    const formatDate = (date: string) => {
        return format(new Date(date), "dd MMMM yyyy", {locale: tr});
    };

    const formatTime = (time: string) => {
        if (!time) return "-";
        try {
            return format(new Date(`2000-01-01T${time}`), "HH:mm");
        } catch (error) {
            console.error("Zaman formatı hatası:", error);
            return time; // Eğer format edilemezse orijinal değeri göster
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(amount);
    };

    const totalPaid = reservation.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
    const remainingAmount = reservation.price - totalPaid;

    return (
        <>
            {/* Yazdırmada Gizlenecek Kontroller */}
            <div className="fixed left-4 top-4 z-50 flex items-center gap-4 print:hidden">
                <Link href={`/reservations/${reservationId}`}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Geri Dön
                    </Button>
                </Link>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4"/>
                    Yazdır
                </Button>
            </div>

            {/* Yazdırma Alanı */}
            <div className="min-h-screen bg-white">
                <div className="mx-auto h-[297mm] w-[210mm] bg-white p-8">
                    {/* Üst Kısım Grid */}
                    <div className="grid grid-cols-3 items-start">
                        {/* Phoenix Logo */}
                        <div className="w-48">
                            <Image
                                src="/images/logo.png"
                                alt="Phoenix Logo"
                                width={192}
                                height={96}
                                className="w-full"
                                priority
                            />
                        </div>

                        {/* Başlık */}
                        <div className="text-center text-4xl font-bold">
                            REZERVATION
                        </div>

                        {/* Sağ Üst Köşe Bilgi Kutusu */}
                        <div className="w-64 border-2 border-black p-4 ml-auto">
                            <div className="mb-4 text-center font-bold">TATTOO</div>
                            <div className="space-y-2">
                                <div>DOCUMENT DATE</div>
                                <div className="text-sm text-gray-600">{formatDate(new Date().toISOString())}</div>
                                <div>ORGANIZING PLACE</div>
                                <div>PHOENIX TATTTTO PIERCING</div>
                                <div>KIZILAGAC</div>
                                <div>DESIGN BY</div>
                                <div>{reservation.artist?.name || "-"}</div>
                                {/* QR Kod */}
                                <div className="mt-4">
                                    <Image
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://phoenix-tattoo.com/reservations/${reservation.id}`}
                                        alt="QR Code"
                                        width={150}
                                        height={150}
                                        className="mx-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ana Form */}
                    <div className="mt-16 space-y-4">
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">NAME :</div>
                            <div>{reservation.customer?.name?.split(' ')[0] || "-"}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">SURNAME :</div>
                            <div>{reservation.customer?.name?.split(' ').slice(1).join(' ') || "-"}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">PHONE NUMBER :</div>
                            <div>{reservation.customer?.phone || "-"}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">HOTEL INFORMATION :</div>
                            <div>{reservation.hotel_name || "-"}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">ROOM NUMBER :</div>
                            <div>{reservation.room_number || "-"}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">PRICE :</div>
                            <div>{formatCurrency(reservation.price)}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">DEPOSIT :</div>
                            <div>{formatCurrency(totalPaid)}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">REST :</div>
                            <div>{formatCurrency(remainingAmount)}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">APPOINTMENT DATE :</div>
                            <div>{formatDate(reservation.date)}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">APPOINTMENT TIME :</div>
                            <div>{formatTime(reservation.time)}</div>
                        </div>
                        <div className="grid grid-cols-[200px,1fr] items-center">
                            <div className="font-bold">PICKUP SERVICE :</div>
                            <div>{reservation.pickup_service ? "YES" : "NO"}</div>
                        </div>
                    </div>

                    {/* Alt Bilgi */}
                    <div className="mt-auto border-t border-black pt-4">
                        <div className="text-center">
                            KIZILAAĞAÇ, MERKEZ SK A BLOK Z-1 MANAVGAT, ANTALYA
                        </div>
                        <div className="mt-4 flex justify-center space-x-8">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                                +90 545 381 0788
                            </div>
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                </svg>
                                PHOENIXTATTOOPIERCING
                            </div>
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                                </svg>
                                PHOENIXTATTOOPIERCING
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yazdırma Stilleri */}
            <style jsx global>{`
                @media screen {
                    body {
                        background: rgb(243 244 246);
                    }
                    .min-h-screen {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 2rem;
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .min-h-screen, .min-h-screen * {
                        visibility: visible;
                    }
                    .min-h-screen {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        height: 297mm;
                        padding: 0;
                        margin: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
} 