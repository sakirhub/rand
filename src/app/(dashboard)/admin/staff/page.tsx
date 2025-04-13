import { Metadata } from "next";
import { StaffTable } from "@/components/staff/StaffTable";

export const metadata: Metadata = {
  title: "Personel Yönetimi",
  description: "Personel yönetimi sayfası",
};

export default function StaffPage() {
  return (
    <div className="container mx-auto py-6">
      <StaffTable />
    </div>
  );
} 