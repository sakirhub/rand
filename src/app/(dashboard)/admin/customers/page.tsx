import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CustomerList } from "@/components/customers/CustomerList";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Müşteriler | Stüdyo Yönetim Sistemi",
  description: "Müşterileri yönetin",
};

export default async function CustomersPage() {
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
  
  // Eğer user_roles tablosu yoksa veya kullanıcının rolü yoksa
  // geçici olarak admin rolü atayabilirsiniz (sadece geliştirme aşamasında)
  if (!userRole) {
    // Geliştirme aşamasında geçici çözüm
    console.warn("Kullanıcı rolü bulunamadı, varsayılan olarak admin rolü atanıyor.");
    
    // Opsiyonel: Kullanıcıya admin rolü atama
    try {
      await supabase
        .from("user_roles")
        .insert([{ user_id: session.user.id, role: "admin" }]);
    } catch (error) {
      console.error("Rol atama hatası:", error);
    }
    
    // Sayfaya erişime izin ver
  } else if (userRole.role !== "admin") {
    redirect("/dashboard");
  }
  
  // Müşterileri getir
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  
  if (error) {
    console.error("Müşteriler getirilirken hata oluştu:", error);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground">Stüdyonuzdaki müşterileri yönetin.</p>
        </div>
        <Link href="/admin/customers/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </Link>
      </div>
      <div>
        <CustomerList customers={customers || []} />
      </div>
    </div>
  );
} 