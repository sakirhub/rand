import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export default async function DashboardPage() {
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

    // Kullanıcı rolüne göre yönlendirme yap
    if (userRole) {
        switch (userRole.role) {
            case "admin":
                redirect("/admin");
            case "designer":
                redirect("/designer");
            case "tattoo_artist":
                redirect("/tattoo-artist");
            case "info":
                redirect("/info");
            default:
                // Bilinmeyen rol
                break;
        }
    }

    // Rol bulunamadıysa veya bilinmeyen bir rolse
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Stüdyo yönetim sistemi.</p>
            </div>
            <div>
                <p>Kullanıcı rolü bulunamadı veya bilinmeyen bir rol.</p>
            </div>
        </div>
    );
} 