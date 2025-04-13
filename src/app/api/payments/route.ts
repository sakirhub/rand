import {createRouteHandlerClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({cookies});

        // Kullanıcı oturumunu kontrol et
        const {data: {session}} = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                {error: "Oturum açmanız gerekiyor"},
                {status: 401}
            );
        }

        // Kullanıcı rolünü kontrol et
        const {data: user, error: userError} = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                {error: "Kullanıcı bilgileri alınamadı"},
                {status: 500}
            );
        }

        // Sadece admin ve designer rollerine sahip kullanıcılar ödeme ekleyebilir
        if (user.role !== "admin" && user.role !== "designer") {
            return NextResponse.json(
                {error: "Bu işlem için yetkiniz yok"},
                {status: 403}
            );
        }

        // İstek gövdesini al
        const body = await request.json();

        // Gerekli alanları kontrol et
        if (!body.reservation_id || !body.amount || !body.payment_method) {
            return NextResponse.json(
                {error: "Rezervasyon ID, ödeme tutusu ve ödeme yöntemi gereklidir"},
                {status: 400}
            );
        }

        // Ödeme bilgilerini kaydet
        const {data, error} = await supabase
            .from("payments")
            .insert({
                reservation_id: body.reservation_id,
                amount: body.amount,
                payment_method: body.payment_method,
                notes: body.notes || null,
                payment_date: body.payment_date || new Date().toISOString()
            })
            .select();

        if (error) {
            console.error("Ödeme kaydetme hatası:", error);
            return NextResponse.json(
                {error: "Ödeme kaydedilemedi"},
                {status: 500}
            );
        }

        return NextResponse.json({success: true, data});
    } catch (error) {
        console.error("Ödeme işlemi sırasında hata:", error);
        return NextResponse.json(
            {error: "Bir hata oluştu"},
            {status: 500}
        );
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({cookies});

        // Kullanıcı oturumunu kontrol et
        const {data: {session}} = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                {error: "Oturum açmanız gerekiyor"},
                {status: 401}
            );
        }

        // URL parametrelerini al
        const {searchParams} = new URL(request.url);
        const reservationId = searchParams.get("reservation_id");

        if (!reservationId) {
            return NextResponse.json(
                {error: "Rezervasyon ID gereklidir"},
                {status: 400}
            );
        }

        // Kullanıcı rolünü kontrol et
        const {data: user, error: userError} = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                {error: "Kullanıcı bilgileri alınamadı"},
                {status: 500}
            );
        }

        // Rezervasyon bilgilerini al
        const {data: reservation, error: reservationError} = await supabase
            .from("reservations")
            .select("artist_id, referred_by")
            .eq("id", reservationId)
            .single();

        if (reservationError || !reservation) {
            return NextResponse.json(
                {error: "Rezervasyon bulunamadı"},
                {status: 404}
            );
        }

        // Yetki kontrolü
        const isAdmin = user.role === "admin";
        const isDesigner = user.role === "designer";
        const isTattooArtist = user.role === "tattoo_artist" && reservation.artist_id === session.user.id;
        const isInfoUser = user.role === "info" && reservation.referred_by === session.user.id;

        if (!isAdmin && !isDesigner && !isTattooArtist && !isInfoUser) {
            return NextResponse.json(
                {error: "Bu rezervasyonun ödemelerini görüntüleme yetkiniz yok"},
                {status: 403}
            );
        }

        // Ödeme bilgilerini getir
        const {data: payments, error: paymentsError} = await supabase
            .from("payments")
            .select("*")
            .eq("reservation_id", reservationId)
            .order("payment_date", {ascending: false});

        if (paymentsError) {
            console.error("Ödeme bilgileri getirme hatası:", paymentsError);
            return NextResponse.json(
                {error: "Ödeme bilgileri alınamadı"},
                {status: 500}
            );
        }

        return NextResponse.json({success: true, data: payments});
    } catch (error) {
        console.error("Ödeme bilgileri getirme işlemi sırasında hata:", error);
        return NextResponse.json(
            {error: "Bir hata oluştu"},
            {status: 500}
        );
    }
} 