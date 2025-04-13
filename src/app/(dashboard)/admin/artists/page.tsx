import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {ArtistList} from "@/components/artists/ArtistList";
import Link from "next/link";
import {PlusCircle} from "lucide-react";
import {Button} from "@/components/ui/button";

export const metadata = {
    title: "Sanatçılar | Stüdyo Yönetim Sistemi",
    description: "Sanatçıları yönetin",
};

export default async function ArtistsPage() {
    const supabase = createServerComponentClient({cookies});

    // Kullanıcı oturumunu kontrol et
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) {
        redirect("/login");
    }

    // Sanatçıları getir
    let artists = [];
    try {
        const {data, error} = await supabase
            .from("artists")
            .select("*")
            .order("name");

        if (error) {
            console.error("Sanatçılar getirilirken hata oluştu:", error);
        } else {
            artists = data || [];
        }
    } catch (error) {
        console.error("Sanatçılar getirilirken beklenmeyen hata:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sanatçılar</h1>
                    <p className="text-muted-foreground">Stüdyonuzdaki sanatçıları yönetin.</p>
                </div>
                <Link href="/admin/artists/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Yeni Sanatçı
                    </Button>
                </Link>
            </div>
            <div>
                <ArtistList artists={artists}/>
            </div>
        </div>
    );
}