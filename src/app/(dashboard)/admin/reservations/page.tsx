"use client";

import {useEffect, useState} from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Button} from "@/components/ui/button";
import {PlusCircle, RefreshCw} from "lucide-react";
import Link from "next/link";
import {ReservationList} from "@/components/reservations/ReservationList";
import {ReservationTable} from "@/components/reservations/ReservationTable";
import {ViewToggle} from "@/components/reservations/ViewToggle";
import {useLocalStorage} from "@/hooks/use-local-storage";

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // Yenileme tetikleyicisi
    const [view, setView] = useLocalStorage<"list" | "table">("admin-reservations-view", "list");

    const supabase = createClientComponentClient();

    // Manuel yenileme fonksiyonu
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Rezervasyonları getir - ilişkili tablolarla birlikte
            const {data, error} = await supabase
                .from("reservations")
                .select(`
          *,
          customers:customer_id (*),
          artists:artist_id (*)
        `)
                .order("date", {ascending: false});

            if (error) {
                console.error("Rezervasyonlar getirilirken hata:", error);
            } else {
                // Fotoğraf URL'lerini işle
                const processedData = await Promise.all((data || []).map(async (reservation) => {
                    // Eğer before_photo veya after_photo varsa, public URL'leri al
                    if (reservation.before_photo) {
                        const {data: beforePhotoUrl} = await supabase
                            .storage
                            .from('tattoo-photos')
                            .getPublicUrl(reservation.before_photo);

                        reservation.before_photo_url = beforePhotoUrl.publicUrl;
                    }

                    if (reservation.after_photo) {
                        const {data: afterPhotoUrl} = await supabase
                            .storage
                            .from('tattoo-photos')
                            .getPublicUrl(reservation.after_photo);

                        reservation.after_photo_url = afterPhotoUrl.publicUrl;
                    }

                    return reservation;
                }));

                setReservations(processedData);
            }

            setLoading(false);
        }

        fetchData();
    }, [supabase, refreshKey]); // refreshKey değiştiğinde yeniden veri çek

    if (loading) {
        return (
            <div className="container py-8">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    Tüm Rezervasyonlar
                </h1>
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                        Yenile
                    </Button>
                    <ViewToggle currentView={view} onViewChange={setView}/>
                    <Button asChild>
                        <Link href="/reservations/new">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Yeni Rezervasyon
                        </Link>
                    </Button>
                </div>
            </div>

            {view === "list" ? (
                <ReservationList
                    reservations={reservations}
                    userRole="admin"
                    onStatusChange={handleRefresh}
                />
            ) : (
                <ReservationTable
                    reservations={reservations}
                    userRole="admin"
                    onStatusChange={handleRefresh}
                />
            )}
        </div>
    );
} 