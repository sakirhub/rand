"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, Save, User, Bell, Shield, Key } from "lucide-react";

interface SettingsData {
  id: string;
  name: string;
  email: string;
  // ... diğer alanlar
}

export default function SettingsPage() {
  const [user, setUser] = useState<SettingsData | null>(null);
  const [profile, setProfile] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();
  
  // Kullanıcı bilgilerini getir
  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      
      // Kullanıcı oturumunu kontrol et
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUser(session.user);
      
      // Kullanıcı profilini getir
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profileError) {
        console.error("Profil bilgileri getirilirken hata:", profileError);
      } else {
        setProfile(profileData);
      }
      
      setLoading(false);
    }
    
    fetchUserData();
  }, [supabase, router]);
  
  // Avatar dosyasını değiştir
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Önizleme URL'i oluştur
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Profil bilgilerini güncelle
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Avatar yükleme
      let avatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        // Storage bucket kontrolü
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          throw bucketsError;
        }
        
        // Bucket var mı kontrol et
        const bucketExists = buckets.some(bucket => bucket.name === "avatars");
        
        // Bucket yoksa oluştur
        if (!bucketExists) {
          const { error: createBucketError } = await supabase
            .storage
            .createBucket("avatars", { public: true });
          
          if (createBucketError) {
            throw createBucketError;
          }
        }
        
        // Avatar yükle
        const { error: uploadError } = await supabase
          .storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            upsert: true // Aynı isimde dosya varsa üzerine yaz
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Avatar URL'ini al
        const { data: { publicUrl } } = supabase
          .storage
          .from("avatars")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }
      
      // Profil bilgilerini güncelle
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: profile?.name,
          bio: profile?.bio,
          avatar_url: avatarUrl,
          notification_email: profile?.notification_email,
          notification_sms: profile?.notification_sms,
          notification_push: profile?.notification_push,
        })
        .eq("id", user?.id);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Profil güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
      });
    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Şifre değiştirme
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("password") as string;
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Şifre güncellendi",
        description: "Şifreniz başarıyla güncellendi.",
      });
      
      // Formu sıfırla
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Şifre güncellenirken hata:", error);
      
      toast({
        title: "Hata",
        description: "Şifre güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Ayarlar
      </h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
        </TabsList>
        
        {/* Profil Sekmesi */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Profil bilgilerinizi güncelleyin.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={avatarPreview || profile?.avatar_url} 
                        alt={profile?.name || "Avatar"} 
                      />
                      <AvatarFallback>
                        {profile?.name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 p-1 rounded-full bg-primary text-primary-foreground cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <Label htmlFor="email">E-posta</Label>
                      <Input 
                        id="email" 
                        value={user?.email} 
                        disabled 
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input 
                        id="name" 
                        value={profile?.name || ""} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Hakkımda</Label>
                  <Textarea 
                    id="bio" 
                    value={profile?.bio || ""} 
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Bildirimler Sekmesi */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Bildirim tercihlerinizi yönetin.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification_email">E-posta Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Rezervasyon durumu değiştiğinde e-posta bildirimi al.
                    </p>
                  </div>
                  <Switch 
                    id="notification_email" 
                    checked={profile?.notification_email || false}
                    onCheckedChange={(checked) => setProfile({ ...profile, notification_email: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification_sms">SMS Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Rezervasyon durumu değiştiğinde SMS bildirimi al.
                    </p>
                  </div>
                  <Switch 
                    id="notification_sms" 
                    checked={profile?.notification_sms || false}
                    onCheckedChange={(checked) => setProfile({ ...profile, notification_sms: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification_push">Push Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Rezervasyon durumu değiştiğinde push bildirimi al.
                    </p>
                  </div>
                  <Switch 
                    id="notification_push" 
                    checked={profile?.notification_push || false}
                    onCheckedChange={(checked) => setProfile({ ...profile, notification_push: checked })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Güvenlik Sekmesi */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştirme</CardTitle>
              <CardDescription>
                Hesap şifrenizi değiştirin.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="password">Yeni Şifre</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Şifre Tekrar</Label>
                  <Input 
                    id="confirm_password" 
                    type="password" 
                    required
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Şifreyi Güncelle
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 