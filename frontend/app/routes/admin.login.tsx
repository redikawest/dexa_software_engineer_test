import { Link, useNavigate, useSearchParams } from "react-router";

import type { Route } from "./+types/admin.login";
import { LoginForm } from "~/components/login-form";
import { login } from "~/lib/auth";
import { redirectIfLoggedIn } from "~/lib/guards";
import { saveSession } from "~/lib/session";

export function clientLoader() {
  return redirectIfLoggedIn();
}
clientLoader.hydrate = true as const;

export function meta({}: Route.MetaArgs) {
  return [{ title: "HR Admin Login" }];
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const notice = params.has("expired") ? "Your session has expired. Please log in again." : undefined;

  const handleLogin = async (email: string, password: string) => {
    const session = await login(email, password);

    if (session.user.role !== "HR_ADMIN") {
      throw new Error("This account is not an HR admin. Use the employee login instead.");
    }

    saveSession(session);
    navigate("/admin/employees");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        title="Employee Monitoring"
        subtitle="HR admin login"
        submitLabel="Log in"
        onLogin={handleLogin}
        notice={notice}
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
