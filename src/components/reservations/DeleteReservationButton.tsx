"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/use-toast";
import {Trash} from "lucide-react";

interface DeleteReservationButtonProps {
    id: string;
}

export function DeleteReservationButton({id}: DeleteReservationButtonProps) {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {toast} = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            return;
        }

        setIsLoading(true);

        try {
            // Önce rezervasyon fotoğraflarını sil
            const {data: images} = await supabase
                .from("reservation_images")
                .select("id")
                .eq("reservation_id", id);

            if (images && images.length > 0) {
                await supabase
                    .from("reservation_images")
                    .delete()
                    .eq("reservation_id", id);
            }

            // Rezervasyonu sil
            const {error} = await supabase
                .from("reservations")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Başarılı",
                description: "Rezervasyon başarıyla silindi.",
            });

            router.push("/reservations");
            router.refresh();
        } catch (error: any) {
            console.error("Rezervasyon silinirken hata:", error);

            toast({
                title: "Hata",
                description: error.message || "Rezervasyon silinirken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
        >
            <Trash className="mr-2 h-4 w-4"/>
            {isLoading ? "Siliniyor..." : "Sil"}
        </Button>
    );
} 