import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/admin.login";
import { LoginForm } from "~/components/login-form";

export function meta({}: Route.MetaArgs) {
  return [{ title: "HR Admin Login" }];
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    navigate("/admin/employees");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        title="Employee Monitoring"
        subtitle="HR admin login"
        submitLabel="Log in"
        onLogin={handleLogin}
        footer={
          <>
            Not an admin?{" "}
            <Link to="/login" className="text-blue-700 hover:underline">
              Employee login
            </Link>
          </>
        }
      />
    </main>
  );
}
