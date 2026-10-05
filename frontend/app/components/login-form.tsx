import { useState } from "react";

import { Alert, inputClass, primaryButton } from "~/components/ui";

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

type LoginFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  onLogin: (email: string, password: string) => Promise<void>;
  footer?: React.ReactNode;
};

function validate(email: string, password: string): LoginErrors | null {
  const errors: LoginErrors = {};

  if (!email) errors.email = "Email wajib diisi.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid.";

  if (!password) errors.password = "Password wajib diisi.";

  return Object.keys(errors).length ? errors : null;
}

export function LoginForm({ title, subtitle, submitLabel, onLogin, footer }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate(email.trim(), password);
    setErrors(validationErrors ?? {});
    if (validationErrors) return;

    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Login gagal. Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white">
      <div className="px-6 pt-6 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
        {errors.form && <Alert kind="error">{errors.form}</Alert>}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            className={inputClass(!!errors.password)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-700">{errors.password}</p>}
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Tampilkan password
          </label>
        </div>

        <button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
          {submitting ? "Memproses..." : submitLabel}
        </button>
      </form>

      {footer && <div className="px-6 pb-6 text-center text-sm text-gray-500">{footer}</div>}
    </div>
  );
}
