"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {Alert, AlertDescription} from "@/components/ui/alert";

import {Button} from "@/components/ui/button";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {User} from "@/types";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "İsim en az 2 karakter olmalıdır.",
    }),
    email: z.string().email({
        message: "Geçerli bir e-posta adresi girin.",
    }),
    password: z.string().min(6, {
        message: "Şifre en az 6 karakter olmalıdır.",
    }),
    role: z.enum(["admin", "designer", "tattoo_artist", "info"], {
        required_error: "Lütfen bir rol seçin.",
    }),
});

interface UserFormProps {
    user?: User;
}

export function UserForm({user}: UserFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            password: "",
            role: user?.role || "info",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        setError(null);

        try {
            if (user) {
                // Mevcut kullanıcıyı güncelle
                const {error} = await supabase
                    .from("users")
                    .update({
                        name: values.name,
                        role: values.role,
                    })
                    .eq("id", user.id);

                if (error) throw error;
            } else {
                // Doğrudan Supabase client kullan
                // Not: Bu yöntem güvenli değil, sadece geliştirme aşamasında kullanılmalı

                // 1. Auth sisteminde kullanıcı oluştur
                const {data, error} = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                });

                if (error) {
                    throw error;
                }

                if (data.user) {
                    // 2. Kullanıcıyı users tablosuna ekle
                    const {error: userError} = await supabase.from("users").insert({
                        id: data.user.id,
                        name: values.name,
                        email: values.email,
                        role: values.role,
                    });

                    if (userError) {
                        console.error("DB error:", userError);
                        throw userError;
                    }

                    setError("Kullanıcı oluşturuldu. Kullanıcı e-posta onayı yapmalıdır.");
                }
            }

            setTimeout(() => {
                router.refresh();
                router.push("/admin/users");
            }, 2000);
        } catch (err: any) {
            console.error("Error saving user:", err);
            setError(err.message || "Kullanıcı kaydedilirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                    <Alert variant={error.includes("oluşturuldu") ? "default" : "destructive"}>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>İsim</FormLabel>
                            <FormControl>
                                <Input placeholder="Kullanıcı adını girin" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="E-posta adresini girin"
                                    {...field}
                                    disabled={!!user}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {!user && (
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Şifre</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Şifre girin"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="role"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rol seçin"/>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="designer">Designer</SelectItem>
                                    <SelectItem value="tattoo_artist">Tattoo Artist</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Kullanıcının sistem içindeki rolünü belirler.
                            </FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Kaydediliyor..." : user ? "Kullanıcıyı Güncelle" : "Kullanıcı Oluştur"}
                </Button>
            </form>
        </Form>
    );
} 