import { UserForm } from "@/components/users/UserForm";

export default function CreateUserPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yeni Kullanıcı Oluştur</h1>
      <UserForm />
    </div>
  );
} 