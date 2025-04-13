import { useState } from "react";
import { useRouter } from "next/navigation";
import { Staff } from "@/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const staffSchema = z.object({
  full_name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  position: z.enum(["admin", "designer", "tattoo_artist", "piercing_artist", "info"]),
  is_active: z.boolean().default(true),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormProps {
  staff?: Staff;
  mode: 'create' | 'edit';
}

export default function StaffForm({ staff, mode }: StaffFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: staff?.full_name || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      position: staff?.position || 'info',
      is_active: staff?.is_active ?? true,
    },
  });

  const onSubmit = async (data: StaffFormValues) => {
    try {
      setLoading(true);
      console.log("Form data:", data);

      if (mode === 'create') {
        console.log("Creating new staff...");
        const { data: result, error } = await supabase
          .from('staff')
          .insert([data])
          .select();

        if (error) {
          console.error("Supabase error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log("Staff created:", result);
        toast({
          title: 'Başarılı',
          description: 'Personel başarıyla oluşturuldu.',
        });
      } else {
        console.log("Updating staff:", staff?.id);
        const { data: result, error } = await supabase
          .from('staff')
          .update(data)
          .eq('id', staff?.id)
          .select();

        if (error) {
          console.error("Supabase error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log("Staff updated:", result);
        toast({
          title: 'Başarılı',
          description: 'Personel başarıyla güncellendi.',
        });
      }

      router.push('/admin/staff');
    } catch (error: any) {
      console.error('Error saving staff:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: 'Hata',
        description: error.message || 'Personel kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Yeni Personel' : 'Personel Düzenle'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <Input type="email" {...field} />
                  </FormControl>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pozisyon</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pozisyon seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="designer">Tasarımcı</SelectItem>
                      <SelectItem value="tattoo_artist">Dövme Sanatçısı</SelectItem>
                      <SelectItem value="piercing_artist">Piercing Sanatçısı</SelectItem>
                      <SelectItem value="info">Bilgi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktif</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/staff')}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 