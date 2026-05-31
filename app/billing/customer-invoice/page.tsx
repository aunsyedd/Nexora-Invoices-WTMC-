"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { Plus, Search } from "lucide-react";
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

  const totalAmount = filteredInvoices.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0);
  const totalVat = filteredInvoices.reduce((s, r) => s + (parseFloat(r.vat_amount) || 0), 0);
  const totalNet = filteredInvoices.reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);

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

      <main className="flex-1 pt-14 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">Customer Invoices</h1>
              <Link
                href="/billing/customer-invoice/new"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={16} />
                New Invoice
              </Link>
            </div>
            <nav className="text-xs text-blue-600">
              Home / <span className="text-gray-500">Customer Invoices</span>
            </nav>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 flex justify-end">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice #, customer, PO..."
                  className="border border-gray-300 pl-8 pr-3 py-1.5 text-sm w-72 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs tracking-wide">
                    {["Invoice #", "Date", "Description", "P.O. Number", "Project", "Customer", "Amount", "VAT", "Net Total"].map((header) => (
                      <th key={header} className="p-3 font-semibold border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        {search ? "No invoices match your search." : "No invoices found. Create your first invoice."}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium">
                          <Link href={`/billing/customer-invoice/${row.id}`} className="text-blue-600 hover:underline">
                            {row.number}
                          </Link>
                        </td>
                        <td className="p-3 whitespace-nowrap text-gray-700">{formatProformaDate(row.date) || row.date}</td>
                        <td className="p-3 max-w-xs truncate text-gray-700">{row.description || "—"}</td>
                        <td className="p-3 text-gray-700">{row.po_number || "—"}</td>
                        <td className="p-3 text-gray-700">{row.project_name || "—"}</td>
                        <td className="p-3 text-gray-800 font-medium">{row.customer_name}</td>
                        <td className="p-3 text-right text-gray-700">{formatProformaNumber(row.total_amount)}</td>
                        <td className="p-3 text-right text-gray-700">{formatProformaNumber(row.vat_amount)}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">{formatProformaNumber(row.net_amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>

                {!loading && filteredInvoices.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold text-gray-800 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={6} className="p-3 text-left">Totals</td>
                      <td className="p-3 text-right">{formatProformaNumber(totalAmount)}</td>
                      <td className="p-3 text-right">{formatProformaNumber(totalVat)}</td>
                      <td className="p-3 text-right">{formatProformaNumber(totalNet)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              Showing {filteredInvoices.length} of {invoices.length} entries
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}