"use client";

import StaffForm from "@/components/staff/StaffForm";

export default function NewStaffPage() {
    return (
        <div className="container mx-auto py-6">
            <StaffForm mode="create"/>
        </div>
    );
} 