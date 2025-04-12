import { Badge } from "@/components/ui/badge";

interface ReservationStatusBadgeProps {
  status: string;
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Beklemede</Badge>;
    case "confirmed":
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Onaylandı</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Tamamlandı</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">İptal Edildi</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
} 