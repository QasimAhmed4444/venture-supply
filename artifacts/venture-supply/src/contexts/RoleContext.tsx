import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_B2C, DEMO_B2B, type Customer } from "@/data/customers";
import { DEMO_SALES, type Salesperson } from "@/data/salespersons";

export type UserRole = "guest" | "b2c" | "b2b" | "admin" | "sales";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  customer: Customer | null;
  salesperson: Salesperson | null;
  adminName: string;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = "vs.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "guest";
    const stored = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    return stored && ["guest", "b2c", "b2b", "admin", "sales"].includes(stored) ? stored : "guest";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const setRole = (r: UserRole) => setRoleState(r);
  const logout = () => setRoleState("guest");

  const isAuthenticated = role !== "guest";
  const customer = role === "b2c" ? DEMO_B2C : role === "b2b" ? DEMO_B2B : null;
  const salesperson = role === "sales" ? DEMO_SALES : null;
  const adminName = "Sami Al-Rashid";

  return (
    <RoleContext.Provider value={{ role, setRole, isAuthenticated, customer, salesperson, adminName, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
