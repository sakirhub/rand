"use client";

import * as React from "react";
import {Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Customer} from "@/types";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {CustomerForm} from "./CustomerForm";

interface CustomerSelectProps {
    customers: Customer[];
    value: string;
    onChange: (value: string) => void;
    onCustomerCreate: (customer: Customer) => void;
}

export function CustomerSelect({
                                   customers = [],
                                   value = "",
                                   onChange = () => {
                                   },
                                   onCustomerCreate = () => {
                                   }
                               }: CustomerSelectProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <div className="flex gap-2">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Müşteri seçin..."/>
                </SelectTrigger>
                <SelectContent>
                    {Array.isArray(customers) && customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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