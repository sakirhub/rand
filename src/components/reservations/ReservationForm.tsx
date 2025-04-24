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

type FormData = {
    time: string;
    date: Date;
    service_type: string;
    price: number;
    currency: "EUR" | "USD" | "TRY";
    deposit_amount: number;
    deposit_received: boolean;
    notes?: string;
    customer_id: string;
    artist_id: string;
    staff_id?: string;
    images?: File[];
    duration: number;
    hotel_info?: string;
    room_info?: string;
    service_area?: string;
};

const formSchema = z.object({
    customer_id: z.string().min(1, "Müşteri seçimi zorunludur"),
    artist_id: z.string().min(1, "Sanatçı seçimi zorunludur"),
    date: z.date({
        required_error: "Tarih seçimi zorunludur",
    }),
    time: z.string().min(1, "Saat seçimi zorunludur"),
    service_type: z.string().min(1, "Hizmet türü seçimi zorunludur"),
    price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
    deposit_amount: z.number().min(0, "Depozito tutarı 0'dan küçük olamaz"),
    notes: z.string().optional(),
    hotel_info: z.string().optional(),
    room_info: z.string().optional(),
    service_area: z.string().optional(),
    currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
    deposit_received: z.boolean().default(false),
    images: z.array(z.instanceof(File)).optional(),
    duration: z.number().default(60),
});

type ReservationFormValues = z.infer<typeof formSchema>;

// Varsayılan değerler
const defaultValues: Partial<FormData> = {
    time: "",
    date: new Date(),
    service_type: "",
    price: 0,
    currency: "TRY",
    deposit_amount: 0,
    deposit_received: false,
    notes: "",
    customer_id: "",
    artist_id: "",
    staff_id: "",
    images: [],
    duration: 60,
    hotel_info: "",
    room_info: "",
    service_area: "",
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
    name: string;
    phone?: string;
}

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
];

export function ReservationForm() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {toast} = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [timeSlots, setTimeSlots] = useState<string[]>([
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30", "19:00", "19:30", "20:00"
    ]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isLoadingArtists, setIsLoadingArtists] = useState(false);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        email: "",
        full_name: "",
        phone: ""
    });
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

    // Form tanımlaması
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    // Form değerlerini izle
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "currency") {
                console.log("Currency changed to:", value.currency);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

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
            if (!selectedDate || !selectedArtist) return;

            try {
                // Sanatçının çalışma saatlerini kontrol et
                const {data, error} = await supabase
                    .from("artist_working_hours")
                    .select("*")
                    .eq("artist_id", selectedArtist)
                    .eq("day_of_week", selectedDate.getDay())
                    .eq("is_available", true);

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
    }, [selectedDate, selectedArtist, supabase]);

    // Sanatçı değiştiğinde veya tarih seçildiğinde uygun zaman dilimlerini getir
    useEffect(() => {
        const loadTimeSlots = async (selectedDate: Date) => {
            try {
                setIsLoadingTimeSlots(true);
                
                // Çalışma saatleri (09:00 - 20:00)
                const startHour = 9;
                const endHour = 20;
                const interval = 30; // 30 dakikalık aralıklar

                // Saatleri oluştur
                const slots: string[] = [];
                for (let hour = startHour; hour < endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += interval) {
                        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        slots.push(time);
                    }
                }

                setTimeSlots(slots);
            } catch (error) {
                console.error("Error loading time slots:", error);
                toast({
                    title: "Hata",
                    description: "Saatler yüklenirken bir hata oluştu",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingTimeSlots(false);
            }
        };

        if (selectedDate) {
            loadTimeSlots(selectedDate);
        }
    }, [selectedDate, toast]);

    // Müşterileri getiren fonksiyon - Customers tablosundan müşterileri çeker
    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);

        try {
            console.log("Müşterileri getirme işlemi başladı");

            // Customers tablosundan müşterileri getir
            const {data, error} = await supabase
                .from("customers")
                .select("id, name, email")
                .order("name");

            if (error) {
                console.error("Müşteriler getirilirken hata:", error);
                throw error;
            }

            console.log(`Toplam ${data?.length || 0} müşteri bulundu:`, data);

            // Müşterileri state'e ayarla
            const formattedCustomers = data?.map(customer => ({
                id: customer.id,
                email: customer.email,
                name: customer.name
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
        form.setValue("artist_id", value);
        setSelectedArtist(value);
    };

    // Tarih seçildiğinde
    const handleDateChange = (value: Date | undefined) => {
        if (value) {
            setSelectedDate(value);
            form.setValue("date", value);
        }
    };

    // Fotoğraf yükleme fonksiyonu
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            const updatedImages = [...(images || []), ...newImages];
            setImages(updatedImages);
            form.setValue("images", updatedImages);
        }
    };

    // Fotoğraf silme fonksiyonu
    const handleRemoveImage = (index: number) => {
        if (images) {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            form.setValue("images", newImages);
        }
    };

    // Fotoğrafları Supabase'e yükleme fonksiyonu
    const uploadImages = async (reservationId: string) => {
        if (!images || images.length === 0) return;
        
        for (const image of images) {
            const fileName = `${reservationId}/${image.name}`;
            const { error: uploadError } = await supabase.storage
                .from("reservation-images")
                .upload(fileName, image);

            if (uploadError) {
                console.error("Görsel yüklenirken hata:", uploadError);
                throw uploadError;
            }
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

    // Mevcut kullanıcıyı al
    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                setCurrentUser(user);
            } catch (error) {
                console.error('Kullanıcı bilgileri alınırken hata:', error);
                toast({
                    title: "Hata",
                    description: "Kullanıcı bilgileri alınamadı.",
                    variant: "destructive",
                });
            }
        };
        getUser();
    }, [supabase, toast]);

    // Form gönderme - rezervasyon oluşturma fonksiyonu
    const handleSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            setError(null);

            // Son rezervasyon numarasını al
            const {data: lastReservation} = await supabase
                .from('reservations')
                .select('reservation_no')
                .order('reservation_no', {ascending: false})
                .limit(1)
                .single();

            // Yeni rezervasyon numarası oluştur (6 haneli)
            const lastResNo = lastReservation?.reservation_no ? parseInt(lastReservation.reservation_no) : 0;
            const newResNo = (lastResNo + 1).toString().padStart(6, '0');

            // Seçilen zamanı Date nesnesine çevir
            const selectedTime = parse(data.time, "HH:mm", new Date());
            const startTime = selectedTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
            const endTime = addMinutes(selectedTime, data.duration * 60).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});

            // Rezervasyon verilerini hazırla
            const reservationData = {
                customer_id: data.customer_id,
                artist_id: data.artist_id,
                service_type: data.service_type,
                date: data.date,
                start_time: startTime,
                end_time: endTime,
                price: Number(data.price),
                deposit_amount: Number(data.deposit_amount) || 0,
                remaining_amount: Number(data.price) - (Number(data.deposit_amount) || 0),
                status: "pending",
                duration: data.duration,
                notes: data.notes,
                currency: data.currency,
                reservation_no: newResNo,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                hotel_info: data.hotel_info,
                room_info: data.room_info,
                service_area: data.service_area,
            };

            // Rezervasyonu oluştur
            const {error: insertError} = await supabase
                .from('reservations')
                .insert([reservationData]);

            if (insertError) throw insertError;

            toast({
                title: "Başarılı",
                description: "Rezervasyon başarıyla oluşturuldu",
            });
            router.push('/reservations');
        } catch (err) {
            console.error('Rezervasyon oluşturulurken hata:', err);
            setError('Rezervasyon oluşturulurken bir hata oluştu');
            toast({
                title: "Hata",
                description: "Rezervasyon oluşturulurken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                                                        {customer.name}
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
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Saat</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Saat seçin" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {timeSlots.map((slot) => (
                                            <SelectItem key={slot} value={slot}>
                                                {slot}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                        placeholder="Rezervasyon ile ilgili notlar..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Rezervasyon ile ilgili özel notlarınızı buraya ekleyebilirsiniz.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="hotel_info"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Otel Bilgisi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Otel adı..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Müşterinin kaldığı otel bilgisi
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="room_info"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Oda Bilgisi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Oda numarası..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Müşterinin oda numarası
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="service_area"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Servis Alanı</FormLabel>
                                <FormControl>
                                    <Input placeholder="Servis alanı..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Dövme/piercing yapılacak bölge
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div>
                            <FormLabel>Referans Fotoğrafları</FormLabel>
                            <div className="mt-2">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {images.map((image, index) => (
                                        <div key={index}
                                             className="relative w-24 h-24 rounded-md overflow-hidden border">
                                            <Image
                                                src={URL.createObjectURL(image)}
                                                alt={`Referans ${index + 1}`}
                                                width={96}
                                                height={96}
                                                className="object-cover"
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
                                            onChange={handleImageChange}
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
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    field.onChange(value);
                                                }}
                                                value={field.value === 0 ? '' : field.value}
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
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Para Birimi</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Para birimi seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
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
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                field.onChange(value);
                                            }}
                                            value={field.value === 0 ? '' : field.value}
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