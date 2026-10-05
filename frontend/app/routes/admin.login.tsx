import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/admin.login";
import { LoginForm } from "~/components/login-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login Admin HRD" }];
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    navigate("/admin/employees");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        title="Monitoring Karyawan"
        subtitle="Login admin HRD"
        submitLabel="Login"
        onLogin={handleLogin}
        footer={
          <>
            Bukan admin?{" "}
            <Link to="/login" className="text-blue-700 hover:underline">
              Login karyawan
            </Link>
          </>
        }
      />
    </main>
  );
}
