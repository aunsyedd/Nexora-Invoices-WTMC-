"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true });

      if (!error) setInvoiceCount(count || 0);
    };

    fetchCount();
  }, [user]);

  // ── Auth guard ──
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    {
      title: "Customer Invoices",
      count: invoiceCount,
      href: "/billing/customer-invoice",
      icon: <FileText size={48} className="opacity-20 shrink-0" />,
      color: "bg-blue-600",
    },
    // ── Add more stat cards here as your app grows ──
    // {
    //   title: "Pending Invoices",
    //   count: 0,
    //   href: "/billing/pending",
    //   icon: <Clock size={48} className="opacity-20 shrink-0" />,
    //   color: "bg-orange-500",
    // },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-1 pt-14 overflow-y-auto min-w-0">
        <div className="p-3 sm:p-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Billing
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Overview of all billing modules
              </p>
            </div>
            <div className="text-xs text-blue-600 self-start sm:self-auto">
              Home / <span className="text-gray-400">Billing</span>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`${stat.color} rounded-lg shadow-md text-white overflow-hidden flex flex-col transition-transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {/* Card Body */}
                <div className="p-4 sm:p-5 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="text-3xl sm:text-4xl font-bold leading-none">
                      {stat.count.toLocaleString()}
                    </h2>
                    <p className="text-sm sm:text-base mt-1.5 font-medium opacity-90 leading-snug">
                      {stat.title}
                    </p>
                  </div>
                  {stat.icon}
                </div>

                {/* Card Footer Link */}
                <Link
                  href={stat.href}
                  className="bg-black/10 hover:bg-black/20 active:bg-black/30 transition-colors py-2.5 text-sm flex items-center justify-center gap-1.5 w-full font-medium"
                >
                  More info
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}

            {/* ── Empty State (shown when no stats) ── */}
            {stats.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <FileText size={40} className="opacity-30" />
                <p className="text-sm">No billing modules available yet.</p>
              </div>
            )}
          </div>

          {/* ── Summary Footer ── */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">
                {invoiceCount.toLocaleString()}
              </span>{" "}
              total invoice{invoiceCount !== 1 ? "s" : ""} recorded
            </div>
            <Link
              href="/billing/customer-invoice/new"
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
            >
              <FileText size={15} />
              New Invoice
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}