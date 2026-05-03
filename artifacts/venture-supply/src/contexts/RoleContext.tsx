import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_B2C, DEMO_B2B, type Customer } from "@/data/customers";
import { useSalesperson, type Salesperson } from "@/hooks/useSalespersons";
import { setSessionToken } from "@/lib/api";

export type UserRole = "guest" | "b2c" | "b2b" | "admin" | "sales";

export type { Salesperson };

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  setRoleWithCustomer: (role: UserRole, customer: Customer | null) => void;
  setRoleWithSalespersonId: (role: UserRole, salespersonId: string | null) => void;
  isAuthenticated: boolean;
  customer: Customer | null;
  setCustomer: (c: Customer | null) => void;
  salesperson: Salesperson | null;
  isSalespersonLoading: boolean;
  currentSalespersonId: string | null;
  adminName: string;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_KEY = "vs.role";
const CUSTOMER_KEY = "vs.customer";
const SALESPERSON_ID_KEY = "vs.salesperson_id";
const CART_KEY = "vs.cart";

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
    const stored = readStoredCustomer();
    return stored ?? deriveDefaultCustomer(storedRole ?? "guest");
  });

  const [currentSalespersonId, setCurrentSalespersonIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SALESPERSON_ID_KEY) ?? null;
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

  const setCurrentSalespersonId = (id: string | null) => {
    setCurrentSalespersonIdState(id);
    try {
      if (id) window.localStorage.setItem(SALESPERSON_ID_KEY, id);
      else window.localStorage.removeItem(SALESPERSON_ID_KEY);
    } catch {}
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
    if (r === "b2c" || r === "b2b") {
      const stored = readStoredCustomer();
      if (!stored) setCustomer(deriveDefaultCustomer(r));
    } else {
      setCustomer(null);
    }
    if (r !== "sales") setCurrentSalespersonId(null);
  };

  const setRoleWithCustomer = (r: UserRole, c: Customer | null) => {
    setRoleState(r);
    setCustomer(c);
    setCurrentSalespersonId(null);
  };

  const setRoleWithSalespersonId = (r: UserRole, salespersonId: string | null) => {
    setRoleState(r);
    setCustomer(null);
    setCurrentSalespersonId(salespersonId);
  };

  const logout = () => {
    setRoleState("guest");
    setCustomerState(null);
    setCurrentSalespersonIdState(null);
    setSessionToken(null);
    try { window.localStorage.removeItem(CUSTOMER_KEY); } catch {}
    try { window.localStorage.removeItem(SALESPERSON_ID_KEY); } catch {}
    try { window.localStorage.removeItem(CART_KEY); } catch {}
  };

  const isAuthenticated = role !== "guest";
  const { data: salesperson = null, isLoading: isSalespersonLoading } = useSalesperson(role === "sales" ? currentSalespersonId : null);
  const adminName = "Sami Al-Rashid";

  return (
    <RoleContext.Provider
      value={{
        role, setRole, setRoleWithCustomer, setRoleWithSalespersonId,
        isAuthenticated, customer, setCustomer,
        salesperson, isSalespersonLoading, currentSalespersonId,
        adminName, logout,
      }}
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
