"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {Header} from "@/components/dashboard/Header";
import Link from "next/link";
import {Button} from "@/components/ui/button";

export default function Home() {
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/dashboard");
            } else {
                router.push("/auth");
            }
        };

        checkAuth();
    }, [router, supabase]);

    return null;
}
