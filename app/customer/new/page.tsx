"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/hooks/useAuth";
import Navbar from "../../components/Navbar";
import { Upload, Trash2, Minus, Users, List } from "lucide-react";
import Link from "next/link";

interface CustomerFormProps {
  mode?: "create" | "edit";
  customerId?: string;
  initialCustomer?: Record<string, unknown> | null;
}

const initialState = {
  name: "",
  alias_name: "",
  mobile: "",
  phone: "",
  email: "",
  website: "",
  building_no: "",
  street: "",
  district: "",
  second_no: "",
  postal_code: "",
  city: "",
  country: "",
  vat_no: "",
  other_id: "",
  image_url: "",
  active: true,
};

export default function CustomerForm({
  mode = "create",
  customerId = "",
  initialCustomer = null,
}: CustomerFormProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [vatError, setVatError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (!user) return;
    if (mode === "edit" && initialCustomer) {
      setFormData({
        name: String(initialCustomer.name ?? ""),
        alias_name: String(initialCustomer.alias_name ?? ""),
        mobile: String(initialCustomer.mobile ?? ""),
        phone: String(initialCustomer.phone ?? ""),
        email: String(initialCustomer.email ?? ""),
        website: String(initialCustomer.website ?? ""),
        building_no: String(initialCustomer.building_no ?? ""),
        street: String(initialCustomer.street ?? ""),
        district: String(initialCustomer.district ?? ""),
        second_no: String(initialCustomer.second_no ?? ""),
        postal_code: String(initialCustomer.postal_code ?? ""),
        city: String(initialCustomer.city ?? ""),
        country: String(initialCustomer.country ?? ""),
        vat_no: String(initialCustomer.vat_no ?? ""),
        other_id: String(initialCustomer.other_id ?? ""),
        image_url: String(initialCustomer.image_url ?? ""),
        active: Boolean(initialCustomer.active ?? true),
      });
      if (initialCustomer.image_url) {
        setPreviewUrl(String(initialCustomer.image_url));
      }
    }
  }, [mode, initialCustomer, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "vat_no") {
      const digits = value.replace(/\D/g, "");
      if (value && !/^\d+$/.test(value)) {
        setVatError("VAT Number must contain digits only.");
      } else if (digits.length > 0 && digits.length !== 15) {
        setVatError(`${digits.length}/15 digits entered.`);
      } else if (digits.length === 15) {
        setVatError("");
      } else {
        setVatError("");
      }
    }
  };

  const toggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `customer_avatars/${fileName}`;

    const { error } = await supabase.storage
      .from("customer-pics")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("customer-pics")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setStatusType("error");
      setStatusMsg("Customer name is required.");
      return;
    }

    if (!formData.vat_no.trim()) {
      setStatusType("error");
      setStatusMsg("VAT Number is required.");
      setVatError("VAT Number is required.");
      return;
    }

    if (!/^\d{15}$/.test(formData.vat_no.trim())) {
      setStatusType("error");
      setStatusMsg(
        `VAT Number must be exactly 15 digits. Currently ${formData.vat_no.trim().length} digit(s) entered.`
      );
      setVatError(
        `Must be exactly 15 digits. (${formData.vat_no.trim().length} entered)`
      );
      return;
    }

    setIsSaving(true);
    setStatusMsg("");
    setStatusType("");
    setVatError("");

    try {
      let finalImageUrl = formData.image_url;

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        finalImageUrl = await uploadImage(file);
      }

      const payload = { ...formData, image_url: finalImageUrl };

      if (mode === "edit" && customerId) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", customerId);

        if (error) throw error;

        setStatusType("success");
        setStatusMsg("Customer updated successfully.");
        setTimeout(() => router.push("/customer"), 1200);
        return;
      }

      const { error } = await supabase.from("customers").insert([payload]);
      if (error) throw error;

      setStatusType("success");
      setStatusMsg("Customer saved successfully.");
      setFormData(initialState);
      setPreviewUrl(null);
      setTimeout(() => router.push("/customer"), 1200);
    } catch (error: any) {
      setStatusType("error");
      setStatusMsg("Error saving customer: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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

  // ── Reusable field renderer ──
  const Field = ({
    label,
    name,
    placeholder,
    required,
    extra,
  }: {
    label: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    extra?: React.ReactNode;
  }) => (
    <div>
      <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        value={formData[name as keyof typeof formData] as string}
        onChange={handleInputChange}
        placeholder={placeholder ?? `${label} Enter`}
        className="w-full border p-2 text-sm rounded outline-none focus:border-blue-500"
      />
      {extra}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-700">
      <Navbar />

      <main className="flex-1 pt-14 overflow-y-auto min-w-0">
        <div className="p-3 sm:p-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {mode === "edit" ? "Edit Customer" : "New Customer"}
              </h1>
              <Link
                href="/customer"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors shadow-sm"
              >
                <List size={15} />
                Customer List
              </Link>
            </div>
            <div className="text-xs text-blue-600 self-start sm:self-auto">
              Home /{" "}
              <span className="text-gray-500">
                {mode === "edit" ? "Edit Customer" : "New Customer"}
              </span>
            </div>
          </div>

          <div className="space-y-4 pb-10">

            {/* ── Row 1: General Info + Picture ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* General Information */}
              <div className="lg:col-span-2 bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm">
                  <span className="font-medium">General Information</span>
                  <div className="flex gap-2 items-center text-[10px]">
                    {mode === "edit" && customerId && (
                      <span className="bg-white/20 px-2 py-0.5 rounded">
                        ID: {customerId}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={toggleActive}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        formData.active
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }`}
                      title="Click to toggle status"
                    >
                      {formData.active ? "Active" : "Inactive"}
                    </button>
                    <Minus size={14} />
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ID */}
                  <div>
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
                      ID
                    </label>
                    <input
                      disabled
                      value={
                        mode === "edit" && customerId ? customerId : ""
                      }
                      placeholder="Auto-generated"
                      className="w-full border bg-gray-50 p-2 text-sm rounded cursor-not-allowed"
                    />
                  </div>

                  {/* Third Party Type */}
                  <div>
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
                      Third Party Type
                    </label>
                    <select className="w-full border p-2 text-sm rounded outline-none">
                      <option>Customer</option>
                    </select>
                  </div>

                  {/* Name — full width */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
                      Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Name Enter"
                      className="w-full border p-2 text-sm rounded outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Picture */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm">
                  <span className="font-medium">Picture</span>
                  <div className="flex gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-green-600 p-1 rounded hover:bg-green-700"
                      title="Upload photo"
                    >
                      <Upload size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="bg-red-600 p-1 rounded hover:bg-red-700"
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-6 flex justify-center">
                  <div className="w-32 h-40 bg-gray-50 border-2 border-dashed rounded overflow-hidden flex flex-col items-center justify-center text-gray-400">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <>
                        <Users size={40} strokeWidth={1} />
                        <span className="text-[10px] mt-2">No Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 2: Contact + National Address ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Contact Information */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                  <span>Contact Information</span>
                  <Minus size={14} />
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { l: "Full Name", n: "name" },
                    { l: "Alias Name", n: "alias_name" },
                    { l: "Mobile Number", n: "mobile" },
                    { l: "Phone Number", n: "phone" },
                    { l: "Email Address", n: "email" },
                    { l: "Website", n: "website" },
                  ].map((field) => (
                    <Field
                      key={field.n}
                      label={field.l}
                      name={field.n}
                    />
                  ))}
                </div>
              </div>

              {/* National Address */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                  <span>National Address</span>
                  <Minus size={14} />
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { l: "Building Number", n: "building_no" },
                    { l: "Street Name", n: "street" },
                    { l: "District Name", n: "district" },
                    { l: "Second Number", n: "second_no" },
                    { l: "Postal Code", n: "postal_code" },
                  ].map((field) => (
                    <Field
                      key={field.n}
                      label={field.l}
                      name={field.n}
                    />
                  ))}

                  {/* City + Country side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" name="city" />
                    <Field label="Country" name="country" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 3: Other Information ── */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                <span>Other Information</span>
                <Minus size={14} />
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VAT Number */}
                <div>
                  <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
                    VAT Number{" "}
                    <span className="text-red-500">*</span>
                    <span className="ml-2 normal-case font-normal text-gray-400">
                      (exactly 15 digits)
                    </span>
                  </label>
                  <input
                    name="vat_no"
                    value={formData.vat_no}
                    onChange={handleInputChange}
                    placeholder="Enter 15-digit VAT Number"
                    maxLength={15}
                    inputMode="numeric"
                    className={`w-full border p-2 text-sm rounded outline-none transition-colors ${
                      vatError
                        ? "border-red-400 bg-red-50 focus:border-red-500"
                        : formData.vat_no.length === 15
                        ? "border-green-400 bg-green-50 focus:border-green-500"
                        : "focus:border-blue-500"
                    }`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {vatError ? (
                      <p className="text-xs text-red-500">{vatError}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Numbers only</p>
                    )}
                    <span
                      className={`text-xs font-medium ${
                        formData.vat_no.length === 15
                          ? "text-green-600"
                          : formData.vat_no.length > 0
                          ? "text-orange-500"
                          : "text-gray-400"
                      }`}
                    >
                      {formData.vat_no.length}/15
                    </span>
                  </div>
                </div>

                {/* Other ID */}
                <div>
                  <label className="text-xs font-bold block mb-1 uppercase text-gray-500">
                    Other ID
                  </label>
                  <input
                    name="other_id"
                    value={formData.other_id}
                    onChange={handleInputChange}
                    placeholder="Other ID Enter"
                    className="w-full border p-2 text-sm rounded outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* ── Status Message ── */}
            {statusMsg && (
              <div
                className={`text-sm font-medium px-4 py-3 rounded border ${
                  statusType === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {statusMsg}
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="bg-white p-4 border rounded shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-blue-600 text-white px-8 sm:px-10 py-2.5 sm:py-2 rounded text-sm font-bold shadow-md transition-all w-full sm:w-auto ${
                  isSaving
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 active:scale-95"
                }`}
              >
                {isSaving
                  ? "Saving..."
                  : mode === "edit"
                  ? "Update Customer"
                  : "Save Customer"}
              </button>
              <button
                onClick={() => router.push("/customer")}
                className="bg-gray-500 text-white px-6 py-2.5 sm:py-2 rounded text-sm font-bold hover:bg-gray-600 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}