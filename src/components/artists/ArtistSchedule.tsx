"use client";

import {useEffect, useState} from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {useToast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {addDays, format, startOfWeek} from "date-fns";
import {tr} from "date-fns/locale";
import {Calendar, ChevronLeft, ChevronRight} from "lucide-react";

interface Reservation {
    id: string;
    customer_id: string;
    artist_id: string;
    service_type: string;
    date: string;
    start_time: string;
    end_time: string;
    duration: number;
    status: string;
    notes?: string;
}

interface WorkingHour {
    id: string;
    artist_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

interface ArtistScheduleProps {
    artistId: string;
}

export function ArtistSchedule({artistId}: ArtistScheduleProps) {
    const supabase = createClientComponentClient();
    const {toast} = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), {weekStartsOn: 1}));
    const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    // Saat dilimleri (30 dakikalık aralıklarla)
    const timeSlots = Array.from({length: 24}, (_, hour) =>
        Array.from({length: 2}, (_, halfHour) =>
            `${hour.toString().padStart(2, '0')}:${halfHour === 0 ? '00' : '30'}`
        )
    ).flat();

    // Haftanın günleri
    const weekDays = Array.from({length: 7}, (_, i) =>
        addDays(currentWeekStart, i)
    );

    // Çalışma saatlerini ve rezervasyonları getir
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try {
                // Çalışma saatlerini getir
                const {data: workingHoursData, error: workingHoursError} = await supabase
                    .from("artist_working_hours")
                    .select("*")
                    .eq("artist_id", artistId);

                if (workingHoursError) {
                    throw workingHoursError;
                }

                setWorkingHours(workingHoursData || []);

                // Haftanın başlangıç ve bitiş tarihlerini belirle
                const weekStart = format(currentWeekStart, "yyyy-MM-dd");
                const weekEnd = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

                // Rezervasyonları getir
                const {data: reservationsData, error: reservationsError} = await supabase
                    .from("reservations")
                    .select("*")
                    .eq("artist_id", artistId)
                    .gte("date", weekStart)
                    .lte("date", weekEnd);

                if (reservationsError) {
                    throw reservationsError;
                }

                setReservations(reservationsData || []);
            } catch (error) {
                console.error("Çalışma programı getirilirken hata:", error);
                toast({
                    title: "Hata",
                    description: "Çalışma programı yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [artistId, currentWeekStart, supabase, toast]);

    // Önceki haftaya git
    const goToPreviousWeek = () => {
        setCurrentWeekStart(prevWeek => addDays(prevWeek, -7));
    };

    // Sonraki haftaya git
    const goToNextWeek = () => {
        setCurrentWeekStart(prevWeek => addDays(prevWeek, 7));
    };

    // Bugüne git
    const goToToday = () => {
        setCurrentWeekStart(startOfWeek(new Date(), {weekStartsOn: 1}));
    };

    // Belirli bir gün ve saat için durum kontrolü
    const getCellStatus = (day: Date, timeSlot: string) => {
        const dayOfWeek = day.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
        const dateStr = format(day, "yyyy-MM-dd");

        // Çalışma saati kontrolü
        const workingHour = workingHours.find(wh => wh.day_of_week === dayOfWeek);

        if (!workingHour || !workingHour.is_available) {
            return {status: "closed", reservation: null};
        }

        const workStartTime = workingHour.start_time.substring(0, 5);
        const workEndTime = workingHour.end_time.substring(0, 5);

        if (timeSlot < workStartTime || timeSlot >= workEndTime) {
            return {status: "outside-hours", reservation: null};
        }

        // Rezervasyon kontrolü
        const reservation = reservations.find(res =>
            res.date === dateStr &&
            timeSlot >= res.start_time.substring(0, 5) &&
            timeSlot < res.end_time.substring(0, 5)
        );

        if (reservation) {
            return {status: "reserved", reservation};
        }

        return {status: "available", reservation: null};
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Haftalık Çalışma Programı</CardTitle>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <Button variant="outline" onClick={goToToday}>
                            <Calendar className="h-4 w-4 mr-2"/>
                            Bugün
                        </Button>
                        <Button variant="outline" size="icon" onClick={goToNextWeek}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    {format(currentWeekStart, "dd MMMM", {locale: tr})} - {format(addDays(currentWeekStart, 6), "dd MMMM yyyy", {locale: tr})}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-4">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Saat</TableHead>
                                    {weekDays.map(day => (
                                        <TableHead key={day.toISOString()} className="text-center min-w-[100px]">
                                            <div>{format(day, "EEEE", {locale: tr})}</div>
                                            <div
                                                className="text-sm font-normal">{format(day, "dd MMM", {locale: tr})}</div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timeSlots.map(timeSlot => (
                                    <TableRow key={timeSlot}>
                                        <TableCell className="font-medium">{timeSlot}</TableCell>
                                        {weekDays.map(day => {
                                            const {status, reservation} = getCellStatus(day, timeSlot);

                                            return (
                                                <TableCell
                                                    key={day.toISOString()}
                                                    className={`text-center ${
                                                        status === 'reserved'
                                                            ? 'bg-red-100 dark:bg-red-900/20'
                                                            : status === 'available'
                                                                ? 'bg-green-100 dark:bg-green-900/20'
                                                                : status === 'closed'
                                                                    ? 'bg-gray-100 dark:bg-gray-800/50'
                                                                    : ''
                                                    }`}
                                                >
                                                    {status === 'reserved' && (
                                                        <div className="text-xs">
                                                            {reservation?.service_type === 'tattoo' ? 'Dövme' :
                                                                reservation?.service_type === 'piercing' ? 'Piercing' :
                                                                    'Konsültasyon'}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <div>
                    <span
                        className="inline-block w-3 h-3 bg-green-100 dark:bg-green-900/20 mr-1 rounded-sm"></span> Müsait
                </div>
                <div>
                    <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/20 mr-1 rounded-sm"></span> Rezerve
                </div>
                <div>
                    <span
                        className="inline-block w-3 h-3 bg-gray-100 dark:bg-gray-800/50 mr-1 rounded-sm"></span> Kapalı
                </div>
            </CardFooter>
        </Card>
    );
} 