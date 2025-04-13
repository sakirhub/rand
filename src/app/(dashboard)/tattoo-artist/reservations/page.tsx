import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {ReservationList} from "@/components/reservations/ReservationList";

export default async function TattooArtistReservationsPage() {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
        return null;
    }

    const {data: reservations, error} = await supabase
        .from("reservations")
        .select("*")
        .eq("tattoo_artist", session.user.id)
        .order("date", {ascending: false});

    if (error) {
        console.error("Error fetching reservations:", error);
        return <div>Rezervasyonlar yüklenirken bir hata oluştu.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Rezervasyonlarım</h1>
            <ReservationList reservations={reservations} role="tattoo-artist"/>
        </div>
    );
} 