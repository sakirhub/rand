import {cookies} from "next/headers";
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {UserForm} from "@/components/users/UserForm";
import {notFound} from "next/navigation";

export default async function EditUserPage({params}: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({cookies: () => cookieStore});

    const {data: user, error} = await supabase
        .from("users")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !user) {
        return notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Kullanıcıyı Düzenle</h1>
            <UserForm user={user}/>
        </div>
    );
} 