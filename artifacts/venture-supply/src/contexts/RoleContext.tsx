import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_B2C, DEMO_B2B, type Customer } from "@/data/customers";
import { DEMO_SALES, type Salesperson } from "@/data/salespersons";

export type UserRole = "guest" | "b2c" | "b2b" | "admin" | "sales";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  setRoleWithCustomer: (role: UserRole, customer: Customer | null) => void;
  isAuthenticated: boolean;
  customer: Customer | null;
  setCustomer: (c: Customer | null) => void;
  salesperson: Salesperson | null;
  adminName: string;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_KEY = "vs.role";
const CUSTOMER_KEY = "vs.customer";

function readStoredCustomer(): Customer | null {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

function deriveDefaultCustomer(role: UserRole): Customer | null {
  if (role === "b2c") return DEMO_B2C;
  if (role === "b2b") return DEMO_B2B;
  return null;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "guest";
    const stored = window.localStorage.getItem(ROLE_KEY) as UserRole | null;
    return stored && ["guest", "b2c", "b2b", "admin", "sales"].includes(stored) ? stored : "guest";
  });

  const [customer, setCustomerState] = useState<Customer | null>(() => {
    if (typeof window === "undefined") return null;
    const storedRole = window.localStorage.getItem(ROLE_KEY) as UserRole | null;
    // Try to restore a real customer from storage, fall back to demo
    const stored = readStoredCustomer();
    return stored ?? deriveDefaultCustomer(storedRole ?? "guest");
  });

  useEffect(() => {
    window.localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  const setCustomer = (c: Customer | null) => {
    setCustomerState(c);
    try {
      if (c) window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c));
      else window.localStorage.removeItem(CUSTOMER_KEY);
    } catch {}
  };

  // Demo login — sets role and falls back to demo customer
  const setRole = (r: UserRole) => {
    setRoleState(r);
    if (r === "b2c" || r === "b2b") {
      // Only use demo customer if no real customer is stored
      const stored = readStoredCustomer();
      if (!stored) setCustomer(deriveDefaultCustomer(r));
    } else {
      setCustomer(null);
    }
  };

  // Real login / register — sets role AND real customer together
  const setRoleWithCustomer = (r: UserRole, c: Customer | null) => {
    setRoleState(r);
    setCustomer(c);
  };

  const logout = () => {
    setRoleState("guest");
    setCustomer(null);
    try { window.localStorage.removeItem(CUSTOMER_KEY); } catch {}
  };

  const isAuthenticated = role !== "guest";
  const salesperson = role === "sales" ? DEMO_SALES : null;
  const adminName = "Sami Al-Rashid";

  return (
    <RoleContext.Provider
      value={{ role, setRole, setRoleWithCustomer, isAuthenticated, customer, setCustomer, salesperson, adminName, logout }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
