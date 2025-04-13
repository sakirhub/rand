"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {addMinutes, format, isBefore, isEqual, parse} from "date-fns";
import {tr} from "date-fns/locale";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/use-toast";
import {CalendarIcon, ImagePlus, PlusCircle, X} from "lucide-react";
import {cn} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import Image from "next/image";

// Rezervasyon formu için şema - customer_id ile
const reservationFormSchema = z.object({
    customer_id: z.string({
        required_error: "Lütfen bir müşteri seçin.",
    }),
    artist_id: z.string({
        required_error: "Lütfen bir sanatçı seçin.",
    }),
    staff_id: z.string({
        required_error: "Lütfen bir personel seçin.",
    }),
    service_type: z.enum(["tattoo", "piercing", "consultation"], {
        required_error: "Lütfen hizmet türünü seçin.",
    }),
    date: z.date({
        required_error: "Lütfen bir tarih seçin.",
    }),
    time_slot: z.string({
        required_error: "Lütfen bir saat dilimi seçin.",
    }),
    duration: z.string({
        required_error: "Lütfen süre seçin.",
    }),
    notes: z.string().optional(),
    images: z.array(z.string()).optional(),
    price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
    currency: z.enum(["EUR", "USD", "TRY"], {
        required_error: "Para birimi seçiniz",
    }),
    deposit_amount: z.number().min(0, "Ön ödeme tutarı 0'dan küçük olamaz").optional(),
    deposit_received: z.boolean().default(false),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

// Varsayılan değerler
const defaultValues: Partial<ReservationFormValues> = {
    service_type: "tattoo",
    notes: "",
    price: 0,
    currency: "EUR",
    deposit_amount: 0,
    deposit_received: false,
};

interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

interface Artist {
    id: string;
    name: string;
    type: string;
}

interface Customer {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export function ReservationForm() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedArtist, setSelectedArtist] = useState<string | undefined>(undefined);
    const {toast} = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        email: "",
        full_name: "",
        phone: ""
    });
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);

    // Form tanımı
    const form = useForm<ReservationFormValues>({
        resolver: zodResolver(reservationFormSchema),
        defaultValues,
    });

    // Sanatçıları getir
    useEffect(() => {
        const fetchArtists = async () => {
            const {data, error} = await supabase
                .from("artists")
                .select("*")
                .order("name");

            if (error) {
                console.error("Sanatçılar getirilirken hata oluştu:", error);
                toast({
                    title: "Hata",
                    description: "Sanatçılar yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
                return;
            }

            setArtists(data || []);
        };

        fetchArtists();
    }, [supabase, toast]);

    // Personelleri getir
    useEffect(() => {
        const fetchStaff = async () => {
            const {data, error} = await supabase
                .from("staff")
                .select("*")
                .eq("is_active", true)
                .order("full_name");

            if (error) {
                console.error("Personeller getirilirken hata oluştu:", error);
                toast({
                    title: "Hata",
                    description: "Personeller yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
                return;
            }

            setStaff(data || []);
        };

        fetchStaff();
    }, [supabase, toast]);

    // Sanatçı seçildiğinde çalışma saatlerini kontrol et ve gerekirse oluştur
    useEffect(() => {
        const checkAndCreateWorkingHours = async () => {
            if (!selectedArtist) return;

            try {
                // Sanatçının çalışma saatlerini kontrol et
                const {data, error} = await supabase
                    .from("artist_working_hours")
                    .select("*")
                    .eq("artist_id", selectedArtist);

                if (error) {
                    console.error("Çalışma saatleri kontrolü hatası:", error);
                    return;
                }

                // Eğer çalışma saatleri yoksa, varsayılan saatleri oluştur
                if (!data || data.length === 0) {
                    console.log("Sanatçı için varsayılan çalışma saatleri oluşturuluyor...");

                    // Haftanın her günü için varsayılan çalışma saatleri
                    const defaultWorkingHours = [
                        {day_of_week: 0, start_time: "10:00:00", end_time: "18:00:00", is_available: true}, // Pazar
                        {day_of_week: 1, start_time: "09:00:00", end_time: "18:00:00", is_available: true}, // Pazartesi
                        {day_of_week: 2, start_time: "09:00:00", end_time: "18:00:00", is_available: true}, // Salı
                        {day_of_week: 3, start_time: "09:00:00", end_time: "18:00:00", is_available: true}, // Çarşamba
                        {day_of_week: 4, start_time: "09:00:00", end_time: "18:00:00", is_available: true}, // Perşembe
                        {day_of_week: 5, start_time: "09:00:00", end_time: "18:00:00", is_available: true}, // Cuma
                        {day_of_week: 6, start_time: "10:00:00", end_time: "16:00:00", is_available: true}, // Cumartesi
                    ];

                    // Her gün için çalışma saati ekle
                    for (const workingHour of defaultWorkingHours) {
                        const {error: insertError} = await supabase
                            .from("artist_working_hours")
                            .insert({
                                artist_id: selectedArtist,
                                day_of_week: workingHour.day_of_week,
                                start_time: workingHour.start_time,
                                end_time: workingHour.end_time,
                                is_available: workingHour.is_available,
                            });

                        if (insertError) {
                            console.error(`Gün ${workingHour.day_of_week} için çalışma saati eklenirken hata:`, insertError);
                        }
                    }

                    console.log("Varsayılan çalışma saatleri oluşturuldu.");
                } else {
                    console.log("Sanatçının çalışma saatleri zaten var:", data.length);
                }
            } catch (error) {
                console.error("Çalışma saatleri oluşturulurken hata:", error);
            }
        };

        checkAndCreateWorkingHours();
    }, [selectedArtist, supabase]);

    // Sanatçı değiştiğinde veya tarih seçildiğinde uygun zaman dilimlerini getir
    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (!selectedDate || !selectedArtist) return;

            setIsLoadingTimeSlots(true);
            setTimeSlots([]);

            try {
                // Seçilen tarih için formatla
                const formattedDate = format(selectedDate, "yyyy-MM-dd");

                // Sanatçının çalışma saatlerini getir
                const {data: workingHours, error: workingHoursError} = await supabase
                    .from("artist_working_hours")
                    .select("*")
                    .eq("artist_id", selectedArtist)
                    .eq("day_of_week", selectedDate.getDay())
                    .eq("is_available", true);

                if (workingHoursError) {
                    console.error("Çalışma saatleri getirilirken hata:", workingHoursError);
                    throw new Error(`Çalışma saatleri hatası: ${JSON.stringify(workingHoursError)}`);
                }

                if (!workingHours || workingHours.length === 0) {
                    console.log("Bu gün için çalışma saati bulunamadı");
                    return;
                }

                // İlk çalışma saatini kullan (genelde her gün için tek kayıt olacak)
                const workingHour = workingHours[0];

                // Seçilen tarih için mevcut rezervasyonları getir
                const {data: reservationsData, error: reservationsError} = await supabase
                    .from("reservations")
                    .select("*")
                    .eq("artist_id", selectedArtist)
                    .eq("date", formattedDate);

                if (reservationsError) {
                    console.error("Rezervasyonlar getirilirken hata:", reservationsError);
                    throw new Error(`Rezervasyonlar hatası: ${JSON.stringify(reservationsError)}`);
                }

                console.log("Mevcut rezervasyonlar:", reservationsData);

                // Çalışma saatlerinden saat dilimlerini oluştur
                const startTime = parse(workingHour.start_time, "HH:mm:ss", new Date());
                const endTime = parse(workingHour.end_time, "HH:mm:ss", new Date());

                // Saatleri 1 saat aralıklarla oluştur
                const slots: TimeSlot[] = [];
                let currentTime = startTime;

                while (isBefore(currentTime, endTime) || isEqual(currentTime, endTime)) {
                    const slotStart = format(currentTime, "HH:mm");

                    // Bu saat dilimi için rezervasyon var mı kontrol et
                    const isReserved = reservationsData?.some(reservation => {
                        const reservationStart = reservation.start_time.substring(0, 5);
                        const reservationEnd = reservation.end_time.substring(0, 5);

                        // Eğer bu saat dilimi herhangi bir rezervasyonla çakışıyorsa
                        return slotStart >= reservationStart && slotStart < reservationEnd;
                    });

                    slots.push({
                        start: slotStart,
                        end: format(addMinutes(currentTime, 60), "HH:mm"), // Sabit 1 saat
                        available: !isReserved
                    });

                    // Bir sonraki saate geç
                    currentTime = addMinutes(currentTime, 60);
                }

                setTimeSlots(slots);
            } catch (error) {
                console.error("Rezervasyonlar getirilirken hata:", error);

                let errorMessage = "Rezervasyonlar yüklenirken bir hata oluştu.";

                if (error instanceof Error) {
                    errorMessage = error.message;
                }

                toast({
                    title: "Hata",
                    description: errorMessage,
                    variant: "destructive",
                });
            } finally {
                setIsLoadingTimeSlots(false);
            }
        };

        if (selectedDate && selectedArtist) {
            fetchTimeSlots();
        }
    }, [selectedDate, selectedArtist, supabase, toast]);

    // Müşterileri getiren fonksiyon - Customers tablosundan müşterileri çeker
    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);

        try {
            console.log("Müşterileri getirme işlemi başladı");

            // Customers tablosundan müşterileri getir
            const {data, error} = await supabase
                .from("customers")
                .select("*")
                .order("name");

            if (error) {
                console.error("Müşteriler getirilirken hata:", error);
                throw error;
            }

            console.log(`Toplam ${data?.length || 0} müşteri bulundu:`, data);

            // Müşterileri state'e ayarla - name alanını full_name olarak kullan
            const formattedCustomers = data?.map(customer => ({
                id: customer.id,
                email: customer.email,
                full_name: customer.name  // name alanını full_name olarak kullan
            })) || [];

            setCustomers(formattedCustomers);

            // Müşteri seçimini sıfırla
            form.setValue('customer_id', '');
        } catch (error) {
            console.error("Müşteriler getirilirken hata:", error);

            // Hata durumunda boş bir dizi ile devam et
            setCustomers([]);

            toast({
                title: "Uyarı",
                description: "Müşteri listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // Sanatçı seçildiğinde
    const handleArtistChange = (value: string) => {
        setSelectedArtist(value);
        form.setValue("artist_id", value);
    };

    // Tarih seçildiğinde
    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            form.setValue("date", date);
        }
    };

    // Fotoğraf yükleme fonksiyonu
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);

            // Önizleme URL'leri oluştur
            const newUrls = newFiles.map(file => URL.createObjectURL(file));
            setImageUrls(prev => [...prev, ...newUrls]);
        }
    };

    // Fotoğraf silme fonksiyonu
    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));

        // Önizleme URL'sini temizle
        URL.revokeObjectURL(imageUrls[index]);
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Fotoğrafları Supabase'e yükleme fonksiyonu
    const uploadImages = async (reservationId: string) => {
        if (images.length === 0) return [];

        setIsUploadingImages(true);
        const uploadedUrls: string[] = [];

        try {
            for (const image of images) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${reservationId}/${Date.now()}.${fileExt}`;
                const filePath = `reservation-images/${fileName}`;

                const {error: uploadError} = await supabase.storage
                    .from('reservations')
                    .upload(filePath, image);

                if (uploadError) throw uploadError;

                // Dosya URL'sini al
                const {data} = supabase.storage
                    .from('reservations')
                    .getPublicUrl(filePath);

                uploadedUrls.push(data.publicUrl);
            }

            return uploadedUrls;
        } catch (error) {
            console.error("Fotoğraflar yüklenirken hata:", error);
            throw error;
        } finally {
            setIsUploadingImages(false);
        }
    };

    // Müşteri ekleme fonksiyonu
    const handleAddCustomer = async () => {
        if (!newCustomer.email || !newCustomer.full_name) {
            toast({
                title: "Hata",
                description: "E-posta ve isim alanları zorunludur.",
                variant: "destructive",
            });
            return;
        }

        setIsAddingCustomer(true);

        try {
            // Customers tablosuna yeni müşteri ekle
            const {data, error} = await supabase
                .from("customers")
                .insert({
                    email: newCustomer.email,
                    name: newCustomer.full_name,  // full_name değerini name alanına kaydet
                    phone: newCustomer.phone || null
                })
                .select();

            if (error) {
                console.error("Müşteri eklenirken hata:", error);
                throw error;
            }

            console.log("Yeni müşteri eklendi:", data);

            toast({
                title: "Başarılı",
                description: "Yeni müşteri başarıyla eklendi.",
            });

            // Diyaloğu kapat
            setNewCustomerDialogOpen(false);

            // Formu temizle
            setNewCustomer({
                email: "",
                full_name: "",
                phone: ""
            });

            // Müşterileri yeniden yükle
            await fetchCustomers();

            // Yeni eklenen müşteriyi seç
            if (data && data.length > 0) {
                form.setValue("customer_id", data[0].id);
            }
        } catch (error) {
            console.error("Müşteri eklenirken hata:", error);

            toast({
                title: "Hata",
                description: "Müşteri eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsAddingCustomer(false);
        }
    };

    // Bileşen mount olduğunda kullanıcıları getir
    useEffect(() => {
        fetchCustomers();
    }, []);

    // Form gönderme - rezervasyon oluşturma fonksiyonu
    const onSubmit = async (data: ReservationFormValues) => {
        setIsLoading(true);
        console.log("Form verileri:", data); // Debug için

        try {
            // Zaman dilimini parçala
            const [startTime] = data.time_slot.split(" - ");

            // Süreyi dakika cinsinden al
            const durationMinutes = parseInt(data.duration);

            // Başlangıç ve bitiş saatlerini hesapla
            const startDateTime = parse(startTime, "HH:mm", new Date());
            const endDateTime = addMinutes(startDateTime, durationMinutes);
            const endTime = format(endDateTime, "HH:mm");

            // Tarihi formatlayarak hazırla
            const formattedDate = format(data.date, "yyyy-MM-dd");

            // Rezervasyon verilerini hazırla
            const reservationData = {
                customer_id: data.customer_id,
                artist_id: data.artist_id,
                staff_id: data.staff_id,
                service_type: data.service_type,
                date: formattedDate,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                duration: durationMinutes,
                notes: data.notes || "",
                status: "pending",
                price: Number(data.price) || 0,
                currency: data.currency || "EUR",
                deposit_amount: Number(data.deposit_amount) || 0,
                deposit_received: Boolean(data.deposit_received),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log("Oluşturulacak rezervasyon:", reservationData); // Debug için

            // Rezervasyonu oluştur
            const {data: newReservation, error: insertError} = await supabase
                .from("reservations")
                .insert(reservationData)
                .select()
                .single();

            if (insertError) {
                console.error("Rezervasyon oluşturma hatası:", insertError);
                throw new Error(`Rezervasyon oluşturulamadı: ${insertError.message}`);
            }

            if (!newReservation) {
                throw new Error("Rezervasyon oluşturuldu fakat veri dönmedi");
            }

            console.log("Oluşturulan rezervasyon:", newReservation);

            // Fotoğrafları yükle
            if (images.length > 0) {
                try {
                    const imageUrls = await uploadImages(newReservation.id);

                    if (imageUrls.length > 0) {
                        const {error: imageError} = await supabase
                            .from("reservation_images")
                            .insert(
                                imageUrls.map(url => ({
                                    reservation_id: newReservation.id,
                                    image_url: url,
                                    is_before: true,
                                    created_at: new Date().toISOString()
                                }))
                            );

                        if (imageError) {
                            console.error("Fotoğraflar kaydedilirken hata:", imageError);
                            // Fotoğraf hatası rezervasyon oluşturmayı engellemeyecek
                            toast({
                                title: "Uyarı",
                                description: "Rezervasyon oluşturuldu fakat fotoğraflar yüklenirken hata oluştu.",
                                variant: "destructive",
                            });
                        }
                    }
                } catch (imageUploadError) {
                    console.error("Fotoğraf yükleme hatası:", imageUploadError);
                    // Fotoğraf hatası rezervasyon oluşturmayı engellemeyecek
                    toast({
                        title: "Uyarı",
                        description: "Rezervasyon oluşturuldu fakat fotoğraflar yüklenemedi.",
                        variant: "destructive",
                    });
                }
            }

            toast({
                title: "Başarılı",
                description: "Rezervasyon başarıyla oluşturuldu.",
            });

            // Rezervasyonlar sayfasına yönlendir
            router.push("/reservations");
            router.refresh();
        } catch (error) {
            console.error("Rezervasyon oluşturulurken hata:", error);

            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : "Rezervasyon oluşturulurken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="customer_id"
                        render={({field}) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Müşteri</FormLabel>
                                <div className="flex space-x-2">
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Müşteri seçin"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isLoadingCustomers ? (
                                                <SelectItem value="loading" disabled>
                                                    Yükleniyor...
                                                </SelectItem>
                                            ) : customers.length > 0 ? (
                                                customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id}>
                                                        {customer.full_name || customer.email}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-customers" disabled>
                                                    Müşteri bulunamadı
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="px-3"
                                        onClick={() => setNewCustomerDialogOpen(true)}
                                    >
                                        <PlusCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="artist_id"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Sanatçı</FormLabel>
                                <Select onValueChange={handleArtistChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sanatçı seçin"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {artists.map((artist) => (
                                            <SelectItem key={artist.id} value={artist.id}>
                                                {artist.name} ({artist.type === "tattoo" ? "Dövme" : artist.type === "piercing" ? "Piercing" : "Her İkisi"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="staff_id"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Personel</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Personel seçin"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {staff.map((person) => (
                                            <SelectItem key={person.id} value={person.id}>
                                                {person.full_name} ({person.position === "admin" ? "Admin" :
                                                person.position === "designer" ? "Tasarımcı" :
                                                    person.position === "tattoo_artist" ? "Dövme Sanatçısı" :
                                                        person.position === "piercing_artist" ? "Piercing Sanatçısı" :
                                                            "Bilgi"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="service_type"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Hizmet Türü</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Hizmet türü seçin"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="tattoo">Dövme</SelectItem>
                                        <SelectItem value="piercing">Piercing</SelectItem>
                                        <SelectItem value="consultation">Danışma</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({field}) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", {locale: tr})
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={handleDateChange}
                                            disabled={(date) => {
                                                // Geçmiş tarihleri devre dışı bırak
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return date < today;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="time_slot"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Başlangıç Saati</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                        disabled={timeSlots.length === 0 || isLoadingTimeSlots}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                isLoadingTimeSlots
                                                    ? "Yükleniyor..."
                                                    : timeSlots.length === 0
                                                        ? "Önce tarih ve sanatçı seçin"
                                                        : "Saat seçin"
                                            }/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingTimeSlots ? (
                                            <SelectItem value="loading" disabled>
                                                Yükleniyor...
                                            </SelectItem>
                                        ) : timeSlots.length > 0 ? (
                                            timeSlots.map((slot, index) => (
                                                <SelectItem
                                                    key={index}
                                                    value={`${slot.start} - ${slot.end}`}
                                                    disabled={!slot.available}
                                                >
                                                    {slot.start} {!slot.available && "(Dolu)"}
                                                </SelectItem>
                                            ))
                                        ) : selectedDate && selectedArtist ? (
                                            <SelectItem value="no-slots" disabled>
                                                Bu tarihte uygun saat bulunmuyor
                                            </SelectItem>
                                        ) : (
                                            <SelectItem value="no-date-artist" disabled>
                                                Önce tarih ve sanatçı seçin
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Seçilen süre kadar randevu oluşturulacaktır.
                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="duration"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Süre</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Süre seçin"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="30">30 dakika</SelectItem>
                                        <SelectItem value="60">1 saat</SelectItem>
                                        <SelectItem value="90">1.5 saat</SelectItem>
                                        <SelectItem value="120">2 saat</SelectItem>
                                        <SelectItem value="180">3 saat</SelectItem>
                                        <SelectItem value="240">4 saat</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Notlar</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Rezervasyon hakkında eklemek istediğiniz notlar"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Sanatçıya iletmek istediğiniz özel notlar (opsiyonel).
                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div>
                            <FormLabel>Referans Fotoğrafları</FormLabel>
                            <div className="mt-2">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {imageUrls.map((url, index) => (
                                        <div key={index}
                                             className="relative w-24 h-24 rounded-md overflow-hidden border">
                                            <Image
                                                src={url}
                                                alt={`Referans ${index + 1}`}
                                                width={96}
                                                height={96}
                                                className="object-cover"
                                                onError={(e) => {
                                                    console.error('Image load error:', e);
                                                    e.currentTarget.src = '/placeholder.jpg';
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => handleRemoveImage(index)}
                                            >
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center">
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <div
                                            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                                            <ImagePlus className="h-5 w-5"/>
                                            <span>Fotoğraf Ekle</span>
                                        </div>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>
                            </div>
                            <FormDescription>
                                Referans olarak kullanılacak fotoğrafları ekleyin (opsiyonel).
                            </FormDescription>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>İşlem Ücreti</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value === 0 ? '' : field.value}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    if (!isNaN(value)) {
                                                        field.onChange(value);
                                                    }
                                                }}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({field}) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue placeholder="Para Birimi"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="EUR">EUR</SelectItem>
                                                            <SelectItem value="USD">USD</SelectItem>
                                                            <SelectItem value="TRY">TRY</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="deposit_amount"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Ön Ödeme Tutarı</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value === 0 ? '' : field.value}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                if (!isNaN(value)) {
                                                    field.onChange(value);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deposit_received"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        Ön Ödeme Alındı
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/reservations")}
                            disabled={isLoading}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : "Rezervasyon Oluştur"}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Yeni müşteri ekleme diyaloğu */}
            <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
                        <DialogDescription>
                            Yeni müşteri bilgilerini girin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                E-posta*
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="full_name" className="text-right">
                                Ad Soyad*
                            </Label>
                            <Input
                                id="full_name"
                                value={newCustomer.full_name}
                                onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Telefon
                            </Label>
                            <Input
                                id="phone"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNewCustomerDialogOpen(false)}
                            disabled={isAddingCustomer}
                        >
                            İptal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAddCustomer}
                            disabled={isAddingCustomer}
                        >
                            {isAddingCustomer ? "Ekleniyor..." : "Ekle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Form>
    );
} 