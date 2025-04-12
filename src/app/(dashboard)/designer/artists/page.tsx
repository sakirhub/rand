import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sanatçılar | Stüdyo Yönetim Sistemi",
  description: "Sanatçıları görüntüleyin",
};

export default async function DesignerArtistsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Kullanıcı oturumunu kontrol et
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  
  // Kullanıcı rolünü kontrol et
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();
  
  if (!userRole || userRole.role !== "designer") {
    redirect("/dashboard");
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sanatçılar</h1>
        <p className="text-muted-foreground">Stüdyodaki sanatçıları görüntüleyin.</p>
      </div>
      <div>
        <p>Sanatçı listesi burada görüntülenecek.</p>
      </div>
    </div>
  );
} 