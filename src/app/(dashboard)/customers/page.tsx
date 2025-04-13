// Müşteri ekleme fonksiyonu
const handleAddCustomer = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const fullName = formData.get('full_name') as string;
    const phone = formData.get('phone') as string;

    console.log("Eklenecek müşteri bilgileri:", {email, fullName, phone});

    if (!email || !fullName) {
        toast({
            title: "Hata",
            description: "E-posta ve isim alanları zorunludur.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);

    try {
        // Önce tablo şemasını kontrol et
        console.log("Tablo şeması kontrol ediliyor...");
        const {data: columns, error: schemaError} = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'customers');

        if (schemaError) {
            console.error("Şema kontrol hatası:", schemaError);
        } else {
            console.log("Customers tablosu sütunları:", columns);
        }

        // Yeni müşteri verisi
        const customerData = {
            email: email,
            name: fullName,
            phone: phone || null
        };

        console.log("Eklenecek veri:", customerData);

        // Yeni müşteri oluştur - daha basit bir yaklaşım deneyelim
        try {
            const {data, error} = await supabase
                .from("customers")
                .insert([customerData]) // Array içinde gönder
                .select();

            if (error) {
                console.error("Müşteri ekleme hatası:", error);

                // Hata detaylarını göster
                let errorMessage = "Müşteri eklenirken bir hata oluştu.";
                if (error.message) {
                    errorMessage += ` Hata: ${error.message}`;
                }
                if (error.details) {
                    errorMessage += ` Detaylar: ${error.details}`;
                }
                if (error.hint) {
                    errorMessage += ` İpucu: ${error.hint}`;
                }

                toast({
                    title: "Hata",
                    description: errorMessage,
                    variant: "destructive",
                });

                return;
            }

            console.log("Müşteri başarıyla eklendi:", data);

            // Müşterileri yeniden yükle
            fetchCustomers();

            toast({
                title: "Başarılı",
                description: "Yeni müşteri başarıyla eklendi."
            });

            // Form alanlarını temizle
            resetForm();
        } catch (insertError) {
            console.error("Müşteri ekleme işlemi sırasında beklenmeyen hata:", insertError);

            toast({
                title: "Hata",
                description: "Müşteri eklenirken beklenmeyen bir hata oluştu.",
                variant: "destructive",
            });
        }
    } catch (error) {
        console.error("Genel hata:", error);

        toast({
            title: "Hata",
            description: "İşlem sırasında bir hata oluştu.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
};

// Müşterileri getiren fonksiyon
const fetchCustomers = async () => {
    setIsLoading(true);

    try {
        // Customers tablosundan müşterileri getir
        const {data, error} = await supabase
            .from("customers")
            .select("*")
            .order("name");

        if (error) {
            console.error("Müşteriler getirilirken hata:", error);
            throw error;
        }

        // Müşterileri state'e ayarla - name alanını full_name olarak kullan
        const formattedCustomers = data?.map(customer => ({
            id: customer.id,
            email: customer.email,
            full_name: customer.name,  // name alanını full_name olarak kullan
            phone: customer.phone
        })) || [];

        setCustomers(formattedCustomers);
    } catch (error) {
        console.error("Müşteriler getirilirken hata:", error);

        toast({
            title: "Hata",
            description: "Müşteriler yüklenirken bir hata oluştu.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
}; 