"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Müşteri formu için şema
const customerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Müşteri adı en az 2 karakter olmalıdır.",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }).optional().or(z.literal("")),
  phone: z.string().min(10, {
    message: "Geçerli bir telefon numarası giriniz.",
  }).optional().or(z.literal("")),
  notes: z.string().max(500, {
    message: "Notlar en fazla 500 karakter olabilir.",
  }).optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

// Varsayılan değerler
const defaultValues: Partial<CustomerFormValues> = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

interface CustomerFormProps {
  customer?: any;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form tanımı
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? {
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
    } : defaultValues,
  });
  
  // Form gönderme işlemi
  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);
    
    try {
      console.log("Form gönderiliyor:", data);
      
      if (customer) {
        // Mevcut müşteriyi güncelle
        const { error } = await supabase
          .from("customers")
          .update({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.id);
        
        if (error) {
          console.error("Müşteri güncelleme hatası:", error);
          throw error;
        }
        
        console.log("Müşteri başarıyla güncellendi");
        
        toast({
          title: "Müşteri güncellendi",
          description: "Müşteri bilgileri başarıyla güncellendi.",
        });
      } else {
        // Yeni müşteri ekle
        console.log("Yeni müşteri ekleniyor:", {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
        });
        
        const { data: newCustomer, error } = await supabase
          .from("customers")
          .insert([{
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
          }])
          .select();
        
        if (error) {
          console.error("Müşteri ekleme hatası:", error);
          throw error;
        }
        
        console.log("Müşteri başarıyla eklendi:", newCustomer);
        
        toast({
          title: "Müşteri eklendi",
          description: "Yeni müşteri başarıyla eklendi.",
        });
        
        // Formu sıfırla
        form.reset(defaultValues);
        
        // Başarı callback'ini çağır
        if (onSuccess) {
          onSuccess();
          return; // Yönlendirmeyi engelle
        }
      }
      
      // Yönlendirmeyi geciktir
      setTimeout(() => {
        // Müşteriler sayfasına yönlendir
        router.push("/customers"); // /admin/customers yerine /customers
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Müşteri kaydedilirken hata oluştu:", error);
      
      // Hata detaylarını göster
      let errorMessage = "Müşteri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.";
      if (error instanceof Error) {
        errorMessage += ` Hata: ${error.message}`;
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri Adı</FormLabel>
              <FormControl>
                <Input placeholder="Müşteri adını giriniz" {...field} />
              </FormControl>
              <FormDescription>
                Müşterinin tam adını giriniz.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder="E-posta adresini giriniz" {...field} />
              </FormControl>
              <FormDescription>
                Müşterinin e-posta adresi (opsiyonel).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input placeholder="Telefon numarasını giriniz" {...field} />
              </FormControl>
              <FormDescription>
                Müşterinin telefon numarası (opsiyonel).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Müşteri hakkında notlar" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Müşteri hakkında özel notlar (opsiyonel).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/customers")}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : customer ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 