"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Calendar, Edit, Grid, List, Mail, MoreHorizontal, Phone, Search, Trash} from "lucide-react";
import {useToast} from "@/components/ui/use-toast";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Badge} from "@/components/ui/badge";
import {format, parseISO} from "date-fns";
import {tr} from "date-fns/locale";

interface Artist {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    bio?: string;
    type: "tattoo" | "piercing" | "both";
    experience_years?: number;
    created_at: string;
}

interface ArtistListProps {
    artists: Artist[];
    readOnly?: boolean;
}

export function ArtistList({artists, readOnly = false}: ArtistListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredArtists, setFilteredArtists] = useState<Artist[]>(artists);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const router = useRouter();
    const supabase = createClientComponentClient();
    const {toast} = useToast();

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term.trim() === "") {
            setFilteredArtists(artists);
        } else {
            const filtered = artists.filter(artist =>
                artist.name.toLowerCase().includes(term.toLowerCase()) ||
                artist.email?.toLowerCase().includes(term.toLowerCase()) ||
                artist.phone?.includes(term)
            );
            setFilteredArtists(filtered);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bu sanatçıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            try {
                const {error} = await supabase
                    .from("artists")
                    .delete()
                    .eq("id", id);

                if (error) {
                    throw new Error(error.message);
                }

                toast({
                    title: "Sanatçı silindi",
                    description: "Sanatçı başarıyla silindi.",
                });

                router.refresh();
            } catch (error: any) {
                toast({
                    title: "Hata",
                    description: error.message || "Sanatçı silinirken bir hata oluştu.",
                    variant: "destructive",
                });
            }
        }
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === "grid" ? "list" : "grid");
    };

    const getArtistTypeBadge = (type: string) => {
        switch (type) {
            case "tattoo":
                return <Badge variant="default">Dövme</Badge>;
            case "piercing":
                return <Badge variant="secondary">Piercing</Badge>;
            case "both":
                return <Badge variant="outline">Dövme & Piercing</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Sanatçı ara..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <Button variant="outline" size="icon" onClick={toggleViewMode}>
                    {viewMode === "grid" ? <List className="h-4 w-4"/> : <Grid className="h-4 w-4"/>}
                </Button>
            </div>

            {filteredArtists.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Arama kriterlerine uygun sanatçı bulunamadı." : "Henüz sanatçı bulunmuyor."}
                </p>
            ) : viewMode === "grid" ? (
                // Kart Görünümü
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredArtists.map(artist => (
                        <Card key={artist.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{artist.name}</CardTitle>
                                        <CardDescription>
                                            {format(parseISO(artist.created_at), "dd.MM.yyyy", {locale: tr})}
                                        </CardDescription>
                                    </div>
                                    {getArtistTypeBadge(artist.type.toString())}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {artist.email && (
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 mr-2 text-muted-foreground"/>
                                            <p className="text-sm">{artist.email}</p>
                                        </div>
                                    )}
                                    {artist.phone && (
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 mr-2 text-muted-foreground"/>
                                            <p className="text-sm">{artist.phone}</p>
                                        </div>
                                    )}
                                    {artist.experience_years && (
                                        <p className="text-sm">
                                            <span className="font-medium">Deneyim:</span> {artist.experience_years} yıl
                                        </p>
                                    )}
                                    {artist.bio && (
                                        <p className="text-sm mt-2">
                                            <span className="font-medium">Biyografi:</span> {artist.bio}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            {!readOnly && (
                                <CardFooter className="flex justify-between">
                                    <Link href={`/admin/artists/${artist.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Calendar className="h-4 w-4 mr-1"/>
                                            Çalışma Saatleri
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/artists/${artist.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-1"/>
                                            Düzenle
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(artist.id)}
                                    >
                                        <Trash className="h-4 w-4 mr-1"/>
                                        Sil
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                // Liste Görünümü
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sanatçı Adı</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>E-posta</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Deneyim</TableHead>
                                {!readOnly && <TableHead className="w-[100px]">İşlemler</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredArtists.map(artist => (
                                <TableRow key={artist.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/artists/${artist.id}`} className="hover:underline">
                                            {artist.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{getArtistTypeBadge(artist.type.toString())}</TableCell>
                                    <TableCell>{artist.email || "-"}</TableCell>
                                    <TableCell>{artist.phone || "-"}</TableCell>
                                    <TableCell>{artist.experience_years ? `${artist.experience_years} yıl` : "-"}</TableCell>
                                    {!readOnly && (
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4"/>
                                                        <span className="sr-only">İşlemler</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/artists/${artist.id}`}>
                                                            <Calendar className="h-4 w-4 mr-2"/>
                                                            Çalışma Saatleri
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/artists/${artist.id}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2"/>
                                                            Düzenle
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(artist.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash className="h-4 w-4 mr-2"/>
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 