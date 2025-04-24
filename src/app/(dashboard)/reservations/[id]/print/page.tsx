"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface PrintPageProps {
  params: {
    id: string;
  };
}

// Hazır metinler
const disclaimerTexts = {
  tr: {
    title: "Bilgilendirme ve Onay Metni",
    content: `1- Eseri Yaptıran, deri ve dermatit enfeksiyonları, diyabet, ateş ve ağır somatik hastalıkları, akne ve deri döküntüleri rahatsızlığı, hemofli,
alerjik reaksiyonları, epilepsi, sedef hastalığı, hemofli, kalp rahatsızlıkları gibi rahatsızlıklar olmak üzere dövme/piercing yapılmasına
engel teşkil edecek bir rahatsızlığının olmadığını; son bir yıl içerisinde geçirilmiş sarılık hastalığı olmadığını, eser yapıldığı esnada alkol
ve uyuşturucu etkisinde olmadığını; hamile veya emzirme döneminde olmadığını kabul ve beyan eder. Eseri yaptıran, işbu madde
kapsamında gerçeğe aykırı beyan vermesi sebebiyle sağlığı üzerinde oluşacak yan etkilerden eseri yapan kişi ve/veya Merkez'in sorumlu
olmayacağını sorumluluğun kendisine ait olacağını kabul ve taahhüt eder.

2- Eseri Yaptıran, işbu fiş ile, taraflar arasında eserin yapımı için belirlenen tarihteki randevusunu tamamen iptal etmesi veya randevu
saatinde habersiz olarak stüdyoya gelmemesi halinde Merkez'e ödemiş olduğu depozito tutarının tarafına iade edilmeyeceğini, bu bedeli
hiçbir şekilde eseri yapacak olan Merkez'den talep etmeyeceğini kabul ve taahhüt eder.

3- Eseri Yaptıran, eserin yapımı esnasında kendisinin ve meydana gelen eserin fotoğraf, ses veya video kaydı görüntümün alınabileceğini; bu fotoğraf/ses/video kayıtlarının Merkez markasına ait tüm sosyal medya hesaplarında, web sitesinde ve YouTube kanalında
kullanılabileceğini; bu suretle sınırlı olarak ve editoryal olarak işlenebileceğini, çoğaltılabileceğini, yayınlanabileceğini ve dağıtılabileceğini;
tüm bu mecra ve araçların Merkez tarafından serbestçe belirlenebileceğini; bu onay metni ile fotoğraf/ses/ video kayıtlar başta olmak
üzere paylaşmış olduğum tüm kişisel verilerin yukarıda belirtilen şekillerde kullanımına açık rıza ile izin vererek 6698 sayılı Kişisel
verilerin Korunması Kanunu ve sair mevzuat çerçevesinde Merkez'e karşı herhangi bir hak talebinde bulunmayacağımı kabul, beyan ve
taahhüt eder. Eseri yaptıran, Merkez'in kişisel verilerin işlenmesi ile ilgili uygulamaları ve 6698 Sayılı Kişisel Verilerin Korunması Kanunu
kapsamında "Veri Sorumlusu" sıfatıyla işlediği kişisel verilere ilişkin, Phoenix Tattoo Piercing web sayfasında yer alan detaylı aydınlatma metnini
okuduğunu, anladığını ve onayladığını kabul ve beyan eder.

Eseri Yaptıran, yukarıda yer alan açıklamaları, tek tek okuduğunu, anladığını, onayladığını kabul ve beyan eder.

İşbu fiş tarafların iradeleri dahilinde, bir nüshası Merkez'de diğeri ise eseri yaptırana verilmek üzere 2 (iki) nüsha olarak düzenlenmiştir.`
  },
  en: {
    title: "Information and Consent Form",
    content: `1- The Client declares and confirms that they do not have any conditions that would prevent them from getting a tattoo/piercing, including but not limited to skin and dermatitis infections, diabetes, fever and severe somatic diseases, acne and skin rashes, hemophilia, allergic reactions, epilepsy, psoriasis, hemophilia, heart conditions; that they have not had hepatitis in the last year; that they are not under the influence of alcohol or drugs during the procedure; and that they are not pregnant or breastfeeding. The Client accepts and undertakes that the artist and/or the Center will not be responsible for any side effects that may occur on their health due to false declarations under this article, and that the responsibility belongs to them.

2- The Client accepts and undertakes that if they completely cancel their appointment on the date determined for the creation of the work or fail to show up at the studio without notice at the appointment time, the deposit amount they have paid to the Center will not be refunded, and they will not claim this amount from the Center in any way.

3- The Client accepts, declares, and undertakes that during the creation of the work, photographs, audio or video recordings of themselves and the resulting work may be taken; that these photographs/audio/video recordings may be used on all social media accounts, website, and YouTube channel of the Center brand; that they may be processed, reproduced, published, and distributed in a limited and editorial manner; that all these media and tools may be freely determined by the Center; and that by this consent form, they give explicit consent to the use of all their personal data, especially photographs/audio/video recordings, in the ways specified above, and that they will not make any claims against the Center within the framework of the Personal Data Protection Law No. 6698 and other legislation. The Client accepts and declares that they have read, understood, and approved the detailed information text on the Phoenix Tattoo Piercing website regarding the Center's practices on the processing of personal data and the personal data processed by the Center as a "Data Controller" within the scope of the Personal Data Protection Law No. 6698.

The Client accepts and declares that they have read, understood, and approved each of the above statements.

This form has been prepared in two (2) copies, one to be kept at the Center and the other to be given to the Client, in accordance with the will of the parties.`
  },
  de: {
    title: "Informations- und Einverständniserklärung",
    content: `1- Der Kunde erklärt und bestätigt, dass er keine Erkrankungen hat, die einer Tätowierung/Piercing entgegenstehen, einschließlich, aber nicht beschränkt auf Haut- und Dermatitis-Infektionen, Diabetes, Fieber und schwere somatische Erkrankungen, Akne und Hautausschläge, Hämophilie, allergische Reaktionen, Epilepsie, Psoriasis, Hämophilie, Herzerkrankungen; dass er im letzten Jahr keine Hepatitis hatte; dass er während des Eingriffs nicht unter dem Einfluss von Alkohol oder Drogen steht; und dass er nicht schwanger ist oder stillt. Der Kunde akzeptiert und verpflichtet sich, dass der Künstler und/oder das Center nicht für Nebenwirkungen verantwortlich sind, die aufgrund falscher Angaben unter diesem Artikel auf seine Gesundheit auftreten können, und dass die Verantwortung bei ihm liegt.

2- Der Kunde akzeptiert und verpflichtet sich, dass, wenn er seinen Termin am für die Erstellung der Arbeit bestimmten Datum vollständig absagt oder ohne Ankündigung zum vereinbarten Termin nicht im Studio erscheint, die von ihm an das Center gezahlte Anzahlung nicht erstattet wird und er diesen Betrag in keiner Weise vom Center zurückfordern wird.

3- Der Kunde akzeptiert, erklärt und verpflichtet sich, dass während der Erstellung der Arbeit Fotos, Audio- oder Videoaufnahmen von ihm und dem entstehenden Werk gemacht werden können; dass diese Fotos/Audio/Videoaufnahmen auf allen Social-Media-Konten, der Website und dem YouTube-Kanal der Center-Marke verwendet werden können; dass sie in begrenztem und redaktionellem Rahmen verarbeitet, vervielfältigt, veröffentlicht und verteilt werden können; dass alle diese Medien und Werkzeuge frei vom Center bestimmt werden können; und dass er durch dieses Einverständnisformular ausdrücklich der Verwendung aller seiner personenbezogenen Daten, insbesondere Fotos/Audio/Videoaufnahmen, in den oben genannten Weisen zustimmt und keine Ansprüche gegen das Center im Rahmen des Datenschutzgesetzes Nr. 6698 und anderer Gesetzgebung erheben wird. Der Kunde akzeptiert und erklärt, dass er den detaillierten Informationstext auf der Phoenix Tattoo Piercing-Website bezüglich der Praktiken des Centers zur Verarbeitung personenbezogener Daten und der vom Center als "Verantwortlicher" im Rahmen des Datenschutzgesetzes Nr. 6698 verarbeiteten personenbezogenen Daten gelesen, verstanden und genehmigt hat.

Der Kunde akzeptiert und erklärt, dass er jede der oben genannten Aussagen gelesen, verstanden und genehmigt hat.

Dieses Formular wurde in zwei (2) Exemplaren erstellt, eines wird im Center aufbewahrt und das andere wird dem Kunden ausgehändigt, gemäß dem Willen der Parteien.`
  }
};

const nationalityToLanguage = {
  'tr': 'tr',
  'türkiye': 'tr',
  'turkey': 'tr',
  'en': 'en',
  'us': 'en',
  'usa': 'en',
  'united states': 'en',
  'america': 'en',
  'american': 'en',
  'gb': 'en',
  'uk': 'en',
  'united kingdom': 'en',
  'de': 'de',
  'germany': 'de',
  'german': 'de',
  'deutschland': 'de',
  'nl': 'nl',
  'netherlands': 'nl',
  'holland': 'nl',
  'dutch': 'nl',
  'fr': 'fr',
  'france': 'fr',
  'french': 'fr',
  'es': 'es',
  'spain': 'es',
  'spanish': 'es',
  'it': 'it',
  'italy': 'it',
  'italian': 'it',
  'ru': 'ru',
  'russia': 'ru',
  'russian': 'ru',
  'ae': 'ar',
  'uae': 'ar',
  'united arab emirates': 'ar',
  'arabic': 'ar'
};

const sectionTitles = {
  tr: {
    customerInfo: "Müşteri Bilgileri",
    fullName: "Ad Soyad",
    phone: "Telefon",
    email: "E-posta",
    nationality: "Uyruk",
    appointmentDetails: "Randevu Detayları",
    date: "Tarih",
    time: "Saat",
    paymentDetails: "Ödeme Detayları",
    totalPrice: "Toplam Fiyat",
    deposit: "Depozito",
    balance: "Kalan",
    tattooArtist: "Dövme Sanatçısı",
    artist: "Sanatçı",
    contact: "İletişim",
    notes: "Notlar",
    hotelInfo: "Otel Bilgisi",
    roomInfo: "Oda Bilgisi",
    serviceArea: "Servis Alanı",
  },
  en: {
    customerInfo: "Customer Information",
    fullName: "Full Name",
    phone: "Phone",
    email: "Email",
    nationality: "Nationality",
    appointmentDetails: "Appointment Details",
    date: "Date",
    time: "Time",
    paymentDetails: "Payment Details",
    totalPrice: "Total Price",
    deposit: "Deposit",
    balance: "Balance",
    tattooArtist: "Tattoo Artist",
    artist: "Artist",
    contact: "Contact",
    notes: "Notes",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  de: {
    customerInfo: "Kundeninformationen",
    fullName: "Vollständiger Name",
    phone: "Telefon",
    email: "E-Mail",
    nationality: "Nationalität",
    appointmentDetails: "Termindetails",
    date: "Datum",
    time: "Uhrzeit",
    paymentDetails: "Zahlungsdetails",
    totalPrice: "Gesamtpreis",
    deposit: "Anzahlung",
    balance: "Restbetrag",
    tattooArtist: "Tätowierer",
    artist: "Künstler",
    contact: "Kontakt",
    notes: "Notizen",
    hotelInfo: "Hotelinformation",
    roomInfo: "Zimmerinformation",
    serviceArea: "Servicebereich",
  },
  nl: {
    customerInfo: "Klantgegevens",
    fullName: "Volledige naam",
    phone: "Telefoon",
    email: "E-mail",
    nationality: "Nationaliteit",
    appointmentDetails: "Afspraakdetails",
    date: "Datum",
    time: "Tijd",
    paymentDetails: "Betalingsgegevens",
    totalPrice: "Totale prijs",
    deposit: "Voorschot",
    balance: "Resterend bedrag",
    tattooArtist: "Tattoo-artiest",
    artist: "Artiest",
    contact: "Contact",
    notes: "Opmerkingen",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  fr: {
    customerInfo: "Informations client",
    fullName: "Nom complet",
    phone: "Téléphone",
    email: "Email",
    nationality: "Nationalité",
    appointmentDetails: "Détails du rendez-vous",
    date: "Date",
    time: "Heure",
    paymentDetails: "Détails de paiement",
    totalPrice: "Prix total",
    deposit: "Acompte",
    balance: "Solde",
    tattooArtist: "Artiste tatoueur",
    artist: "Artiste",
    contact: "Contact",
    notes: "Notes",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  es: {
    customerInfo: "Información del cliente",
    fullName: "Nombre completo",
    phone: "Teléfono",
    email: "Correo electrónico",
    nationality: "Nacionalidad",
    appointmentDetails: "Detalles de la cita",
    date: "Fecha",
    time: "Hora",
    paymentDetails: "Detalles del pago",
    totalPrice: "Precio total",
    deposit: "Depósito",
    balance: "Saldo",
    tattooArtist: "Artista del tatuaje",
    artist: "Artista",
    contact: "Contacto",
    notes: "Notas",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  it: {
    customerInfo: "Informazioni cliente",
    fullName: "Nome completo",
    phone: "Telefono",
    email: "Email",
    nationality: "Nazionalità",
    appointmentDetails: "Dettagli appuntamento",
    date: "Data",
    time: "Ora",
    paymentDetails: "Dettagli pagamento",
    totalPrice: "Prezzo totale",
    deposit: "Deposito",
    balance: "Saldo",
    tattooArtist: "Artista del tatuaggio",
    artist: "Artista",
    contact: "Contatto",
    notes: "Note",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  ru: {
    customerInfo: "Информация о клиенте",
    fullName: "Полное имя",
    phone: "Телефон",
    email: "Email",
    nationality: "Национальность",
    appointmentDetails: "Детали записи",
    date: "Дата",
    time: "Время",
    paymentDetails: "Детали оплаты",
    totalPrice: "Общая стоимость",
    deposit: "Депозит",
    balance: "Остаток",
    tattooArtist: "Художник тату",
    artist: "Художник",
    contact: "Контакт",
    notes: "Примечания",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  },
  ar: {
    customerInfo: "معلومات العميل",
    fullName: "الاسم الكامل",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    nationality: "الجنسية",
    appointmentDetails: "تفاصيل الموعد",
    date: "التاريخ",
    time: "الوقت",
    paymentDetails: "تفاصيل الدفع",
    totalPrice: "السعر الإجمالي",
    deposit: "الوديعة",
    balance: "الرصيد",
    tattooArtist: "فنان الوشم",
    artist: "الفنان",
    contact: "الاتصال",
    notes: "ملاحظات",
    hotelInfo: "Hotel Information",
    roomInfo: "Room Information",
    serviceArea: "Service Area",
  }
};

export default function PrintPage({ params }: PrintPageProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reservationId = params.id;

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select(`
            *,
            customers!inner (
              id,
              name,
              email,
              phone,
              nationality
            ),
            artists!inner (
              id,
              name
            ),
            payments (
              id,
              amount,
              created_at
            )
          `)
          .eq("id", reservationId)
          .single();

        if (error) throw error;
        setReservation(data);
      } catch (error) {
        console.error("Error fetching reservation:", error);
        toast({
          title: "Hata",
          description: "Rezervasyon bilgileri alınamadı",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, supabase, toast]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = document.getElementById('printable-content');
    if (!content) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Reservation</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0.5cm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
            }
            .print-content {
              max-width: 100%;
              margin: 0 auto;
              padding: 1cm;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .flex {
              display: flex;
            }
            .items-center {
              align-items: center;
            }
            .justify-between {
              justify-content: space-between;
            }
            .space-y-4 > * + * {
              margin-top: 0.5rem;
            }
            .border-b {
              border-bottom: 1px solid #e5e7eb;
            }
            .border-t {
              border-top: 1px solid #e5e7eb;
            }
            .pb-4 {
              padding-bottom: 0.5rem;
            }
            .pt-2 {
              padding-top: 0.5rem;
            }
            .mb-6 {
              margin-bottom: 0.5rem;
            }
            .mt-6 {
              margin-top: 0.5rem;
            }
            .mt-8 {
              margin-top: 1rem;
            }
            .text-2xl {
              font-size: 1.25rem;
              font-weight: bold;
            }
            .text-xl {
              font-size: 1.125rem;
              font-weight: 600;
            }
            .text-base {
              font-size: 0.875rem;
              font-weight: bold;
            }
            .text-sm {
              font-size: 0.75rem;
            }
            .text-xs {
              font-size: 0.625rem;
            }
            .font-bold {
              font-weight: bold;
            }
            .font-semibold {
              font-weight: 600;
            }
            .tracking-wider {
              letter-spacing: 0.05em;
            }
            .uppercase {
              text-transform: uppercase;
            }
            .text-center {
              text-align: center;
            }
            .w-36 {
              width: 4rem;
            }
            .w-24 {
              width: 3rem;
            }
            .h-20 {
              height: 2rem;
            }
            .max-w-4xl {
              max-width: 100%;
            }
            .whitespace-pre-line {
              white-space: pre-line;
              font-size: 0.625rem;
              line-height: 1.2;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .gap-x-6 {
              column-gap: 1.5rem;
            }
            .gap-y-4 {
              row-gap: 1rem;
            }
            .grid-cols-\[100px\,1fr\] {
              grid-template-columns: 100px 1fr;
            }
            .border {
              border: 1px solid #e5e7eb;
            }
            .p-1 {
              padding: 0.25rem;
            }
            .dark\\:border-gray-600 {
              border-color: #4b5563;
            }
            .dark\\:bg-gray-800 {
              background-color: #1f2937;
            }
            .dark\\:text-white {
              color: white;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (date: string) => format(new Date(date), "dd MMMM yyyy", { locale: tr });

  const formatTime = (time: string) => {
    if (!time) return "-";
    try {
      return format(new Date(`2000-01-01T${time}`), "HH:mm");
    } catch {
      return time;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

  const getLanguageFromNationality = (nationality: string) => {
    const normalizedNationality = nationality?.toLowerCase().trim();
    return nationalityToLanguage[normalizedNationality as keyof typeof nationalityToLanguage] || 'en';
  };

  const nationality = reservation?.customers?.nationality || 'tr';
  const language = getLanguageFromNationality(nationality);
  const disclaimerText = disclaimerTexts[language as keyof typeof disclaimerTexts] || disclaimerTexts.en;
  const titles = sectionTitles[language as keyof typeof sectionTitles] || sectionTitles.en;

  const totalPaid = parseFloat(reservation?.deposit_amount) || 0;
  const remainingAmount = (parseFloat(reservation?.price) || 0) - totalPaid;

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Rezervasyon Bulunamadı</h1>
        <p>Bu rezervasyon bulunamadı veya erişim izniniz yok.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      {/* Print Controls */}
      <div className="fixed left-4 top-4 z-50 flex items-center gap-4">
        <Link href={`/reservations/${reservationId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </Button>
      </div>

      {/* Printable Content */}
      <div id="printable-content" className="mx-auto max-w-4xl bg-white dark:bg-gray-800 text-black dark:text-white p-8 shadow-lg">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-gray-600">
          <div className="w-36">
            <Image src="/images/logo.png" alt="Phoenix Logo" width={144} height={72} className="w-full" priority />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wider">RESERVATION</h1>
            <p className="mt-1 text-xs font-medium">Doc #: {reservationId.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="w-24 flex justify-end">
            <Image 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://phoenix-tattoo.com/reservations/${reservation.id}`} 
              alt="QR Code" 
              width={72} 
              height={72} 
              className="border border-gray-200 dark:border-gray-600 p-1" 
            />
          </div>
        </div>

        {/* Main Content - 2 columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold border-b pb-1 mb-2 dark:border-gray-600">{titles.customerInfo}</h2>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.fullName}:</span>
                  <span>{reservation?.customers?.name || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.phone}:</span>
                  <span>{reservation?.customers?.phone || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.email}:</span>
                  <span>{reservation?.customers?.email || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.nationality}:</span>
                  <span>{reservation?.customers?.nationality || "-"}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-base font-bold border-b pb-1 mb-2 dark:border-gray-600">{titles.appointmentDetails}</h2>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.date}:</span>
                  <span>{formatDate(reservation.date)}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.time}:</span>
                  <span>{formatTime(reservation.time)}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.hotelInfo}:</span>
                  <span>{reservation.hotel_info || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.roomInfo}:</span>
                  <span>{reservation.room_info || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.serviceArea}:</span>
                  <span>{reservation.service_area || "-"}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-base font-bold border-b pb-1 mb-2 dark:border-gray-600">{titles.paymentDetails}</h2>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.totalPrice}:</span>
                  <span className="font-bold">{formatCurrency(parseFloat(reservation?.price) || 0)}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.deposit}:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.balance}:</span>
                  <span className="font-bold">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold border-b pb-1 mb-2 dark:border-gray-600">{titles.tattooArtist}</h2>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.artist}:</span>
                  <span>{reservation?.artists?.name || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr]">
                  <span className="font-semibold">{titles.contact}:</span>
                  <span>{reservation?.artists?.phone || "-"}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-base font-bold border-b pb-1 mb-2 dark:border-gray-600">{titles.notes}</h2>
              <p className="text-sm">{reservation?.notes || "No additional notes."}</p>
            </div>
          </div>
        </div>

       

        {/* Disclaimer Text */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{disclaimerText.title}</h2>
          <div className="whitespace-pre-line text-sm">
            {disclaimerText.content}
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-8 flex justify-between">
          <div>
            <p className="font-semibold">
              {language === 'tr' ? 'Müşteri İmzası' : 
               language === 'en' ? 'Customer Signature' : 
               language === 'de' ? 'Kundenunterschrift' : 'Müşteri İmzası'}
            </p>
            <div className="h-20 border-t border-gray-300 mt-2"></div>
          </div>
          <div>
            <p className="font-semibold">
              {language === 'tr' ? 'Sanatçı İmzası' : 
               language === 'en' ? 'Artist Signature' : 
               language === 'de' ? 'Künstlerunterschrift' : 'Sanatçı İmzası'}
            </p>
            <div className="h-20 border-t border-gray-300 mt-2"></div>
          </div>
        </div>

        {/* Footer - Moved to bottom */}
        <div className="mt-auto pt-4 border-t dark:border-gray-600">
          <div className="text-center space-y-1 text-xs">
            <p className="font-bold uppercase tracking-wider">PHOENIX TATTOO PIERCING</p>
            <p>KIZILAAĞAÇ, MERKEZ SK A BLOK Z-1 MANAVGAT, ANTALYA</p>
            <p>Instagram: @phoenixtattoopiercing | Tel: +90 545 381 0788</p>
          </div>
        </div>
      </div>
    </div>
  );
}