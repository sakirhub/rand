import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ChevronLeft} from "lucide-react";
import {ReservationForm} from "@/components/reservations/ReservationForm";
import {z} from "zod";
import {FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

export const metadata = {
    title: "Yeni Rezervasyon | Stüdyo Yönetim Sistemi",
    description: "Yeni rezervasyon oluşturun",
};

const formSchema = z.object({
  customer_id: z.string().min(1, "Müşteri seçimi zorunludur"),
  artist_id: z.string().min(1, "Sanatçı seçimi zorunludur"),
  date: z.date({
    required_error: "Tarih seçimi zorunludur",
  }),
  time: z.string().min(1, "Saat seçimi zorunludur"),
  price: z.string().min(1, "Fiyat zorunludur"),
  deposit_amount: z.string().min(1, "Depozito tutarı zorunludur"),
  notes: z.string().optional(),
  hotel_info: z.string().optional(),
  room_info: z.string().optional(),
  service_area: z.string().optional(),
});

export default async function NewReservationPage() {
    const supabase = createServerComponentClient({cookies});

    // Kullanıcı oturumunu kontrol et
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <Link href="/reservations">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        Rezervasyonlar
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold mt-2">Yeni Rezervasyon</h1>
                <p className="text-muted-foreground">Yeni bir rezervasyon oluşturun.</p>
            </div>
            <div className="grid gap-8">
                <ReservationForm/>
            </div>
        </div>
    );
} 