import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { ReservationList } from "@/components/reservations/ReservationList";

export default async function InfoReservationsPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  // Kullanıcı adını al
  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", session.user.id)
    .single();

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("sales_source", userData?.name)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching reservations:", error);
    return <div>Rezervasyonlar yüklenirken bir hata oluştu.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yönlendirmelerim</h1>
      <ReservationList reservations={reservations} role="info" />
    </div>
  );
} 