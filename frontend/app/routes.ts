import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("admin/login", "routes/admin.login.tsx"),

  layout("routes/employee/layout.tsx", [
    route("attendance", "routes/employee/attendance.tsx"),
    route("summary", "routes/employee/summary.tsx"),
    route("profile", "routes/employee/profile.tsx"),
  ]),
] satisfies RouteConfig;
