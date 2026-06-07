"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { Plus, Search, FileText } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatProformaDate, formatProformaNumber } from "@/lib/proformaUtils";
import { useAuth } from "@/app/hooks/useAuth";

export default function CustomerInvoiceList() {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setInvoices(data || []);
      setLoading(false);
    };

    fetchInvoices();
  }, [user]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (r) =>
        String(r.number).toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.po_number?.toLowerCase().includes(q) ||
        r.project_name?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const totalAmount = filteredInvoices.reduce(
    (s, r) => s + (parseFloat(r.total_amount) || 0),
    0
  );
  const totalVat = filteredInvoices.reduce(
    (s, r) => s + (parseFloat(r.vat_amount) || 0),
    0
  );
  const totalNet = filteredInvoices.reduce(
    (s, r) => s + (parseFloat(r.net_amount) || 0),
    0
  );

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-1 pt-14 overflow-y-auto min-w-0">
        <div className="p-3 sm:p-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Customer Invoices
              </h1>
              <Link
                href="/billing/customer-invoice/new"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={15} />
                New Invoice
              </Link>
            </div>
            <nav className="text-xs text-blue-600 self-start sm:self-auto">
              Home / <span className="text-gray-500">Customer Invoices</span>
            </nav>
          </div>

          {/* ── Main Card ── */}
          <div className="bg-white rounded border border-gray-200 shadow-sm">

            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-end gap-2">
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice #, customer, PO..."
                  className="border border-gray-300 pl-8 pr-3 py-1.5 text-sm w-full rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ── DESKTOP TABLE (lg and up) ── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs tracking-wide">
                    {[
                      "Invoice #",
                      "Date",
                      "Description",
                      "P.O. Number",
                      "Project",
                      "Customer",
                      "Amount",
                      "VAT",
                      "Net Total",
                    ].map((header) => (
                      <th
                        key={header}
                        className="p-3 font-semibold border-r border-gray-200 last:border-r-0 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Loading invoices...
                        </div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="opacity-30" />
                          <p>
                            {search
                              ? "No invoices match your search."
                              : "No invoices found. Create your first invoice."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 font-medium">
                          <Link
                            href={`/billing/customer-invoice/${row.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {row.number}
                          </Link>
                        </td>
                        <td className="p-3 whitespace-nowrap text-gray-700">
                          {formatProformaDate(row.date) || row.date}
                        </td>
                        <td className="p-3 max-w-xs truncate text-gray-700">
                          {row.description || "—"}
                        </td>
                        <td className="p-3 text-gray-700">
                          {row.po_number || "—"}
                        </td>
                        <td className="p-3 text-gray-700">
                          {row.project_name || "—"}
                        </td>
                        <td className="p-3 text-gray-800 font-medium">
                          {row.customer_name}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {formatProformaNumber(row.total_amount)}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {formatProformaNumber(row.vat_amount)}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          {formatProformaNumber(row.net_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {!loading && filteredInvoices.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold text-gray-800 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={6} className="p-3 text-left">
                        Totals
                      </td>
                      <td className="p-3 text-right">
                        {formatProformaNumber(totalAmount)}
                      </td>
                      <td className="p-3 text-right">
                        {formatProformaNumber(totalVat)}
                      </td>
                      <td className="p-3 text-right">
                        {formatProformaNumber(totalNet)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* ── MOBILE / TABLET CARDS (below lg) ── */}
            <div className="lg:hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                  <FileText size={36} className="opacity-30" />
                  <p className="text-sm text-center px-4">
                    {search
                      ? "No invoices match your search."
                      : "No invoices found. Create your first invoice."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredInvoices.map((row) => (
                    <div
                      key={row.id}
                      className="p-4 hover:bg-gray-50 transition-colors space-y-3"
                    >
                      {/* Top row: Invoice # + Date */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/billing/customer-invoice/${row.id}`}
                          className="text-blue-600 hover:underline font-semibold text-sm"
                        >
                          {row.number}
                        </Link>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatProformaDate(row.date) || row.date}
                        </span>
                      </div>

                      {/* Customer */}
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                          Customer
                        </span>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">
                          {row.customer_name || "—"}
                        </p>
                      </div>

                      {/* Description + Project + PO */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        {row.description && (
                          <div className="col-span-2">
                            <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                              Description
                            </span>
                            <p className="truncate mt-0.5">{row.description}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                            P.O. Number
                          </span>
                          <p className="mt-0.5">{row.po_number || "—"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                            Project
                          </span>
                          <p className="mt-0.5 truncate">
                            {row.project_name || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                            Amount
                          </p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {formatProformaNumber(row.total_amount)}
                          </p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                            VAT
                          </p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {formatProformaNumber(row.vat_amount)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                            Net Total
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            {formatProformaNumber(row.net_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Totals Bar */}
              {!loading && filteredInvoices.length > 0 && (
                <div className="border-t-2 border-gray-300 bg-gray-50 p-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                      Total Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {formatProformaNumber(totalAmount)}
                    </p>
                  </div>
                  <div className="border-x border-gray-200">
                    <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                      Total VAT
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {formatProformaNumber(totalVat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">
                      Net Total
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatProformaNumber(totalNet)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer: Entry Count ── */}
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm text-gray-500">
              <span>
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {filteredInvoices.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {invoices.length}
                </span>{" "}
                entries
              </span>
              {search && filteredInvoices.length !== invoices.length && (
                <button
                  onClick={() => setSearch("")}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium self-start sm:self-auto"
                >
                  Clear search ×
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}