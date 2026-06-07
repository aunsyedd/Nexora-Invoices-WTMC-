"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  active: boolean;
}

export default function CustomerPage() {
  const { user, loading: authLoading } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("error");

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, mobile, email, active")
      .order("id", { ascending: false });

    if (!error) setCustomers(data || []);
  };

  const handleToggleActive = async (customer: Customer) => {
    setTogglingId(customer.id);
    setStatusMsg("");

    const newActive = !customer.active;

    const { error } = await supabase
      .from("customers")
      .update({ active: newActive })
      .eq("id", customer.id);

    if (error) {
      setStatusMsg("Failed to update status: " + error.message);
      setTogglingId(null);
      return;
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, active: newActive } : c))
    );
    setTogglingId(null);
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Delete customer "${customer.name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(customer.id);
    setStatusMsg("");

    const { count, error: countError } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customer.id);

    if (countError) {
      setStatusType("error");
      setStatusMsg("Failed to check linked invoices: " + countError.message);
      setDeletingId(null);
      return;
    }

    if (count && count > 0) {
      setStatusType("error");
      setStatusMsg(
        `Cannot delete "${customer.name}" — ${count} invoice(s) are linked to this customer. Set the customer to Inactive instead.`
      );
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);

    if (error) {
      setStatusType("error");
      setStatusMsg("Failed to delete customer: " + error.message);
      setDeletingId(null);
      return;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setStatusType("success");
    setStatusMsg(`Customer "${customer.name}" deleted successfully.`);
    setDeletingId(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        String(c.id).includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mobile?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Customers
              </h1>
              <Link
                href="/customer/new"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={15} />
                New Customer
              </Link>
            </div>
            <div className="text-xs text-blue-600 self-start sm:self-auto">
              Home / <span className="text-gray-500">Customers</span>
            </div>
          </div>

          {/* ── Status Message ── */}
          {statusMsg && (
            <div
              className={`mb-4 text-sm font-medium px-4 py-3 rounded border ${
                statusType === "error"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {statusMsg}
            </div>
          )}

          {/* ── Main Card ── */}
          <div className="bg-white rounded shadow-sm border border-gray-200">

            {/* Card Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                All Customers
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Click a customer name to edit. Click status to toggle Active / Inactive.
              </p>
            </div>

            <div className="p-3 sm:p-4">

              {/* ── Search Bar ── */}
              <div className="flex flex-col sm:flex-row sm:justify-end mb-4 gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Search:
                  </span>
                  <div className="relative flex-1 sm:flex-none">
                    <Search
                      size={14}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name, mobile, email..."
                      className="border rounded pl-7 pr-2 py-1.5 text-sm outline-none focus:border-blue-500 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* ── TABLE (md and up) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b">
                      <th className="p-3 border-r text-left">ID</th>
                      <th className="p-3 border-r text-left w-1/3">Name</th>
                      <th className="p-3 border-r text-left">Mobile</th>
                      <th className="p-3 border-r text-left">Email</th>
                      <th className="p-3 border-r text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-6 text-center text-gray-500"
                        >
                          {search
                            ? "No customers match your search."
                            : "No customers yet. Add your first customer."}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 border-r text-blue-600">
                            {c.id}
                          </td>
                          <td className="p-3 border-r">
                            <Link
                              href={`/customer/${c.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="p-3 border-r text-gray-700">
                            {c.mobile || "—"}
                          </td>
                          <td className="p-3 border-r text-gray-700">
                            {c.email || "—"}
                          </td>
                          <td className="p-3 border-r">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(c)}
                              disabled={togglingId === c.id}
                              title="Click to toggle Active / Inactive"
                              className={`px-3 py-1 rounded text-xs font-semibold min-w-[80px] transition-colors disabled:opacity-50 ${
                                c.active
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-gray-400 text-white hover:bg-gray-500"
                              }`}
                            >
                              {togglingId === c.id
                                ? "..."
                                : c.active
                                ? "Active"
                                : "Inactive"}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/customer/${c.id}`}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                <Pencil size={13} />
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(c)}
                                disabled={deletingId === c.id}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                                {deletingId === c.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS (below md) ── */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                    <Users size={32} className="opacity-40" />
                    <p className="text-sm">
                      {search
                        ? "No customers match your search."
                        : "No customers yet. Add your first customer."}
                    </p>
                  </div>
                ) : (
                  filtered.map((c) => (
                    <div
                      key={c.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-3"
                    >
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/customer/${c.id}`}
                            className="text-blue-600 hover:underline font-semibold text-sm block truncate"
                          >
                            {c.name}
                          </Link>
                          <span className="text-xs text-gray-400">
                            ID: {c.id}
                          </span>
                        </div>
                        {/* Status Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          disabled={togglingId === c.id}
                          title="Click to toggle Active / Inactive"
                          className={`shrink-0 px-2.5 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
                            c.active
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-400 text-white hover:bg-gray-500"
                          }`}
                        >
                          {togglingId === c.id
                            ? "..."
                            : c.active
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                        <div>
                          <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">
                            Mobile
                          </span>
                          <p className="mt-0.5">{c.mobile || "—"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">
                            Email
                          </span>
                          <p className="mt-0.5 truncate">{c.email || "—"}</p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                        <Link
                          href={`/customer/${c.id}`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          {deletingId === c.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── Footer Stats ── */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-1 text-sm text-gray-500">
                <span>
                  Showing {filtered.length} of {customers.length} entries
                </span>
                <span>
                  {customers.filter((c) => c.active).length} active ·{" "}
                  {customers.filter((c) => !c.active).length} inactive
                </span>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}