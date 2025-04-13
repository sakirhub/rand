"use client";

import * as React from "react";
import {Check, ChevronsUpDown, Plus} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Customer} from "@/types";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {CustomerForm} from "./CustomerForm";

interface CustomerComboboxProps {
    customers: Customer[];
    value: string;
    onChange: (value: string) => void;
    onCustomerCreate: (customer: Customer) => void;
}

export function CustomerCombobox({
                                     customers = [],
                                     value = "",
                                     onChange = () => {
                                     },
                                     onCustomerCreate = () => {
                                     }
                                 }: CustomerComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Güvenli bir şekilde müşteri bul
    const selectedCustomer = Array.isArray(customers)
        ? customers.find((customer) => customer?.id === value)
        : undefined;

    // Filtrelenmiş müşteriler
    const filteredCustomers = React.useMemo(() => {
        if (!Array.isArray(customers)) return [];

        if (!searchQuery) return customers;

        return customers.filter((customer) =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value && selectedCustomer
                            ? selectedCustomer.name
                            : "Müşteri seçin..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <div className="flex flex-col">
                        <div className="p-2">
                            <input
                                className="w-full border rounded px-2 py-1"
                                placeholder="Müşteri ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                                <p className="mb-2">Müşteri bulunamadı.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setOpen(false);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Yeni Müşteri Ekle
                                </Button>
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto">
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={cn(
                                            "flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100",
                                            value === customer.id ? "bg-gray-100" : ""
                                        )}
                                        onClick={() => {
                                            onChange(customer.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {customer.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

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