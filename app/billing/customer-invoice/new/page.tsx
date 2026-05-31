
"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../../components/Navbar";
import { List, Trash2, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/hooks/useAuth";
import {
  ProformaInvoicePrint,
  type ProformaCustomer,
} from "../../../components/ProformaInvoicePrint";
import ZatcaQRCodeDisplay from "../../../components/ZatcaQRCodeDisplay";
import SectionHeader from "../../../components/SectionHeader";
import { SELLER_COMPANY } from "@/lib/companyConfig";
import { toDateTimeLocalValue } from "@/lib/invoiceDateUtils";
import {
  calcRetentionAmount,
  formatCustomerInvoiceNumber,
  formatProformaNumber,
} from "@/lib/proformaUtils";

const RETENTION_OPTIONS = [
  { value: "", label: "None" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "15", label: "15%" },
  { value: "20", label: "20%" },
] as const;

interface NewInvoicePageProps {
  mode?: "create" | "edit";
  initialInvoice?: any;
  initialLineItems?: any[];
}

interface Customer extends ProformaCustomer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  active: boolean;
}

interface LineItem {
  description: string;
  unit: string;
  qty: string;
  rate: string;
  amount: string;
  vat: string;
  total: string;
}

function mapDbLineItem(item: Record<string, unknown>): LineItem {
  return {
    description: String(item.description ?? ""),
    unit: String(item.unit ?? "pcs"),
    qty: String(item.qty ?? ""),
    rate: String(item.rate ?? ""),
    amount: String(item.amount ?? "0.00"),
    vat: String(item.vat ?? "VAT 15%"),
    total: String(item.total ?? "0.00"),
  };
}

export default function NewInvoicePage({
  mode = "create",
  initialInvoice,
  initialLineItems,
}: NewInvoicePageProps) {
  const { user, loading: authLoading } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);

  // General
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [documentType, setDocumentType] = useState("Standard");
  const [date, setDate] = useState("");
  const [isDateManual, setIsDateManual] = useState(false);
  const clockRef = useRef<NodeJS.Timeout | null>(null);

  // Detail
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("due_on_receipt");
  const [description, setDescription] = useState("");
  const [paymentType, setPaymentType] = useState("bank_transfer");
  const [poNumber, setPoNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [retentionPercentage, setRetentionPercentage] = useState("");
  const [publicNote, setPublicNote] = useState("");

  // Amount
  const [discount, setDiscount] = useState("0.00");
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [vatAmount, setVatAmount] = useState("0.00");
  const [netAmount, setNetAmount] = useState("0.00");
  const [retentionAmount, setRetentionAmount] = useState("0.00");
  const [dueAmount, setDueAmount] = useState("0.00");
  const [advanceAdjustment, setAdvanceAdjustment] = useState("");

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineSearch, setLineSearch] = useState("");
  const [itemType, setItemType] = useState("free");
  const [newDesc, setNewDesc] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newQty, setNewQty] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newVat, setNewVat] = useState("VAT 15%");

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<LineItem | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintProforma = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoiceNumber || "Tax Invoice",
    pageStyle: "@page { size: A4; margin: 0; }",
  });

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    if (mode === "edit" && initialInvoice && initialLineItems) {
      const mapped = initialLineItems.map(mapDbLineItem);
      const disc = String(initialInvoice.discount ?? "0.00");
      const ret = String(initialInvoice.retention_percentage ?? "");
      setLineItems(mapped);
      setRetentionPercentage(ret);
      recalculateTotals(mapped, disc, ret);
    }

    if (mode === "edit" && initialInvoice) {
      setInvoiceId(String(initialInvoice.id || ""));
      setInvoiceNumber(initialInvoice.number || "");
      setDocumentType(initialInvoice.document_type || "Standard");
      setDate(initialInvoice.date ? toDateTimeLocalValue(initialInvoice.date) : "");
      setCustomerId(String(initialInvoice.customer_id || ""));
      setCustomerName(initialInvoice.customer_name || "");
      setPaymentTerms(initialInvoice.payment_terms || "");
      setDescription(initialInvoice.description || "");
      setPaymentType(initialInvoice.payment_type || "");
      setPoNumber(initialInvoice.po_number || "");
      setProjectName(initialInvoice.project_name || "");
      setPrivateNote(initialInvoice.private_note || "");
      setPublicNote(initialInvoice.public_note || "");
      setDiscount(String(initialInvoice.discount || "0.00"));
    }

    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, alias_name, mobile, email, active, building_no, street, district, second_no, postal_code, city, vat_no, other_id");
      if (!error && mounted) setCustomers(data || []);
    };

    fetchCustomers();

    const fetchNextId = async () => {
      if (mode === "edit") return;
      const { data } = await supabase
        .from("invoices")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);
      const nextId = data && data.length > 0 ? data[0].id + 1 : 1;
      setInvoiceId(String(nextId));
      setInvoiceNumber(formatCustomerInvoiceNumber(nextId));
    };

    fetchNextId();

    if (mode !== "edit") {
      setDate(formatDateTime(new Date()));
      clockRef.current = setInterval(() => {
        setIsDateManual((manual) => {
          if (!manual) setDate(formatDateTime(new Date()));
          return manual;
        });
      }, 1000);
    }

    return () => {
      mounted = false;
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [mode, initialInvoice, initialLineItems, user]);

  const recalculateTotals = (
    items: LineItem[],
    discountVal?: string,
    retentionPct?: string
  ) => {
    const d = parseFloat(discountVal ?? discount) || 0;
    const pctStr = retentionPct ?? retentionPercentage;
    const newTotal = items.reduce((s, i) => s + parseFloat(i.amount), 0);
    const newVatTotal = items.reduce(
      (s, i) => s + parseFloat(i.amount) * (i.vat === "VAT 15%" ? 0.15 : 0),
      0
    );
    const newNet = newTotal + newVatTotal - d;
    const retention = calcRetentionAmount(newTotal, d, pctStr);
    const newDue = newNet - retention;
    setTotalAmount(newTotal.toFixed(2));
    setVatAmount(newVatTotal.toFixed(2));
    setNetAmount(newNet.toFixed(2));
    setRetentionAmount(retention.toFixed(2));
    setDueAmount(newDue.toFixed(2));
  };

  const handleRetentionChange = (value: string) => {
    setRetentionPercentage(value);
    recalculateTotals(lineItems, discount, value);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCustomerId(id);
    const found = customers.find((c) => String(c.id) === id);
    setCustomerName(found ? found.name : "");
  };

  const selectedCustomer = customers.find((c) => String(c.id) === customerId) || null;

  const selectableCustomers = customers.filter(
    (c) => c.active || (mode === "edit" && customerId && String(c.id) === customerId)
  );

  const calcLineAmounts = (qty: string, rate: string, vat: string) => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const amount = q * r;
    const vatRate = vat === "VAT 15%" ? 0.15 : 0;
    const total = amount + amount * vatRate;
    return { amount: amount.toFixed(2), total: total.toFixed(2) };
  };

  const handleAddLineItem = () => {
    const descVal = newDesc.trim();
    const qtyVal = newQty.trim();
    const rateVal = newRate.trim();
    if (!descVal) return;
    const { amount, total } = calcLineAmounts(qtyVal, rateVal, newVat);
    const item: LineItem = {
      description: descVal,
      unit: newUnit,
      qty: qtyVal || "0",
      rate: rateVal || "0",
      amount,
      vat: newVat,
      total,
    };
    const updated = [...lineItems, item];
    setLineItems(updated);
    recalculateTotals(updated);
    setNewDesc("");
    setNewQty("");
    setNewRate("");
    setNewUnit("pcs");
    setNewVat("VAT 15%");
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
    recalculateTotals(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditItem(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditItem({ ...lineItems[index] });
  };

  const handleEditChange = (field: keyof LineItem, value: string) => {
    if (!editItem) return;
    const updated = { ...editItem, [field]: value };
    if (field === "qty" || field === "rate" || field === "vat") {
      const { amount, total } = calcLineAmounts(
        field === "qty" ? value : updated.qty,
        field === "rate" ? value : updated.rate,
        field === "vat" ? value : updated.vat
      );
      updated.amount = amount;
      updated.total = total;
    }
    setEditItem(updated);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editItem) return;
    const updated = lineItems.map((item, i) => (i === editingIndex ? editItem : item));
    setLineItems(updated);
    recalculateTotals(updated);
    setEditingIndex(null);
    setEditItem(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditItem(null);
  };

  const filteredItems = lineItems
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => item.description.toLowerCase().includes(lineSearch.toLowerCase()));

  const handleSave = async () => {
    if (!customerName.trim()) {
      setSaveMsg("Customer Name is required before saving invoice.");
      return;
    }
    if (lineItems.length === 0) {
      setSaveMsg("Add at least one line item before saving.");
      return;
    }
    setSaving(true);
    setSaveMsg("");

    const invoicePayload = {
      number: invoiceNumber,
      document_type: documentType,
      date,
      customer_id: customerId ? parseInt(customerId) : null,
      customer_name: customerName,
      payment_terms: paymentTerms,
      description,
      payment_type: paymentType,
      po_number: poNumber,
      project_name: projectName,
      private_note: privateNote,
      retention_percentage: retentionPercentage,
      public_note: publicNote,
      discount: parseFloat(discount) || 0,
      total_amount: parseFloat(totalAmount) || 0,
      vat_amount: parseFloat(vatAmount) || 0,
      net_amount: parseFloat(netAmount) || 0,
      due_amount: parseFloat(dueAmount) || 0,
      advance_adjustment: advanceAdjustment,
    };

    const lineRows = lineItems.map((item) => ({
      description: item.description,
      unit: item.unit,
      qty: parseFloat(item.qty),
      rate: parseFloat(item.rate),
      amount: parseFloat(item.amount),
      vat: item.vat,
      total: parseFloat(item.total),
    }));

    if (mode === "edit" && invoiceId) {
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update(invoicePayload)
        .eq("id", invoiceId);

      if (invoiceError) {
        setSaveMsg("Error updating invoice: " + invoiceError.message);
        setSaving(false);
        return;
      }

      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);

      const { error: lineError } = await supabase
        .from("invoice_line_items")
        .insert(lineRows.map((row) => ({ ...row, invoice_id: parseInt(invoiceId) })));

      if (lineError) {
        setSaveMsg("Invoice updated but line items failed: " + lineError.message);
        setSaving(false);
        return;
      }

      setSaveMsg("Invoice updated successfully.");
      setSaving(false);
      return;
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .insert([invoicePayload])
      .select()
      .single();

    if (invoiceError) {
      setSaveMsg("Error saving invoice: " + invoiceError.message);
      setSaving(false);
      return;
    }

    const { error: lineError } = await supabase
      .from("invoice_line_items")
      .insert(lineRows.map((row) => ({ ...row, invoice_id: invoiceData.id })));

    if (lineError) {
      setSaveMsg("Invoice saved but line items failed: " + lineError.message);
      setSaving(false);
      return;
    }

    setSaveMsg("Invoice saved successfully.");
    setSaving(false);
  };

  // ── AUTH GUARD ──────────────────────────────────────────
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
  // ────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-1 pt-14 overflow-y-auto">
        <div className="p-6 space-y-4">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">Customer Invoice</h1>
              <Link
                href="/billing/customer-invoice"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
              >
                <List size={16} />
                Invoice List
              </Link>
            </div>
            <nav className="text-xs text-blue-600">
              Home /
              <Link href="/billing/customer-invoice" className="hover:underline mx-1">
                Customer Invoice
              </Link> /
              <span className="text-gray-500 ml-1">{mode === "edit" ? "Edit" : "New"}</span>
            </nav>
          </div>

          {/* 1. General Section */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <SectionHeader title="General" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">ID</label>
                <input type="text" value={invoiceId || "Loading..."} disabled className="w-full border border-gray-300 p-1.5 bg-gray-100 text-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Number</label>
                <input type="text" value={invoiceNumber || "Loading..."} disabled className="w-full border border-gray-300 p-1.5 bg-gray-100 text-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Document Type</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full border border-gray-300 p-1.5 text-black text-sm bg-white outline-none">
                  <option>Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Date
                  {isDateManual && (
                    <button
                      onClick={() => { setIsDateManual(false); setDate(formatDateTime(new Date())); }}
                      className="ml-2 text-blue-600 underline text-[10px] font-normal"
                    >
                      Reset to live
                    </button>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setIsDateManual(true); }}
                  className="w-full border border-gray-300 p-1.5 text-black text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* 2. Detail Section */}
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <SectionHeader title="Detail" />
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Customer Name</label>
                  <select value={customerId} onChange={handleCustomerChange} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded outline-none focus:border-blue-500">
                    <option value="">Select Customer</option>
                    {selectableCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{!c.active ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                  {selectableCustomers.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No active customers. Add or activate a customer first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full border border-gray-300 p-1.5 text-black text-sm outline-none">
                    <option value="due_on_receipt">Due Upon Receipt</option>
                    <option value="100_advance">100% Advance</option>
                    <option value="15_days">After 15 Days</option>
                    <option value="30_days">After 30 Days</option>
                    <option value="45_days">After 45 Days</option>
                    <option value="60_days">After 60 Days</option>
                    <option value="90_days">After 90 Days</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1">Description</label>
                  <input type="text" placeholder="Enter description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Payment Type</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full border border-gray-300 p-1.5 text-black text-sm outline-none">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="bank_card">Bank Card</option>
                    <option value="credit">Credit</option>
                    <option value="cash">Cash</option>
                    <option value="not_defined">Not Defined</option>
                  </select>
                </div>
                <div className="col-span-1 hidden lg:block" aria-hidden />
                <div>
                  <label className="block text-xs font-bold mb-1">Purchase Order No.</label>
                  <input type="text" placeholder="Enter PO number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Project Name</label>
                  <input type="text" placeholder="Enter project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Private Note</label>
                  <input type="text" placeholder="Internal note (not shown on invoice)" value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Retention Percentage</label>
                  <select value={retentionPercentage} onChange={(e) => handleRetentionChange(e.target.value)} className="w-full border border-gray-300 p-1.5 text-black text-sm bg-white outline-none">
                    {RETENTION_OPTIONS.map((opt) => (
                      <option key={opt.value || "none"} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {retentionPercentage && parseFloat(retentionPercentage) > 0 && (
                    <p className="mt-1 text-[10px] text-gray-600 leading-snug">
                      {retentionPercentage}% retention from Total Amount (
                      {formatProformaNumber(Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(discount) || 0)))} SR)
                      = {formatProformaNumber(retentionAmount)} SR. Deducted from Net Amount ({formatProformaNumber(netAmount)} SR).
                      Due Amount: {formatProformaNumber(dueAmount)} SR.
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1">Public Note</label>
                  <input type="text" placeholder="Note shown on invoice" value={publicNote} onChange={(e) => setPublicNote(e.target.value)} className="w-full border border-gray-300 p-1.5 text-gray-800 text-sm rounded focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>

            {/* 3. Amount Summary Section */}
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden h-fit">
              <SectionHeader title="Amount" />
              <div className="p-4 space-y-3">
                {[
                  { label: "Discount", value: discount, setter: setDiscount, editable: true },
                  { label: "Total Amount", value: totalAmount, setter: setTotalAmount, editable: false },
                  { label: "Vat Amount", value: vatAmount, setter: setVatAmount, editable: false },
                  { label: "Net Amount", value: netAmount, setter: setNetAmount, editable: false },
                  ...(retentionPercentage && parseFloat(retentionPercentage) > 0
                    ? [{ label: `Retention (${retentionPercentage}% of Total Amount)`, value: retentionAmount, setter: setRetentionAmount, editable: false, prefix: "-" }]
                    : []),
                  { label: "Due Amount", value: dueAmount, setter: setDueAmount, editable: false },
                ].map(({ label, value, setter, editable, prefix }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold mb-1">{label}</label>
                    <div className="flex border border-gray-300">
                      <span className="bg-gray-200 px-2 flex items-center border-r border-gray-300 text-xs font-bold">SR</span>
                      <input
                        type="text"
                        value={prefix ? `${prefix}${value}` : value}
                        readOnly={!editable}
                        onChange={editable ? (e) => { const val = e.target.value; setter(val); if (label === "Discount") recalculateTotals(lineItems, val); } : undefined}
                        className={`w-full p-1 text-right text-sm font-bold outline-none ${editable ? "text-black" : "bg-gray-100 text-gray-700 cursor-not-allowed"}`}
                      />
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-300 pt-3 mt-2">
                  <div className="flex justify-end">
                    <ZatcaQRCodeDisplay
                      sellerName={SELLER_COMPANY.name}
                      vatNumber={SELLER_COMPANY.vatId}
                      invoiceDate={date}
                      totalAmount={netAmount}
                      vatAmount={vatAmount}
                      size={120}
                      showLabel
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Line Items Section */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <SectionHeader title="Line Items" />
            <div className="p-4">
              <div className="flex justify-end mb-2">
                <div className="flex items-center gap-2 text-xs text-black font-bold">
                  Search:
                  <input type="text" value={lineSearch} onChange={(e) => setLineSearch(e.target.value)} className="border border-gray-300 p-1 outline-none font-normal" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-black uppercase font-bold">
                      {["#", "Action", "Description", "Unit", "Qty", "Rate", "Amount", "VAT", "Total"].map((h) => (
                        <th key={h} className="border border-gray-300 p-2 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-black font-medium">No data available in table</td>
                      </tr>
                    ) : (
                      filteredItems.map(({ item, originalIndex }, displayIndex) =>
                        editingIndex === originalIndex && editItem ? (
                          <tr key={originalIndex} className="bg-yellow-50 border-b border-gray-200">
                            <td className="border border-gray-300 p-1 text-center">{displayIndex + 1}</td>
                            <td className="border border-gray-300 p-1">
                              <div className="flex gap-1">
                                <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800" title="Save"><Check size={14} /></button>
                                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700" title="Cancel"><X size={14} /></button>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input type="text" value={editItem.description} onChange={(e) => handleEditChange("description", e.target.value)} className="w-full border border-gray-300 p-0.5 text-xs outline-none min-w-[120px]" />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <select value={editItem.unit} onChange={(e) => handleEditChange("unit", e.target.value)} className="border border-gray-300 p-0.5 text-xs outline-none">
                                <option value="pcs">Pcs</option>
                                <option value="box">Box</option>
                                <option value="mtr">Mtr</option>
                                <option value="floors">Floors</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input type="text" value={editItem.qty} onChange={(e) => handleEditChange("qty", e.target.value)} className="w-16 border border-gray-300 p-0.5 text-xs outline-none" />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input type="text" value={editItem.rate} onChange={(e) => handleEditChange("rate", e.target.value)} className="w-20 border border-gray-300 p-0.5 text-xs outline-none" />
                            </td>
                            <td className="border border-gray-300 p-1 text-right font-medium">{editItem.amount}</td>
                            <td className="border border-gray-300 p-1">
                              <select value={editItem.vat} onChange={(e) => handleEditChange("vat", e.target.value)} className="border border-gray-300 p-0.5 text-xs outline-none">
                                <option>VAT 15%</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 p-1 text-right font-medium">{editItem.total}</td>
                          </tr>
                        ) : (
                          <tr key={originalIndex} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="border border-gray-300 p-2">{displayIndex + 1}</td>
                            <td className="border border-gray-300 p-2">
                              <div className="flex gap-2">
                                <button onClick={() => handleStartEdit(originalIndex)} className="text-blue-600 hover:text-blue-800" title="Edit"><Pencil size={13} /></button>
                                <button onClick={() => handleRemoveLineItem(originalIndex)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 size={13} /></button>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">{item.description}</td>
                            <td className="border border-gray-300 p-2">{item.unit}</td>
                            <td className="border border-gray-300 p-2">{item.qty}</td>
                            <td className="border border-gray-300 p-2">{item.rate}</td>
                            <td className="border border-gray-300 p-2 text-right">{item.amount}</td>
                            <td className="border border-gray-300 p-2">{item.vat}</td>
                            <td className="border border-gray-300 p-2 text-right font-bold">{item.total}</td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-700">
                      <input type="radio" name="itemType" checked={itemType === "presaved"} onChange={() => setItemType("presaved")} disabled className="opacity-50" /> Pre Saved Items
                    </label>
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-700">
                      <input type="radio" name="itemType" checked={itemType === "free"} onChange={() => setItemType("free")} /> Free Line Item
                    </label>
                  </div>
                  <textarea
                    placeholder="Description (required)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className={`w-full border p-2 h-24 text-sm text-gray-800 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${newDesc ? "border-blue-400" : "border-gray-300"}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold">Unit</label>
                    <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full border border-gray-300 p-1 text-sm text-black outline-none">
                      <option value="pcs">Pcs</option>
                      <option value="box">Box</option>
                      <option value="mtr">Mtr</option>
                      <option value="floors">Floors</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold">Qty</label>
                    <input type="text" placeholder="Qty Enter" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-full border border-gray-300 p-1 text-sm text-black outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold">Rate</label>
                    <div className="flex border border-gray-300">
                      <span className="bg-gray-200 px-2 border-r border-gray-300 text-xs flex items-center font-bold">SR</span>
                      <input type="text" placeholder="0.00" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-full p-1 text-sm text-black outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold">VAT</label>
                    <select value={newVat} onChange={(e) => setNewVat(e.target.value)} className="w-full border border-gray-300 p-1 text-sm text-black outline-none">
                      <option>VAT 15%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button onClick={handleAddLineItem} className="bg-blue-600 text-white text-sm px-5 py-1.5 rounded font-medium shadow-sm hover:bg-blue-700 transition-colors">
                  Add Line Item
                </button>
              </div>
            </div>
          </div>

          {/* Save message */}
          {saveMsg && (
            <div className={`text-sm font-medium px-4 py-3 rounded border ${
              saveMsg.includes("Error") || saveMsg.includes("failed") || saveMsg.includes("required")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {saveMsg}
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex flex-wrap gap-3 py-2">
            <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving..." : mode === "edit" ? "Update Invoice" : "Save Invoice"}
            </button>
            <button onClick={() => handlePrintProforma()} className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded text-sm font-medium shadow-sm hover:bg-blue-50 transition-colors">
              Print Invoice
            </button>
          </div>

        </div>
      </main>

      <div aria-hidden style={{ position: "fixed", left: "-10000px", top: 0, zIndex: -1 }}>
        <ProformaInvoicePrint
          ref={printRef}
          variant="tax"
          data={{
            invoiceNumber,
            date,
            paymentTerms,
            description,
            poNumber,
            projectName,
            publicNote,
            discount,
            totalAmount,
            vatAmount,
            netAmount,
            retentionPercentage,
            retentionAmount,
            dueAmount,
            lineItems,
            customer: selectedCustomer || (customerName ? { name: customerName } : null),
          }}
        />
      </div>
    </div>
  );
}