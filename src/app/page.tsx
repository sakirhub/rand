import {Header} from "@/components/dashboard/Header";
import Link from "next/link";
import {Button} from "@/components/ui/button";

export default function Home() {
    return (
        <div className="container mx-auto">
            <Header/>
            <div className="flex justify-center mt-8">
                <Button asChild size="lg">
                    <Link href="/login">Giriş Yap</Link>
                </Button>
            </div>
        </div>
    );
}
