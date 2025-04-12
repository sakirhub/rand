import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    const formattedUsers: UserData[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Kullanıcılar getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Kullanıcı oturumunu kontrol et
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Kullanıcı rolünü kontrol et
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);
  
  const userRole = userRoles && userRoles.length > 0 ? userRoles[0].role : null;
  
  // Sadece admin ve designer'lar kullanıcı ekleyebilir
  if (!userRole || (userRole !== "admin" && userRole !== "designer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const body: UserData = await request.json();
    
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "Email and full name are required" },
        { status: 400 }
      );
    }
    
    // Profiles tablosunda bu e-posta ile kullanıcı var mı kontrol et
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", body.email);
    
    if (existingProfiles && existingProfiles.length > 0) {
      // Kullanıcı zaten var, profili güncelle
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: body.name,
          updated_at: new Date().toISOString()
        })
        .eq("email", body.email);
      
      if (updateError) {
        throw updateError;
      }
      
      return NextResponse.json({
        success: true,
        message: "Customer updated successfully",
        user: existingProfiles[0]
      });
    }
    
    // Yeni kullanıcı oluştur
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      user_metadata: { full_name: body.name, phone: body.phone },
      password: Math.random().toString(36).slice(-8) // Rastgele şifre
    });
    
    if (authError) {
      throw authError;
    }
    
    // Profiles tablosuna ekle
    if (newUser?.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: newUser.user.id,
          email: body.email,
          full_name: body.name
        });
      
      if (profileError) {
        throw profileError;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Customer created successfully",
      user: newUser?.user
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
} 