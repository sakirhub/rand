"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parse } from "date-fns";
import { tr } from "date-fns/locale";

const DAYS_OF_WEEK = [
  { value: "0", label: "Pazar" },
  { value: "1", label: "Pazartesi" },
  { value: "2", label: "Salı" },
  { value: "3", label: "Çarşamba" },
  { value: "4", label: "Perşembe" },
  { value: "5", label: "Cuma" },
  { value: "6", label: "Cumartesi" },
];

interface WorkingHour {
  id?: string;
  artist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ArtistWorkingHoursProps {
  artistId: string;
}

export function ArtistWorkingHours({ artistId }: ArtistWorkingHoursProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Çalışma saatlerini getir
  useEffect(() => {
    const fetchWorkingHours = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("artist_working_hours")
        .select("*")
        .eq("artist_id", artistId)
        .order("day_of_week");
      
      if (error) {
        console.error("Çalışma saatleri getirilirken hata oluştu:", error);
        toast({
          title: "Hata",
          description: "Çalışma saatleri yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Eğer çalışma saatleri yoksa, varsayılan olarak tüm günler için oluştur
      if (data.length === 0) {
        const defaultHours: WorkingHour[] = DAYS_OF_WEEK.map((day) => ({
          artist_id: artistId,
          day_of_week: parseInt(day.value),
          start_time: "09:00",
          end_time: "18:00",
          is_available: true,
        }));
        
        setWorkingHours(defaultHours);
      } else {
        // Veritabanından gelen saatleri formatla
        const formattedHours = data.map((hour) => ({
          ...hour,
          start_time: format(parse(hour.start_time, "HH:mm:ss", new Date()), "HH:mm"),
          end_time: format(parse(hour.end_time, "HH:mm:ss", new Date()), "HH:mm"),
        }));
        
        setWorkingHours(formattedHours);
      }
      
      setIsLoading(false);
    };
    
    fetchWorkingHours();
  }, [artistId, supabase, toast]);
  
  // Çalışma saatlerini güncelle
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Mevcut çalışma saatlerini sil
      const { error: deleteError } = await supabase
        .from("artist_working_hours")
        .delete()
        .eq("artist_id", artistId);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      // Yeni çalışma saatlerini ekle
      const { error: insertError } = await supabase
        .from("artist_working_hours")
        .insert(workingHours.map(hour => ({
          artist_id: hour.artist_id,
          day_of_week: hour.day_of_week,
          start_time: hour.start_time,
          end_time: hour.end_time,
          is_available: hour.is_available,
        })));
      
      if (insertError) {
        throw new Error(insertError.message);
      }
      
      toast({
        title: "Başarılı",
        description: "Çalışma saatleri başarıyla güncellendi.",
      });
    } catch (error: any) {
      console.error("Çalışma saatleri kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: error.message || "Çalışma saatleri kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Çalışma saati değişikliği
  const handleWorkingHourChange = (index: number, field: keyof WorkingHour, value: any) => {
    const updatedHours = [...workingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setWorkingHours(updatedHours);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Çalışma Saatleri</CardTitle>
        <CardDescription>
          Sanatçının haftalık çalışma saatlerini ayarlayın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workingHours.map((hour, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <Label>{DAYS_OF_WEEK.find(day => parseInt(day.value) === hour.day_of_week)?.label}</Label>
              </div>
              <div className="col-span-3">
                <Input
                  type="time"
                  value={hour.start_time}
                  onChange={(e) => handleWorkingHourChange(index, "start_time", e.target.value)}
                  disabled={!hour.is_available}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="time"
                  value={hour.end_time}
                  onChange={(e) => handleWorkingHourChange(index, "end_time", e.target.value)}
                  disabled={!hour.is_available}
                />
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  checked={hour.is_available}
                  onCheckedChange={(checked) => handleWorkingHourChange(index, "is_available", !!checked)}
                  id={`available-${index}`}
                />
                <Label htmlFor={`available-${index}`}>{hour.is_available ? "Açık" : "Kapalı"}</Label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </CardFooter>
    </Card>
  );
} 