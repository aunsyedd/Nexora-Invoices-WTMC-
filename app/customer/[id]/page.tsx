"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import CustomerForm from "../new/page";

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [customerData, setCustomerData] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCustomerData(data);
      setLoading(false);
    };

    fetchCustomer();
  }, [id]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Navbar />
        <main className="flex-1 pt-14 min-w-0 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">
              Loading customer...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Not Found State ──
  if (notFound || !customerData) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Navbar />
        <main className="flex-1 pt-14 min-w-0 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 sm:p-12 flex flex-col items-center gap-4 w-full max-w-sm text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-gray-800 font-semibold text-base">
                Customer Not Found
              </p>
              <p className="text-gray-500 text-sm">
                The customer with ID{" "}
                <span className="font-medium text-gray-700">#{id}</span> does
                not exist or has been removed.
              </p>
            </div>

            <Link
              href="/customer"
              className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm"
            >
              ← Back to Customer List
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Edit Form ──
  return (
    <CustomerForm
      mode="edit"
      customerId={id}
      initialCustomer={customerData}
    />
  );
}