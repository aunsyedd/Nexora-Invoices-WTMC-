"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Home, Users, FileText, ChevronDown, Menu, X } from "lucide-react";
import Footer from "./Footer";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const navigate = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  // Sidebar content extracted to reuse in both desktop & mobile drawer
  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="p-4 flex items-center gap-3 border-b hover:bg-gray-50 transition-colors text-left w-full"
      >
        <Image
          src="/logo.jpg"
          alt="WTMC Logo"
          width={36}
          height={36}
          className="rounded object-cover"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-gray-500">
            Nexora Invoicing Software
          </span>
          <span className="text-lg font-semibold text-gray-800">WTMC</span>
        </div>
      </button>

      {/* Nav Links */}
      <div className="p-3 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {/* Third Party Group */}
          <div className={navGroupClass(isCustomerRoute)}>
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span className="text-sm font-medium">Third Party</span>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className="flex flex-col">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/customer/new")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/customer/new")}
              className={navItemClass(isCustomerNewActive)}
            >
              New Customer
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/customer")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/customer")}
              className={navItemClass(isCustomerListActive)}
            >
              Customer List
            </div>
          </div>

          {/* Customer Invoices Group */}
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
              onClick={() => navigate("/billing/customer-invoice/new")}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                navigate("/billing/customer-invoice/new")
              }
              className={navItemClass(isInvoiceNewActive)}
            >
              New Invoice
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/billing/customer-invoice")}
              onKeyDown={(e) =>
                e.key === "Enter" && navigate("/billing/customer-invoice")
              }
              className={navItemClass(isInvoiceListActive)}
            >
              Invoice List
            </div>
          </div>
        </nav>
      </div>

      <Footer />
    </>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (hidden on mobile) ─── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 shrink-0 h-screen sticky top-0 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* ─── MOBILE OVERLAY ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── MOBILE DRAWER SIDEBAR ─── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* ─── TOP HEADER BAR ─── */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-30">
        <header className="bg-white px-3 sm:px-4 border-b border-gray-200 flex items-center justify-between shadow-sm h-14">
          {/* Left: Hamburger (mobile) + Home + Billing */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Home */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Dashboard"
            >
              <Home size={18} />
            </button>

            {/* Billing */}
            <button
              type="button"
              onClick={() => router.push("/billing")}
              className={`px-2.5 sm:px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isBillingRoute
                  ? "bg-blue-600 text-white"
                  : "text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Billing
            </button>
          </div>

          {/* Right: Admin label + User chip + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Admin
            </span>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* User chip */}
              <div className="flex items-center gap-1 bg-blue-600 text-white px-2.5 sm:px-3 py-1.5 rounded text-sm font-medium">
                <span className="hidden xs:inline">Syed</span>
                <span className="xs:hidden">S</span>
                <ChevronDown size={14} />
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Logout</span>
                {/* Icon fallback on very small screens */}
                <span className="sm:hidden">↩</span>
              </button>
            </div>
          </div>
        </header>
      </div>
    </>
  );
}