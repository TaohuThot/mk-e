import LoginForm from "./LoginForm";

export const metadata = { title: "เข้าสู่ระบบ | MyShop หลังบ้าน" };

export default function LoginPage() {
  return (
    <main className="admin-ui flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">MyShop หลังบ้าน</h1>
        <LoginForm />
      </div>
    </main>
  );
}
