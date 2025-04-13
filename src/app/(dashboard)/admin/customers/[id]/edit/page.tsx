import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {CustomerForm} from "@/components/customers/CustomerForm";

export const metadata = {
    title: "Müşteri Düzenle | Stüdyo Yönetim Sistemi",
    description: "Müşteri bilgilerini düzenleyin",
};

export default async function EditCustomerPage({params}: { params: { id: string } }) {
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

    // Müşteriyi getir
    const {data: customer} = await supabase
        .from("customers")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!customer) {
        redirect("/admin/customers");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Müşteri Düzenle</h1>
                <p className="text-muted-foreground">Müşteri bilgilerini güncelleyin.</p>
            </div>
            <div className="grid gap-8">
                <CustomerForm customer={customer}/>
            </div>
        </div>
    );
} 