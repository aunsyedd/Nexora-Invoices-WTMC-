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
      icon: <FileText size={48} className="opacity-20" />,
      color: "bg-blue-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-1 pt-14 overflow-y-auto">
        <div className="p-6">

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-medium text-gray-800">Billing</h1>
            <div className="text-xs text-blue-600">
              Home / <span className="text-gray-400">Billing</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`${stat.color} rounded shadow-md text-white overflow-hidden flex flex-col transition-transform hover:scale-[1.02]`}
              >
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-bold">{stat.count}</h2>
                    <p className="text-lg mt-1 font-medium">{stat.title}</p>
                  </div>
                  {stat.icon}
                </div>

                <Link
                  href="/billing/customer-invoice"
                  className="bg-black/10 hover:bg-black/20 transition-colors py-2 text-sm flex items-center justify-center gap-1 w-full text-center"
                >
                  More info →
                </Link>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}