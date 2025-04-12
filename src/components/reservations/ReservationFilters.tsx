"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export function ReservationFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  
  // Filtreleri uygula
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (status && status !== "all") {
      params.set("status", status);
    }
    
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    
    if (dateTo) {
      params.set("dateTo", dateTo);
    }
    
    if (search) {
      params.set("search", search);
    }
    
    router.push(`/reservations?${params.toString()}`);
  };
  
  // Filtreleri temizle
  const clearFilters = () => {
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    router.push("/reservations");
  };
  
  // Enter tuşuna basıldığında filtreleri uygula
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };
  
  return (
    <div className="bg-muted/40 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="confirmed">Onaylandı</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateTo">Bitiş Tarihi</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="search">Ara</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Müşteri adı, e-posta veya telefon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="outline" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Temizle
        </Button>
        <Button onClick={applyFilters}>
          <Search className="mr-2 h-4 w-4" />
          Filtrele
        </Button>
      </div>
    </div>
  );
} 