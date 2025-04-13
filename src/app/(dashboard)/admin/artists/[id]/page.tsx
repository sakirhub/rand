import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {notFound, redirect} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ArtistWorkingHours} from "@/components/artists/ArtistWorkingHours";
import {ChevronLeft} from "lucide-react";
import {ArtistSchedule} from "@/components/artists/ArtistSchedule";

export const metadata = {
    title: "Sanatçı Detayı | Stüdyo Yönetim Sistemi",
    description: "Sanatçı detaylarını ve çalışma saatlerini yönetin",
};

export default async function ArtistDetailPage({
                                                   params,
                                               }: {
    params: { id: string };
}) {
    const supabase = createServerComponentClient({cookies});

    // Kullanıcı oturumunu kontrol et
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) {
        redirect("/login");
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
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/artists">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="mr-2 h-4 w-4"/>
                            Sanatçılar
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold mt-2">{artist.name}</h1>
                    <p className="text-muted-foreground">
                        {artist.type === "tattoo" ? "Dövme Sanatçısı" :
                            artist.type === "piercing" ? "Piercing Uzmanı" :
                                "Dövme ve Piercing Uzmanı"}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Sanatçı Bilgileri</h2>
                    <div className="bg-card rounded-lg border p-4">
                        <dl className="space-y-4">
                            <div>
                                <dt className="font-medium">İsim</dt>
                                <dd>{artist.name}</dd>
                            </div>
                            <div>
                                <dt className="font-medium">Uzmanlık</dt>
                                <dd>
                                    {artist.type === "tattoo" ? "Dövme" :
                                        artist.type === "piercing" ? "Piercing" :
                                            "Dövme ve Piercing"}
                                </dd>
                            </div>
                            {artist.email && (
                                <div>
                                    <dt className="font-medium">E-posta</dt>
                                    <dd>{artist.email}</dd>
                                </div>
                            )}
                            {artist.phone && (
                                <div>
                                    <dt className="font-medium">Telefon</dt>
                                    <dd>{artist.phone}</dd>
                                </div>
                            )}
                            {artist.bio && (
                                <div>
                                    <dt className="font-medium">Biyografi</dt>
                                    <dd>{artist.bio}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Çalışma Saatleri</h2>
                    <ArtistWorkingHours artistId={artist.id}/>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Haftalık Çalışma Programı</h2>
                <ArtistSchedule artistId={artist.id}/>
            </div>
        </div>
    );
} 