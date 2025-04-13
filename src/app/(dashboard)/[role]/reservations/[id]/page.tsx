import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {notFound} from "next/navigation";
import {ReservationDetail} from "@/components/reservations/ReservationDetail";

export default async function ReservationDetailPage({
                                                        params
                                                    }: {
    params: { role: string; id: string }
}) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: reservation, error} = await supabase
        .from("reservations")
        .select(`
      *,
      tattoo_artist_user:tattoo_artist(name)
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

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Rezervasyon Detayı</h1>
            <ReservationDetail reservation={reservation} userRole={role}/>
        </div>
    );
} 