import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {notFound, redirect} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ArtistForm} from "@/components/artists/ArtistForm";
import {ChevronLeft} from "lucide-react";

interface PageProps {
    params: {
        id: string;
    };
}

export const metadata = {
    title: "Sanatçı Düzenle | Stüdyo Yönetim Sistemi",
    description: "Sanatçı bilgilerini düzenleyin",
};

export default async function EditArtistPage({params}: PageProps) {
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
    const {data: artist, error} = await supabase
        .from("artists")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !artist) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <Link href={`/admin/artists/${params.id}`}>
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        Sanatçı Detayı
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold mt-2">Sanatçı Düzenle</h1>
                <p className="text-muted-foreground">Sanatçı bilgilerini güncelleyin.</p>
            </div>
            <div className="grid gap-8">
                <ArtistForm artist={artist}/>
            </div>
        </div>
    );
} 