"use client";

import {useEffect, useState} from "react";
import {format} from "date-fns";
import {tr} from "date-fns/locale";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";

interface PaymentHistoryProps {
    reservationId: string;
    totalPrice: number;
}

// Para birimi sembolleri
const currencySymbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€"
};

// Para birimi formatlama fonksiyonu
const formatCurrency = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || "₺";
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
};

export function PaymentHistory({reservationId, totalPrice}: PaymentHistoryProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currency, setCurrency] = useState("TRY"); // Varsayılan para birimi
    const supabase = createClientComponentClient();

    // Rezervasyonun para birimini al
    useEffect(() => {
        const fetchCurrency = async () => {
            const {data, error} = await supabase
                .from("reservations")
                .select("currency")
                .eq("id", reservationId)
                .single();

            if (data?.currency) {
                setCurrency(data.currency);
            }
        };

        fetchCurrency();
    }, [reservationId, supabase]);

    useEffect(() => {
        const loadPayments = async () => {
            try {
                setLoading(true);
                setError(null);

                const {data, error} = await supabase
                    .from('payments')
                    .select('*')
                    .eq('reservation_id', reservationId)
                    .order('payment_date', {ascending: false});

                if (error) throw error;
                setPayments(data || []);
            } catch (err) {
                console.error('Ödemeler yüklenirken hata:', err);
                setError('Ödemeler yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        loadPayments();
    }, [reservationId]);

    // Toplam ödenen tutarı hesapla
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const remainingAmount = totalPrice - totalPaid;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Ödeme Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Özet Bilgiler */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                            <div className="text-sm text-muted-foreground">Toplam Tutar</div>
                            <div className="text-lg font-semibold">{formatCurrency(totalPrice, currency)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Ödenen</div>
                            <div className="text-lg font-semibold text-green-600">
                                {formatCurrency(totalPaid, currency)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Kalan</div>
                            <div className="text-lg font-semibold text-yellow-600">
                                {formatCurrency(remainingAmount, currency)}
                            </div>
                        </div>
                    </div>

                    {/* Ödeme Listesi */}
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-destructive">{error}</div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">Henüz ödeme kaydı bulunmuyor</div>
                    ) : (
                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium">{formatCurrency(payment.amount, currency)}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(payment.payment_date), "dd MMMM yyyy HH:mm", {locale: tr})}
                                        </div>
                                        {payment.notes && (
                                            <div className="text-sm text-muted-foreground mt-1">{payment.notes}</div>
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        {payment.payment_method === 'cash' && 'Nakit'}
                                        {payment.payment_method === 'credit_card' && 'Kredi Kartı'}
                                        {payment.payment_method === 'bank_transfer' && 'Havale/EFT'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 