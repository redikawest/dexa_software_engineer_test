import { redirect } from "react-router";

// TODO: setelah ada auth, arahkan sesuai role (EMPLOYEE -> /attendance, HR_ADMIN -> /admin/employees).
export function loader() {
  return redirect("/login");
}
