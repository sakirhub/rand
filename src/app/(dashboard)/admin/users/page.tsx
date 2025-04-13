import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Plus} from "lucide-react";
import {UserList} from "@/components/users/UserList";

export default async function AdminUsersPage() {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: users, error} = await supabase
        .from("users")
        .select("*")
        .order("created_at", {ascending: false});

    if (error) {
        console.error("Error fetching users:", error);
        return <div>Kullanıcılar yüklenirken bir hata oluştu.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
                <Link href="/admin/users/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4"/>
                        Yeni Kullanıcı
                    </Button>
                </Link>
            </div>
            <UserList users={users}/>
        </div>
    );
} 