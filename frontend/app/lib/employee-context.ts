import { useOutletContext } from "react-router";

import type { Employee } from "./dummy-data";

export type EmployeeContext = {
  employee: Employee;
  setEmployee: (employee: Employee) => void;
};

/** Employee data provided by the layout, used by the pages inside it. */
export function useEmployee() {
  return useOutletContext<EmployeeContext>();
}
