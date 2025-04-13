import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {ArtistSchedule} from "@/components/artists/ArtistSchedule";

export const metadata = {
    title: "Sanatçı Programı | Stüdyo Yönetim Sistemi",
    description: "Sanatçı çalışma programını düzenleyin",
};

export default async function ArtistSchedulePage({params}: { params: { id: string } }) {
    const supabase = createServerComponentClient({cookies});

    // Kullanıcı oturumunu kontrol et
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) {
        redirect("/login");
    }

    // Kullanıcı rolünü kontrol et
    const {data: userRole} = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

    if (!userRole || userRole.role !== "admin") {
        redirect("/dashboard");
    }

    // Sanatçı bilgilerini getir
    const {data: artist} = await supabase
        .from("artists")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!artist) {
        redirect("/admin/artists");
    }

    // Sanatçının programını getir
    const {data: schedule} = await supabase
        .from("artist_schedule")
        .select("*")
        .eq("artist_id", params.id)
        .order("day_of_week");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{artist.name} - Çalışma Programı</h1>
                <p className="text-muted-foreground">Sanatçının çalışma saatlerini ve molalarını düzenleyin.</p>
            </div>
            <div className="grid gap-8">
                <ArtistSchedule artistId={params.id} schedule={schedule || []}/>
            </div>
        </div>
    );
} 