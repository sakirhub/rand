"use client";

import {useEffect, useState, use} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {EditReservationForm} from "@/components/reservations/EditReservationForm";
import {useToast} from "@/components/ui/use-toast";
import {Skeleton} from "@/components/ui/skeleton";
import {z} from "zod";

// Rezervasyon düzenleme formu için şema
const editReservationFormSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"], {
        required_error: "Lütfen durum seçin.",
    }),
    notes: z.string().optional(),
    price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
    currency: z.enum(["EUR", "USD", "TRY"], {
        required_error: "Para birimi seçiniz",
    }),
    deposit_amount: z.number().min(0, "Ön ödeme tutarı 0'dan küçük olamaz").optional(),
    deposit_received: z.boolean().default(false),
    staff_id: z.string().optional(),
});

type EditReservationFormValues = z.infer<typeof editReservationFormSchema>;

interface EditPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditPage({ params }: EditPageProps) {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {toast} = useToast();
    const [reservation, setReservation] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const resolvedParams = use(params);

    useEffect(() => {
        const fetchReservation = async () => {
            try {
                // Get user role
                const {data: {user}} = await supabase.auth.getUser();
                if (!user) {
                    router.push("/auth");
                    return;
                }

                const {data: userData, error: userError} = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (userError) throw userError;
                setUserRole(userData.role);

                // Get reservation
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
                            is_before,
                            created_at
                        )
                    `)
                    .eq("id", resolvedParams.id)
                    .single();

                if (reservationError) {
                    console.error("Rezervasyon getirme hatası:", reservationError);
                    throw reservationError;
                }

                if (!reservationData) {
                    throw new Error("Rezervasyon bulunamadı");
                }

                // Sanatçı bilgilerini getir
                let artist = null;
                if (reservationData.artist_id) {
                    const {data: artistData, error: artistError} = await supabase
                        .from("artists")
                        .select("id, name, email, phone")
                        .eq("id", reservationData.artist_id)
                        .single();

                    if (artistError) {
                        console.error("Sanatçı bilgileri alınırken hata:", artistError);
                    } else if (artistData) {
                        artist = artistData;
                    }
                }

                // Sonuçları birleştir
                setReservation({
                    ...reservationData,
                    artist,
                    customer: reservationData.customer,
                    reservation_images: reservationData.reservation_images || []
                });
            } catch (error) {
                console.error("Error fetching reservation:", error);
                toast({
                    title: "Hata",
                    description: "Rezervasyon bilgileri alınamadı.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservation();
    }, [resolvedParams.id, router, supabase, toast]);

    const handleSubmit = async (data: EditReservationFormValues) => {
        try {
            console.log("Gelen form verileri:", data);
            
            const updateData = {
                status: data.status,
                notes: data.notes,
                price: data.price !== undefined ? Number(data.price) : reservation.price,
                currency: data.currency || reservation.currency,
                deposit_amount: data.deposit_amount !== undefined ? Number(data.deposit_amount) : reservation.deposit_amount,
                deposit_received: data.deposit_received !== undefined ? data.deposit_received : reservation.deposit_received,
                staff_id: data.staff_id || reservation.staff_id,
                updated_at: new Date().toISOString()
            };
            
            console.log("Güncellenecek veriler:", updateData);
            console.log("Rezervasyon ID:", resolvedParams.id);

            const {error} = await supabase
                .from("reservations")
                .update(updateData)
                .eq("id", resolvedParams.id);

            if (error) {
                console.error("Supabase güncelleme hatası:", error);
                throw error;
            }

            toast({
                title: "Başarılı",
                description: "Rezervasyon başarıyla güncellendi.",
            });

            router.push(`/reservations/${resolvedParams.id}`);
            router.refresh();
        } catch (error) {
            console.error("Error updating reservation:", error);
            toast({
                title: "Hata",
                description: "Rezervasyon güncellenirken bir hata oluştu.",
                variant: "destructive",
            });
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 p-8">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Rezervasyon Bulunamadı</h1>
                <p>Bu rezervasyon bulunamadı veya erişim izniniz yok.</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-8">Rezervasyon Düzenle</h1>
            <EditReservationForm
                reservation={reservation}
                userRole={userRole}
                onSubmit={handleSubmit}
            />
        </div>
    );
} 