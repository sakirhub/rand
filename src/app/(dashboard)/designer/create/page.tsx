import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { ReservationForm } from "@/components/reservations/ReservationForm";

export default async function CreateReservationPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Dövme sanatçılarını getir
  const { data: tattooArtists, error } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "tattoo_artist");

  if (error) {
    console.error("Error fetching tattoo artists:", error);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yeni Rezervasyon Oluştur</h1>
      <ReservationForm tattooArtists={tattooArtists || []} />
    </div>
  );
} 