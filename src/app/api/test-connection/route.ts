import {createRouteHandlerClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function GET() {
    try {
        const supabase = createRouteHandlerClient({cookies});

        // Basit bir sorgu çalıştır
        const {data, error} = await supabase
            .from("users")
            .select("count(*)", {count: "exact"});

        if (error) {
            console.error("Supabase bağlantı hatası:", error);
            return NextResponse.json(
                {error: "Veritabanı bağlantısı başarısız", details: error},
                {status: 500}
            );
        }

        return NextResponse.json({
            success: true,
            message: "Supabase bağlantısı başarılı",
            data
        });
    } catch (error) {
        console.error("Test bağlantısı sırasında hata:", error);
        return NextResponse.json(
            {error: "Beklenmeyen bir hata oluştu", details: error},
            {status: 500}
        );
    }
} 