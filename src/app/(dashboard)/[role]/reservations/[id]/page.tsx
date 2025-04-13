import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {notFound} from "next/navigation";
import {ReservationDetail} from "@/components/reservations/ReservationDetail";

interface Payment {
    amount: number;
}

interface Reservation {
    id: string;
    price: number;
    deposit: number;
    payments?: Payment[];
    tattoo_artist: string;
    sales_source: string;
}

export default async function ReservationDetailPage({
    params,
}: {
    params: { role: string; id: string };
}) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: reservation, error} = await supabase
        .from("reservations")
        .select(`
            *,
            tattoo_artist_user:tattoo_artist(name),
            payments (
                id,
                amount,
                payment_date,
                payment_method,
                notes,
                created_at
            )
        `)
        .eq("id", params.id)
        .single();

    if (error || !reservation) {
        return notFound();
    }

    // Kullanıcı rolüne göre erişim kontrolü
    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
        return notFound();
    }

    const {data: userData} = await supabase
        .from("users")
        .select("role, name")
        .eq("id", session.user.id)
        .single();

    // Rol kontrolü
    const role = userData?.role;

    // Admin ve designer tüm rezervasyonlara erişebilir
    // Tattoo artist sadece kendi rezervasyonlarına erişebilir
    // Info sadece kendi yönlendirdiği rezervasyonlara erişebilir
    if (role === "tattoo_artist" && reservation.tattoo_artist !== session.user.id) {
        return notFound();
    }

    if (role === "info" && reservation.sales_source !== userData?.name) {
        return notFound();
    }

    // Ödemeleri düzenle ve toplamları hesapla
    const deposit = reservation.deposit || 0;
    const additionalPayments = (reservation.payments || []).reduce((sum: number, payment: Payment) => {
        const amount = typeof payment.amount === 'number' ? payment.amount : 0;
        return sum + amount;
    }, 0);

    // Toplam ödenen tutar (ön ödeme + diğer ödemeler)
    const totalPaid = additionalPayments;
    
    // Kalan tutarı hesapla (toplam tutardan ön ödemeyi düş, sonra ek ödemeleri düş)
    const remainingAmount = Math.max(0, (reservation.price - deposit) - additionalPayments);

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Rezervasyon Detayı</h1>
            <ReservationDetail reservation={reservation} userRole={role}/>
            <div className="grid grid-cols-2 gap-4">
                {/* Toplam Tutar */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Toplam Tutar</div>
                    <div className="text-lg font-semibold">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(reservation.price)}
                    </div>
                </div>

                {/* Ön Ödeme */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Ön Ödeme</div>
                    <div className="text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deposit)}
                    </div>
                </div>

                {/* Ek Ödemeler */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Ek Ödemeler</div>
                    <div className="text-lg font-semibold text-green-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(additionalPayments)}
                    </div>
                </div>

                {/* Toplam Ödenen */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Toplam Ödenen</div>
                    <div className="text-lg font-semibold text-green-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deposit + additionalPayments)}
                    </div>
                </div>

                {/* Kalan */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Kalan</div>
                    <div className="text-lg font-semibold text-orange-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remainingAmount)}
                    </div>
                </div>
            </div>
        </div>
    );
} 