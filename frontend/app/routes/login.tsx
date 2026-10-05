import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/login";
import { LoginForm } from "~/components/login-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login Karyawan" }];
}

export default function EmployeeLogin() {
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
    navigate("/attendance");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        title="Absensi WFH"
        subtitle="Login karyawan"
        submitLabel="Login"
        onLogin={handleLogin}
        footer={
          <>
            Admin HRD?{" "}
            <Link to="/admin/login" className="text-blue-700 hover:underline">
              Login di sini
            </Link>
          </>
        }
      />
    </main>
  );
}
