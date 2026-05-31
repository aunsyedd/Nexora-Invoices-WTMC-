"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Home, Users, FileText, ChevronDown } from "lucide-react";
import Footer from "./Footer";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};

  const isCustomerRoute = pathname?.startsWith("/customer");
  const isBillingRoute = pathname?.startsWith("/billing");
  const isInvoiceRoute = pathname?.startsWith("/billing/customer-invoice");

  const isCustomerNewActive = pathname === "/customer/new";
  const isCustomerListActive =
    pathname === "/customer" ||
    pathname === "/customer/" ||
    (isCustomerRoute &&
      pathname !== "/customer/new" &&
      /^\/customer\/\d+$/.test(pathname ?? ""));

  const isInvoiceNewActive = pathname === "/billing/customer-invoice/new";
  const isInvoiceListActive =
    pathname === "/billing/customer-invoice" ||
    pathname === "/billing/customer-invoice/" ||
    (isInvoiceRoute &&
      pathname !== "/billing/customer-invoice/new" &&
      !pathname.endsWith("/new"));

  const navItemClass = (active: boolean) =>
    `pl-9 py-2 text-sm font-medium border-l-2 border-blue-600 cursor-pointer transition-colors ${
      active
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 bg-gray-50 hover:bg-gray-100"
    }`;

  const navGroupClass = (active: boolean) =>
    `flex items-center justify-between p-2 rounded transition-colors ${
      active ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"
    }`;

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0 h-screen sticky top-0 flex flex-col shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="p-4 flex items-center gap-3 border-b hover:bg-gray-50 transition-colors text-left"
        >
          <Image
            src="/logo.jpg"
            alt="WTMC Logo"
            width={36}
            height={36}
            className="rounded object-cover"
          />
          <div className="flex flex-col leading-tight">
           <span className="text-xs font-medium text-gray-500">Nexora Invoicing Software</span>
            <span className="text-lg font-semibold text-gray-800">WTMC</span>
          </div>
        </button>

        <div className="p-3 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            <div className={navGroupClass(isCustomerRoute)}>
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span className="text-sm font-medium">Customers</span>
              </div>
              <ChevronDown size={14} />
            </div>

            <div className="flex flex-col">
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push("/customer/new")}
                onKeyDown={(e) => e.key === "Enter" && router.push("/customer/new")}
                className={navItemClass(isCustomerNewActive)}
              >
                New Customer
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push("/customer")}
                onKeyDown={(e) => e.key === "Enter" && router.push("/customer")}
                className={navItemClass(isCustomerListActive)}
              >
                Customer List
              </div>
            </div>

            <div className={`${navGroupClass(isInvoiceRoute)} mt-2`}>
              <div className="flex items-center gap-2">
                <FileText size={18} />
                <span className="text-sm font-medium">Customer Invoices</span>
              </div>
              <ChevronDown size={14} />
            </div>

            <div className="flex flex-col">
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push("/billing/customer-invoice/new")}
                onKeyDown={(e) =>
                  e.key === "Enter" && router.push("/billing/customer-invoice/new")
                }
                className={navItemClass(isInvoiceNewActive)}
              >
                New Invoice
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push("/billing/customer-invoice")}
                onKeyDown={(e) =>
                  e.key === "Enter" && router.push("/billing/customer-invoice")
                }
                className={navItemClass(isInvoiceListActive)}
              >
                Invoice List
              </div>
            </div>
          </nav>
        </div>

        <Footer />
      </aside>

      <div className="fixed top-0 left-64 right-0 z-50">
        <header className="bg-white px-4 border-b border-gray-200 flex items-center justify-between shadow-sm h-14">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Dashboard"
            >
              <Home size={18} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/billing")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isBillingRoute
                  ? "bg-blue-600 text-white"
                  : "text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Billing
            </button>
          </div>

<div className="flex items-center gap-3">
  <span className="text-sm text-gray-600 hidden sm:inline">Admin</span>

  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium">
      Syed
      <ChevronDown size={14} />
    </div>

    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
    >
      Logout
    </button>
  </div>
</div>
        </header>
      </div>
    </>
  );
}
