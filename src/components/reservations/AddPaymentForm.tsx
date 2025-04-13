"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const formSchema = z.object({
  amount: z.string().min(1, "Ödeme tutarı gereklidir"),
  payment_method: z.string().min(1, "Ödeme yöntemi gereklidir"),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPaymentFormProps {
  reservationId: string;
  totalPrice: number;
  totalPaid: number;
  onSuccess?: () => void;
}

export function AddPaymentForm({ reservationId, totalPrice, totalPaid, onSuccess }: AddPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const supabase = createClientComponentClient();
  
  // Kalan tutarı hesapla
  const remainingAmount = totalPrice - totalPaid;
  
  // Ödemeleri yükleme fonksiyonu
  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('payment_date', { ascending: false });
      
    if (error) {
      console.error('Ödemeler yüklenirken hata:', error);
      return;
    }
    
    setPayments(data || []);
  };
  
  useEffect(() => {
    loadPayments();
  }, [reservationId]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: remainingAmount > 0 ? remainingAmount.toString() : "",
      payment_method: "",
      payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from("payments")
        .insert({
          reservation_id: reservationId,
          amount: data.amount,
          payment_method: data.payment_method,
          payment_date: data.payment_date,
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Formu sıfırla
      form.reset();
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error("Ödeme eklenirken hata:", error);
      toast.error("Ödeme eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Ödeme Ekle</CardTitle>
        <CardDescription>
          Toplam Tutar: {totalPrice.toLocaleString('tr-TR')} ₺ | 
          Ödenen: {totalPaid.toLocaleString('tr-TR')} ₺ | 
          Kalan: {remainingAmount.toLocaleString('tr-TR')} ₺
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Tutarı</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue <= remainingAmount) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Kalan tutar: {remainingAmount.toLocaleString('tr-TR')} ₺
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Yöntemi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                      <SelectItem value="bank_transfer">Havale/EFT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Tarihi</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Ödeme ile ilgili notlar..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ödeme Ekle
            </Button>
          </form>
        </Form>
        
        {/* Önceki Ödemeler */}
        {payments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Önceki Ödemeler</h3>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="text-sm flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <div>{payment.amount.toLocaleString('tr-TR')} ₺</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date), "dd.MM.yyyy HH:mm", { locale: tr })}
                    </div>
                  </div>
                  <div className="text-xs">
                    {payment.payment_method === 'cash' && 'Nakit'}
                    {payment.payment_method === 'credit_card' && 'Kredi Kartı'}
                    {payment.payment_method === 'bank_transfer' && 'Havale/EFT'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 