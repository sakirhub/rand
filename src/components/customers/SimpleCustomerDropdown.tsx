"use client";

import * as React from "react";
import {Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Customer} from "@/types";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {CustomerForm} from "./CustomerForm";

interface SimpleCustomerDropdownProps {
    customers: Customer[];
    value: string;
    onChange: (value: string) => void;
    onCustomerCreate: (customer: Customer) => void;
}

export function SimpleCustomerDropdown({
                                           customers = [],
                                           value = "",
                                           onChange = () => {
                                           },
                                           onCustomerCreate = () => {
                                           }
                                       }: SimpleCustomerDropdownProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <div className="flex gap-2">
            <select
                className="w-full p-2 border rounded"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Müşteri seçin...</option>
                {Array.isArray(customers) && customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                        {customer.name}
                    </option>
                ))}
            </select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4"/>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        onSuccess={(customer) => {
                            if (customer && onCustomerCreate) {
                                onCustomerCreate(customer);
                                onChange(customer.id);
                            }
                            setDialogOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 