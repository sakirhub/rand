import {useState} from 'react';
import {useRouter} from 'next/router';
import {Staff} from '@/types';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/use-toast';
import {Calendar, Clock, Mail, Phone, User} from 'lucide-react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';

interface StaffDetailProps {
    staff: Staff;
}

export default function StaffDetail({staff}: StaffDetailProps) {
    const router = useRouter();
    const {toast} = useToast();
    const [loading, setLoading] = useState(false);

    const getPositionLabel = (position: Staff['position']) => {
        const labels = {
            admin: 'Admin',
            designer: 'Tasarımcı',
            tattoo_artist: 'Dövme Sanatçısı',
            piercing_artist: 'Piercing Sanatçısı',
            info: 'Bilgi',
        };
        return labels[position];
    };

    const handleDelete = async () => {
        if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            setLoading(true);
            const {error} = await supabase
                .from('staff')
                .delete()
                .eq('id', staff.id);

            if (error) throw error;

            toast({
                title: 'Başarılı',
                description: 'Personel başarıyla silindi.',
            });

            router.push('/staff');
        } catch (error) {
            console.error('Error deleting staff:', error);
            toast({
                title: 'Hata',
                description: 'Personel silinirken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personel Detayları</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/staff/${staff.id}/edit`)}
                        >
                            Düzenle
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? 'Siliniyor...' : 'Sil'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-medium">Ad Soyad:</span>
                                <span>{staff.full_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-medium">E-posta:</span>
                                <span>{staff.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-medium">Telefon:</span>
                                <span>{staff.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Pozisyon:</span>
                                <Badge variant="outline">
                                    {getPositionLabel(staff.position)}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Durum:</span>
                                <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                                    {staff.is_active ? 'Aktif' : 'Pasif'}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-medium">Oluşturulma:</span>
                                <span>
                  {format(new Date(staff.created_at), 'dd MMMM yyyy', {
                      locale: tr,
                  })}
                </span>
                            </div>
                            {staff.updated_at && (
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span className="font-medium">Son Güncelleme:</span>
                                    <span>
                    {format(new Date(staff.updated_at), 'dd MMMM yyyy', {
                        locale: tr,
                    })}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 