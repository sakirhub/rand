import Image from "next/image";

export function Header() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                className="dark:invert"
                priority
            />
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Dövme/Piercing Stüdyo Yönetim Sistemi
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Rezervasyon yönetimi, fotoğraf onayları ve daha fazlası için kapsamlı bir yönetim sistemi
                </p>
            </div>
        </div>
    );
} 