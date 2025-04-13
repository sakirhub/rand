"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {format} from "date-fns";
import {tr} from "date-fns/locale";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/use-toast";
import {ImagePlus, X} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import Image from "next/image";

type Artist = {
    id: string;
    name: string;
    email: string;
    phone: string;
};

type Staff = {
    id: string;
    full_name: string;
    position: string;
    email: string;
    phone: string;
};

// Rezervasyon düzenleme formu için şema
const editReservationFormSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"], {
        required_error: "Lütfen durum seçin.",
    }),
    notes: z.string().optional(),
    price: z.number().min(0, "Fiyat 0'dan küçük olamaz"),
    currency: z.enum(["EUR", "USD", "TRY"], {
        required_error: "Para birimi seçiniz",
    }),
    deposit_amount: z.number().min(0, "Ön ödeme tutarı 0'dan küçük olamaz").optional(),
    deposit_received: z.boolean().default(false),
    staff_id: z.string().optional(),
});

type EditReservationFormValues = z.infer<typeof editReservationFormSchema>;

interface EditReservationFormProps {
    reservation: any;
    userRole: string | null;
    onSubmit: (data: EditReservationFormValues) => Promise<void>;
}

export function EditReservationForm({
    reservation,
    userRole,
    onSubmit
}: EditReservationFormProps) {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {toast} = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Fotoğraflar için state
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isBeforeImages, setIsBeforeImages] = useState(true); // true: öncesi, false: sonrası

    // Mevcut fotoğraflar için state
    const [existingImages, setExistingImages] = useState<any[]>(
        reservation.reservation_images || []
    );

    // Sanatçıları getir
    const [artists, setArtists] = useState<Artist[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    // Form başlangıç değerleri
    const defaultValues: Partial<EditReservationFormValues> = {
        status: reservation.status || "pending",
        notes: reservation.notes || "",
        price: Number(reservation.price) || 0,
        currency: reservation.currency || "EUR",
        deposit_amount: Number(reservation.deposit_amount) || 0,
        deposit_received: Boolean(reservation.deposit_received) || false,
        staff_id: reservation.staff_id || "",
    };

    // Form tanımı
    const form = useForm<EditReservationFormValues>({
        resolver: zodResolver(editReservationFormSchema),
        defaultValues,
    });

    // Fotoğraf önizleme
    useEffect(() => {
        if (images.length > 0) {
            const newImageUrls = images.map(image => URL.createObjectURL(image));
            setImageUrls(newImageUrls);

            // Temizleme fonksiyonu
            return () => {
                newImageUrls.forEach(url => URL.revokeObjectURL(url));
            };
        }
    }, [images]);

    // Fotoğraf seçme işlemi
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...selectedFiles]);
        }
    };

    // Fotoğraf kaldırma işlemi
    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Mevcut fotoğrafı silme işlemi
    const handleRemoveExistingImage = async (imageId: string) => {
        try {
            const {error} = await supabase
                .from("reservation_images")
                .delete()
                .eq("id", imageId);

            if (error) {
                throw error;
            }

            setExistingImages(prev => prev.filter(img => img.id !== imageId));

            toast({
                title: "Fotoğraf silindi",
                description: "Fotoğraf başarıyla silindi.",
            });
        } catch (error) {
            console.error("Fotoğraf silinirken hata:", error);

            toast({
                title: "Hata",
                description: "Fotoğraf silinirken bir hata oluştu.",
                variant: "destructive",
            });
        }
    };

    // Fotoğraf yükleme fonksiyonu
    const uploadImages = async (images: File[], isBeforeImages: boolean) => {
        if (images.length === 0) return [];

        setIsUploading(true);
        const uploadedImageUrls = [];

        try {
            // Fotoğrafları yükle
            for (const image of images) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

                const {data, error} = await supabase.storage
                    .from("reservation_images")
                    .upload(fileName, image, {
                        upsert: true,
                        cacheControl: "3600"
                    });

                if (error) {
                    console.error("Fotoğraf yükleme hatası:", error);
                    continue;
                }

                // Yüklenen fotoğrafın URL'sini al
                const {data: {publicUrl}} = supabase.storage
                    .from("reservation_images")
                    .getPublicUrl(fileName);

                // Veritabanına kaydet
                const {error: insertError} = await supabase
                    .from("reservation_images")
                    .insert({
                        reservation_id: reservation.id,
                        image_url: publicUrl,
                        is_before: isBeforeImages
                    });

                if (insertError) {
                    console.error("Fotoğraf veritabanına kaydedilirken hata:", insertError);
                    continue;
                }

                uploadedImageUrls.push({
                    image_url: publicUrl,
                    is_before: isBeforeImages
                });
            }

            return uploadedImageUrls;
        } catch (error) {
            console.error("Fotoğraflar yüklenirken hata:", error);
            toast({
                title: "Hata",
                description: "Fotoğraflar yüklenirken bir hata oluştu.",
                variant: "destructive",
            });
            return [];
        } finally {
            setIsUploading(false);
        }
    };

    // Sanatçıları getir
    useEffect(() => {
        const fetchArtists = async () => {
            const {data, error} = await supabase
                .from("artists")
                .select("id, name, email, phone")
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

    // Personelleri yükle
    const loadStaff = async () => {
        setIsLoadingStaff(true);
        try {
            const {data, error} = await supabase
                .from("staff")
                .select("id, full_name, position, email, phone")
                .eq("is_active", true)
                .order("full_name");

            if (error) throw error;

            setStaff(data || []);
        } catch (error) {
            console.error("Personeller yüklenirken hata:", error);
            toast({
                title: "Hata",
                description: "Personeller yüklenirken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingStaff(false);
        }
    };

    // Form yüklendiğinde personel verilerini yükle
    useEffect(() => {
        loadStaff();
    }, []);

    const handleSubmit = async (data: EditReservationFormValues) => {
        setIsLoading(true);
        try {
            // Fotoğrafları yükle
            if (images.length > 0) {
                await uploadImages(images, isBeforeImages);
            }

            // Form verilerini gönder
            await onSubmit(data);

            toast({
                title: "Başarılı",
                description: "Rezervasyon başarıyla güncellendi.",
            });

            router.refresh();
        } catch (error) {
            console.error("Rezervasyon güncellenirken hata:", error);
            toast({
                title: "Hata",
                description: "Rezervasyon güncellenirken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Rezervasyon tarihi ve saati
    const reservationDate = format(new Date(reservation.date), "d MMMM yyyy", {locale: tr});
    const startTime = reservation.start_time ? reservation.start_time.substring(0, 5) : "";
    const endTime = reservation.end_time ? reservation.end_time.substring(0, 5) : "";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rezervasyon Bilgileri</CardTitle>
                            <CardDescription>
                                Bu bilgiler salt okunurdur, değiştirilemez.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Müşteri</Label>
                                    <div className="p-2 border rounded-md bg-muted/50">
                                        {reservation.customers?.name || "Belirtilmemiş"}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Hizmet Türü</Label>
                                    <div className="p-2 border rounded-md bg-muted/50 capitalize">
                                        {reservation.service_type === "tattoo" ? "Dövme" :
                                            reservation.service_type === "piercing" ? "Piercing" :
                                                reservation.service_type === "consultation" ? "Konsültasyon" :
                                                    reservation.service_type}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tarih</Label>
                                    <div className="p-2 border rounded-md bg-muted/50">
                                        {reservationDate}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Saat</Label>
                                    <div className="p-2 border rounded-md bg-muted/50">
                                        {startTime} - {endTime} ({reservation.duration} dakika)
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Sanatçı</Label>
                                    <div className="p-2 border rounded-md bg-muted/50">
                                        {reservation.artists?.name || "Belirtilmemiş"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Düzenlenebilir Bilgiler</CardTitle>
                            <CardDescription>
                                Bu bilgileri güncelleyebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userRole === "admin" && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Durum</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Durum seçin"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">Beklemede</SelectItem>
                                                    <SelectItem value="confirmed">Onaylandı</SelectItem>
                                                    <SelectItem value="completed">Tamamlandı</SelectItem>
                                                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Notlar</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Rezervasyon ile ilgili notlar..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
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
                                            value={field.value || ''}
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
                                        value={field.value || ''}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="staff_id"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Personel</FormLabel>
                                <Select
                                    disabled={isLoadingStaff}
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Personel seçin"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingStaff ? (
                                            <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                                        ) : staff.length > 0 ? (
                                            staff.map(person => (
                                                <SelectItem key={person.id} value={person.id}>
                                                    {person.full_name} ({person.position === "admin" ? "Admin" :
                                                    person.position === "designer" ? "Tasarımcı" :
                                                        person.position === "tattoo_artist" ? "Dövme Sanatçısı" :
                                                            person.position === "piercing_artist" ? "Piercing Sanatçısı" :
                                                                "Bilgi"})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-staff" disabled>Personel bulunamadı</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Fotoğraflar</CardTitle>
                        <CardDescription>
                            Rezervasyon için fotoğraflar ekleyin veya düzenleyin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="before">
                            <TabsList className="mb-4">
                                <TabsTrigger value="before" onClick={() => setIsBeforeImages(true)}>
                                    Öncesi
                                </TabsTrigger>
                                <TabsTrigger value="after" onClick={() => setIsBeforeImages(false)}>
                                    Sonrası
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="before" className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Mevcut öncesi fotoğrafları */}
                                    {existingImages
                                        .filter(img => img.is_before)
                                        .map(image => (
                                            <div key={image.id}
                                                 className="relative aspect-square rounded-md overflow-hidden border group">
                                                <Image
                                                    src={image.image_url}
                                                    alt="Öncesi fotoğrafı"
                                                    width={128}
                                                    height={128}
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        console.error('Image load error:', e);
                                                        e.currentTarget.src = '/placeholder.jpg';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(image.id)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        ))}

                                    {/* Yeni öncesi fotoğrafları (önizleme) */}
                                    {isBeforeImages && imageUrls.map((url, index) => (
                                        <div key={index}
                                             className="relative aspect-square rounded-md overflow-hidden border group">
                                            <Image
                                                src={url}
                                                alt={`Yeni fotoğraf ${index + 1}`}
                                                width={128}
                                                height={128}
                                                className="object-cover"
                                                onError={(e) => {
                                                    console.error('Image load error:', e);
                                                    e.currentTarget.src = '/placeholder.jpg';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Fotoğraf yükleme butonu */}
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="before-image-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImagePlus className="w-8 h-8 mb-2 text-gray-500"/>
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span
                                                    className="font-semibold">Öncesi fotoğrafı eklemek için tıklayın</span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG veya JPEG (Max. 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="before-image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </TabsContent>

                            <TabsContent value="after" className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Mevcut sonrası fotoğrafları */}
                                    {existingImages
                                        .filter(img => !img.is_before)
                                        .map(image => (
                                            <div key={image.id}
                                                 className="relative aspect-square rounded-md overflow-hidden border group">
                                                <Image
                                                    src={image.image_url}
                                                    alt="Sonrası fotoğrafı"
                                                    width={128}
                                                    height={128}
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        console.error('Image load error:', e);
                                                        e.currentTarget.src = '/placeholder.jpg';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(image.id)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        ))}

                                    {/* Yeni sonrası fotoğrafları (önizleme) */}
                                    {!isBeforeImages && imageUrls.map((url, index) => (
                                        <div key={index}
                                             className="relative aspect-square rounded-md overflow-hidden border group">
                                            <Image
                                                src={url}
                                                alt={`Yeni fotoğraf ${index + 1}`}
                                                width={128}
                                                height={128}
                                                className="object-cover"
                                                onError={(e) => {
                                                    console.error('Image load error:', e);
                                                    e.currentTarget.src = '/placeholder.jpg';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Fotoğraf yükleme butonu */}
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="after-image-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImagePlus className="w-8 h-8 mb-2 text-gray-500"/>
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span
                                                    className="font-semibold">Sonrası fotoğrafı eklemek için tıklayın</span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG veya JPEG (Max. 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="after-image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/reservations/${reservation.id}`)}
                        disabled={isLoading || isUploading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || isUploading}
                    >
                        {isLoading || isUploading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 