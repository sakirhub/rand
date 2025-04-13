"use client";

import {User} from "@/types";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Calendar, Mail} from "lucide-react";
import Link from "next/link";

interface UserCardProps {
    user: User;
}

export function UserCard({user}: UserCardProps) {
    const roleColors = {
        admin: "bg-red-500",
        designer: "bg-blue-500",
        tattoo_artist: "bg-green-500",
        info: "bg-yellow-500",
    };

    const roleLabels = {
        admin: "Admin",
        designer: "Designer",
        tattoo_artist: "Tattoo Artist",
        info: "Info",
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="space-y-2">
                    <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4"/>
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4"/>
                        <span>Kayıt: {formatDate(user.created_at)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Link href={`/admin/users/${user.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                        Kullanıcıyı Düzenle
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
} 