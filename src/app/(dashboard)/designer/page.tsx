import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export const metadata = {
    title: "Designer Dashboard | Stüdyo Yönetim Sistemi",
    description: "Designer dashboard",
};

export default async function DesignerDashboardPage() {
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

    if (!userRole || userRole.role !== "designer") {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Designer Dashboard</h1>
                <p className="text-muted-foreground">Stüdyo yönetim sistemi designer paneli.</p>
            </div>
            <div>
                <p>Dashboard içeriği burada görüntülenecek.</p>
            </div>
        </div>
    );
} 