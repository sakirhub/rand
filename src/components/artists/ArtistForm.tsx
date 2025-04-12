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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sanatçı formu için şema
const artistFormSchema = z.object({
  name: z.string().min(2, {
    message: "Sanatçı adı en az 2 karakter olmalıdır.",
  }),
  type: z.enum(["tattoo", "piercing", "both"], {
    required_error: "Lütfen sanatçı türünü seçin.",
  }),
});

type ArtistFormValues = z.infer<typeof artistFormSchema>;

// Varsayılan değerler
const defaultValues: Partial<ArtistFormValues> = {
  name: "",
  type: "both",
};

interface ArtistFormProps {
  artist?: any;
}

export function ArtistForm({ artist }: ArtistFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form tanımı
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: artist ? {
      name: artist.name,
      type: artist.type || "both",
    } : defaultValues,
  });
  
  // Form gönderme işlemi
  const onSubmit = async (data: ArtistFormValues) => {
    setIsLoading(true);
    
    try {
      if (artist) {
        // Mevcut sanatçıyı güncelle
        const { error } = await supabase
          .from("artists")
          .update({
            name: data.name,
            type: data.type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", artist.id);
        
        if (error) {
          console.error("Güncelleme hatası:", error);
          throw new Error(error.message || "Sanatçı güncellenirken bir hata oluştu.");
        }
        
        toast({
          title: "Sanatçı güncellendi",
          description: "Sanatçı bilgileri başarıyla güncellendi.",
        });
      } else {
        // Yeni sanatçı ekle
        console.log("Eklenecek sanatçı verileri:", {
          name: data.name,
          type: data.type,
        });
        
        const { data: insertedData, error } = await supabase
          .from("artists")
          .insert([
            {
              name: data.name,
              type: data.type,
            },
          ])
          .select();
        
        if (error) {
          console.error("Ekleme hatası:", error);
          throw new Error(error.message || "Sanatçı eklenirken bir hata oluştu.");
        }
        
        console.log("Eklenen sanatçı:", insertedData);
        
        toast({
          title: "Sanatçı eklendi",
          description: "Yeni sanatçı başarıyla eklendi.",
        });
      }
      
      // Sanatçılar sayfasına yönlendir
      router.push("/admin/artists");
      router.refresh();
    } catch (error: any) {
      console.error("Sanatçı kaydedilirken hata oluştu:", error);
      toast({
        title: "Hata",
        description: error.message || "Sanatçı kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sanatçı Adı</FormLabel>
              <FormControl>
                <Input placeholder="Sanatçı adını giriniz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sanatçı Türü</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sanatçı türünü seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tattoo">Dövme</SelectItem>
                  <SelectItem value="piercing">Piercing</SelectItem>
                  <SelectItem value="both">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/artists")}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : artist ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 