"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import StaffForm from "@/components/staff/StaffForm";
import {Staff} from "@/types";
import {supabase} from "@/lib/supabase";
import {useToast} from "@/components/ui/use-toast";

export default function EditStaffPage() {
    const params = useParams();
    const {toast} = useToast();
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const {data, error} = await supabase
                    .from("staff")
                    .select("*")
                    .eq("id", params.id)
                    .single();

                if (error) throw error;
                setStaff(data);
            } catch (error) {
                console.error("Error fetching staff:", error);
                toast({
                    title: "Hata",
                    description: "Personel bilgileri alınamadı.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, [params.id, toast]);

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    if (!staff) {
        return <div>Personel bulunamadı.</div>;
    }

    return (
        <div className="container mx-auto py-6">
            <StaffForm mode="edit" staff={staff}/>
        </div>
    );
} 