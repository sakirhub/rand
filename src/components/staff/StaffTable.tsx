"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Edit, Plus, Trash2} from "lucide-react";
import {useToast} from "@/components/ui/use-toast";
import {supabase} from "@/lib/supabase";
import {Staff} from "@/types";

export function StaffTable() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const {toast} = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            console.log("Fetching staff data...");
            const {data, error} = await supabase
                .from("staff")
                .select("*")
                .order("created_at", {ascending: false});

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            console.log("Staff data:", data);
            setStaff(data || []);
        } catch (error: any) {
            console.error("Error fetching staff:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            toast({
                title: "Hata",
                description: error.message || "Personel listesi alınamadı.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const {error} = await supabase.from("staff").delete().eq("id", id);
            if (error) throw error;

            toast({
                title: "Başarılı",
                description: "Personel başarıyla silindi.",
            });

            fetchStaff();
        } catch (error) {
            console.error("Error deleting staff:", error);
            toast({
                title: "Hata",
                description: "Personel silinemedi.",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/admin/staff/${id}/edit`);
    };

    const handleNew = () => {
        router.push('/admin/staff/new');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Personel Listesi</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>E-posta</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Pozisyon</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell>{member.full_name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.phone}</TableCell>
                                <TableCell>{member.position}</TableCell>
                                <TableCell>{member.is_active ? "Aktif" : "Pasif"}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(member.id)}
                                    >
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2"/>
                    Yeni Personel Ekle
                </Button>
            </div>
        </div>
    );
} 