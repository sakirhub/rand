import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6">
          Dövme/Piercing Stüdyo Yönetim Sistemi
        </h1>
        <p className="text-xl mb-8">
          Rezervasyon yönetimi, fotoğraf onayları ve daha fazlası için kapsamlı bir yönetim sistemi.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
