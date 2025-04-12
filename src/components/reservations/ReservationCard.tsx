"use client";

import { Reservation } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, DollarSign, Image as ImageIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from 'next/image';

interface ReservationCardProps {
  reservation: Reservation;
  role: string;
}

export function ReservationCard({ reservation, role }: ReservationCardProps) {
  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    completed: "bg-blue-500",
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {reservation.customer_name}
          </CardTitle>
          <Badge className={statusColors[reservation.status]}>
            {reservation.status === "pending" && "Beklemede"}
            {reservation.status === "approved" && "Onaylandı"}
            {reservation.status === "completed" && "Tamamlandı"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          #{reservation.reservation_no}
        </p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{formatDate(reservation.date)}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4" />
            <span>{reservation.type === "tattoo" ? "Dövme" : "Piercing"}</span>
          </div>
          <div className="flex items-center text-sm">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{formatCurrency(reservation.price, reservation.currency)}</span>
          </div>
          {(reservation.image_before || reservation.image_after) && (
            <div className="flex items-center text-sm">
              <ImageIcon className="mr-2 h-4 w-4" alt="Reservation image" />
              <span>
                {reservation.image_before && "Öncesi "}
                {reservation.image_before && reservation.image_after && "& "}
                {reservation.image_after && "Sonrası"}
                {" fotoğraflar mevcut"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/${role}/reservations/${reservation.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            Detayları Görüntüle
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 