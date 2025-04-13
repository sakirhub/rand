import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {ReservationList} from "@/components/reservations/ReservationList";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Plus} from "lucide-react";

export default async function DesignerReservationsPage() {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: reservations, error} = await supabase
        .from("reservations")
        .select("*")
        .order("date", {ascending: false});

    if (error) {
        console.error("Error fetching reservations:", error);
        return <div>Rezervasyonlar yüklenirken bir hata oluştu.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Rezervasyonlar</h1>
                <Link href="/designer/reservations/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4"/>
                        Yeni Rezervasyon
                    </Button>
                </Link>
            </div>
            <ReservationList reservations={reservations} role="designer"/>
        </div>
    );
} 