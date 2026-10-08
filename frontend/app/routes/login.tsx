import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/login";
import { LoginForm } from "~/components/login-form";
import { login } from "~/lib/auth";
import { saveSession } from "~/lib/session";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Employee Login" }];
}

export default function EmployeeLogin() {
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
    const session = await login(email, password);

    if (session.user.role !== "EMPLOYEE") {
      throw new Error("This is an HR admin account. Use the HR admin login instead.");
    }

    saveSession(session);
    navigate("/attendance");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        title="WFH Attendance"
        subtitle="Employee login"
        submitLabel="Log in"
        onLogin={handleLogin}
        footer={
          <>
            HR admin?{" "}
            <Link to="/admin/login" className="text-blue-700 hover:underline">
              Log in here
            </Link>
          </>
        }
      />
    </main>
  );
}
