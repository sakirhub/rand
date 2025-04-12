"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Grid, 
  List,
  MoreHorizontal
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  referred_by?: string;
  created_at: string;
}

interface CustomerListProps {
  customers: Customer[];
  readOnly?: boolean;
}

export function CustomerList({ customers, readOnly = false }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.email?.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone?.includes(term)
      );
      setFilteredCustomers(filtered);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm("Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      try {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);
        
        if (error) {
          throw error;
        }
        
        // Listeden kaldır
        setFilteredCustomers(prev => prev.filter(customer => customer.id !== id));
        
        toast({
          title: "Müşteri silindi",
          description: "Müşteri başarıyla silindi.",
        });
        
        router.refresh();
      } catch (error) {
        console.error("Müşteri silinirken hata oluştu:", error);
        toast({
          title: "Hata",
          description: "Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    }
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === "grid" ? "list" : "grid");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button variant="outline" size="icon" onClick={toggleViewMode}>
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {searchTerm ? "Arama kriterlerine uygun müşteri bulunamadı." : "Henüz müşteri bulunmuyor."}
        </p>
      ) : viewMode === "grid" ? (
        // Kart Görünümü
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map(customer => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>
                  {format(parseISO(customer.created_at), "dd.MM.yyyy", { locale: tr })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{customer.email}</p>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{customer.phone}</p>
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Notlar:</span> {customer.notes}
                    </p>
                  )}
                </div>
              </CardContent>
              {!readOnly && (
                <CardFooter className="flex justify-between">
                  <Link href={`/admin/customers/${customer.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // Liste Görünümü
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri Adı</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                {!readOnly && <TableHead className="w-[100px]">İşlemler</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    {format(parseISO(customer.created_at), "dd.MM.yyyy", { locale: tr })}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">İşlemler</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/customers/${customer.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 