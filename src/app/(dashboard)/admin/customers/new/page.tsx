import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {CustomerForm} from "@/components/customers/CustomerForm";

export const metadata = {
    title: "Yeni Müşteri | Stüdyo Yönetim Sistemi",
    description: "Yeni müşteri ekleyin",
};

export default async function NewCustomerPage() {
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

    // Eğer user_roles tablosu yoksa veya kullanıcının rolü yoksa
    // geçici olarak admin rolü atayabilirsiniz (sadece geliştirme aşamasında)
    if (!userRole) {
        // Geliştirme aşamasında geçici çözüm
        console.warn("Kullanıcı rolü bulunamadı, varsayılan olarak admin rolü atanıyor.");

        // Opsiyonel: Kullanıcıya admin rolü atama
        try {
            await supabase
                .from("user_roles")
                .insert([{user_id: session.user.id, role: "admin"}]);
        } catch (error) {
            console.error("Rol atama hatası:", error);
        }

        // Sayfaya erişime izin ver
    } else if (userRole.role !== "admin") {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Yeni Müşteri</h1>
                <p className="text-muted-foreground">Stüdyonuza yeni bir müşteri ekleyin.</p>
            </div>
            <div className="grid gap-8">
                <CustomerForm/>
            </div>
        </div>
    );
} 