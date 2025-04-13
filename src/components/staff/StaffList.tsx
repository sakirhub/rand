import { useState } from 'react';
import { useRouter } from 'next/router';
import { Staff } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface StaffListProps {
  staff: Staff[];
}

export default function StaffList({ staff }: StaffListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const getPositionLabel = (position: Staff['position']) => {
    const labels: Record<Staff['position'], string> = {
      admin: 'Admin',
      designer: 'Tasarımcı',
      tattoo_artist: 'Dövme Sanatçısı',
      piercing_artist: 'Piercing Sanatçısı',
      info: 'Bilgi',
    };
    return labels[position];
  };

  const filteredStaff = staff.filter((member) =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPositionLabel(member.position).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personel Listesi</CardTitle>
        <Button onClick={() => router.push('/staff/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Personel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Personel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="grid gap-4">
          {filteredStaff.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{member.full_name}</span>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.email} • {member.phone}
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline">
                        {getPositionLabel(member.position)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/staff/${member.id}`)}
                  >
                    Detaylar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredStaff.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Personel bulunamadı.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 