import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {AdminSidebar, DesignerSidebar} from "@/components/dashboard/Sidebar";
import {Navbar} from "@/components/dashboard/Navbar";
import {ThemeProvider} from "@/components/theme-provider";

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    const supabase = createServerComponentClient({cookies});

    // Kullanıcı oturumunu kontrol et
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) {
        redirect("/login");
    }

    // Kullanıcı rolünü kontrol et
    let userRole = "admin"; // Varsayılan rol
    try {
        const {data: roleData} = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

        if (roleData) {
            userRole = roleData.role;
        }
    } catch (error) {
        console.error("Kullanıcı rolü kontrol edilirken hata:", error);
    }

    // Kullanıcı rolüne göre sidebar'ı belirle
    const SidebarComponent = userRole === "admin" ? AdminSidebar : DesignerSidebar;

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen flex flex-col">
                <Navbar userRole={userRole}/>
                <main className="flex-1 container mx-auto py-6">
                    {children}
                </main>
            </div>
        </ThemeProvider>
    );
} 