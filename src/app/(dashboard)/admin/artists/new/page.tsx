import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArtistForm } from "@/components/artists/ArtistForm";

export const metadata = {
  title: "Yeni Sanatçı | Stüdyo Yönetim Sistemi",
  description: "Yeni sanatçı ekleyin",
};

export default async function NewArtistPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Kullanıcı oturumunu kontrol et
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yeni Sanatçı</h1>
        <p className="text-muted-foreground">Stüdyonuza yeni bir sanatçı ekleyin.</p>
      </div>
      <div className="grid gap-8">
        <ArtistForm />
      </div>
    </div>
  );
} 