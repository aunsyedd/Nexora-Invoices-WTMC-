"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

interface Card {
  title: string;
  count: number;
  color: string;
  link: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [cards, setCards] = useState<Card[]>([
    { title: "Customers", count: 0, color: "bg-blue-600", link: "/customer" },
    { title: "Invoices", count: 0, color: "bg-indigo-600", link: "/billing/customer-invoice" },
  ]);
  const router = useRouter();

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: customerCount }, { count: invoiceCount }] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
      ]);

      setCards([
        {
          title: "Customers",
          count: customerCount || 0,
          color: "bg-blue-600",
          link: "/customer",
        },
        {
          title: "Invoices",
          count: invoiceCount || 0,
          color: "bg-indigo-600",
          link: "/billing/customer-invoice",
        },
      ]);
    };

    fetchCounts();
  }, []);

  // Auth guard — show nothing while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // If no user after loading, useAuth will redirect — render nothing
  if (!user) return null;

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Dashboard
            </h1>
            <nav className="text-xs sm:text-sm text-blue-600">
              Home / <span className="text-gray-500">Dashboard</span>
            </nav>
          </div>

          {/* Welcome */}
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 break-words">
            Welcome back,{" "}
            <span className="font-semibold text-gray-700">{user.email}</span>
          </p>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`${card.color} text-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-medium opacity-90">
                    {card.title}
                  </h2>
                  <p className="text-3xl sm:text-4xl font-bold mt-2">
                    {card.count}
                  </p>
                </div>
                <button
                  onClick={() => router.push(card.link)}
                  className="bg-black/10 hover:bg-black/20 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors text-center w-full"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>

          {/* Overview Section */}
          <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-gray-800">
              System Overview
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              Welcome back. All systems are operational.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}