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


    setIsSaving(true);
    setStatusMsg("");
    setStatusType("");


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
      const { error } = await supabase
        .from("customers")
        .insert([payload]);

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
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-700">
      <Navbar   />

      <main className="flex-1 pt-14 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                {mode === "edit" ? "Edit Customer" : "New Customer"}
              </h1>
              <Link
                href="/customer"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors shadow-sm"
              >
                <List size={16} />
                Customer List
              </Link>
            </div>
            <div className="text-xs text-blue-600">
              Home /{" "}
              <span className="text-gray-500">
                {mode === "edit" ? "Edit Customer" : "New Customer"}
              </span>
            </div>
          </div>

          <div className="space-y-4 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* General Info */}
              <div className="lg:col-span-2 bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm">
                  <span className="font-medium">General Information</span>
                  <div className="flex gap-2 items-center text-[10px]">
                    {mode === "edit" && customerId && (
                      <span className="bg-white/20 px-2 py-0.5 rounded">ID: {customerId}</span>
                    )}
                    <button
                      type="button"
                      onClick={toggleActive}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        formData.active ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"
                      }`}
                      title="Click to toggle status"
                    >
                      {formData.active ? "Active" : "Inactive"}
                    </button>
                    <Minus size={14}/>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">ID</label>
                    <input
                      disabled
                      value={mode === "edit" && customerId ? customerId : ""}
                      placeholder="Auto-generated"
                      className="w-full border bg-gray-50 p-2 text-sm rounded cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">Third Party Type</label>
                    <select className="w-full border p-2 text-sm rounded outline-none"><option>Customer</option></select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold block mb-1 uppercase text-gray-500">Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Name Enter" className="w-full border p-2 text-sm rounded outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Picture Section */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm">
                  <span className="font-medium">Picture</span>
                  <div className="flex gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-green-600 p-1 rounded hover:bg-green-700"><Upload size={14}/></button>
                    <button type="button" onClick={() => {setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value="";}} className="bg-red-600 p-1 rounded hover:bg-red-700"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="p-6 flex justify-center">
                  <div className="w-32 h-40 bg-gray-50 border-2 border-dashed rounded overflow-hidden flex flex-col items-center justify-center text-gray-400">
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
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

            {/* Contact & Address Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Info Card */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                  <span>Contact Information</span>
                  <Minus size={14}/>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { l: "Full Name", n: "name" },
                    { l: "Alias Name", n: "alias_name" },
                    { l: "Mobile Number", n: "mobile" },
                    { l: "Phone Number", n: "phone" },
                    { l: "Email Address", n: "email" },
                    { l: "Website", n: "website" }
                  ].map(field => (
                    <div key={field.n}>
                      <label className="text-xs font-bold block mb-1 uppercase text-gray-500">{field.l}</label>
                      <input name={field.n} value={formData[field.n as keyof typeof formData] as string} onChange={handleInputChange} placeholder={`${field.l} Enter`} className="w-full border p-2 text-sm rounded outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* National Address Card */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                  <span>National Address</span>
                  <Minus size={14}/>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { l: "Building Number", n: "building_no" },
                    { l: "Street Name", n: "street" },
                    { l: "District Name", n: "district" },
                    { l: "Second Number", n: "second_no" },
                    { l: "Postal Code", n: "postal_code" }
                  ].map(field => (
                    <div key={field.n}>
                      <label className="text-xs font-bold block mb-1 uppercase text-gray-500">{field.l}</label>
                      <input name={field.n} value={formData[field.n as keyof typeof formData] as string} onChange={handleInputChange} placeholder={`${field.l} Enter`} className="w-full border p-2 text-sm rounded outline-none" />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold block mb-1 uppercase text-gray-500">City</label><input name="city" value={formData.city} onChange={handleInputChange} placeholder="City Enter" className="w-full border p-2 text-sm rounded outline-none" /></div>
                    <div><label className="text-xs font-bold block mb-1 uppercase text-gray-500">Country</label><input name="country" value={formData.country} onChange={handleInputChange} placeholder="Country Enter" className="w-full border p-2 text-sm rounded outline-none" /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Info Section */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white p-2 px-4 flex justify-between items-center text-sm font-medium">
                <span>Other Information</span>
                <Minus size={14}/>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold block mb-1 uppercase text-gray-500">VAT Number</label><input name="vat_no" value={formData.vat_no} onChange={handleInputChange} placeholder="VAT Number Enter" className="w-full border p-2 text-sm rounded outline-none" /></div>
                <div><label className="text-xs font-bold block mb-1 uppercase text-gray-500">Other ID</label><input name="other_id" value={formData.other_id} onChange={handleInputChange} placeholder="Other ID Enter" className="w-full border p-2 text-sm rounded outline-none" /></div>
              </div>
            </div>

            {/* Action Buttons */}
            {statusMsg && (
              <div className={`text-sm font-medium px-4 py-3 rounded border ${
                statusType === "error"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}>
                {statusMsg}
              </div>
            )}

            <div className="bg-white p-4 border rounded shadow-sm flex items-center gap-3">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className={`bg-blue-600 text-white px-10 py-2 rounded text-sm font-bold shadow-md transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'}`}
              >
                {isSaving ? "Saving..." : mode === "edit" ? "Update Customer" : "Save Customer"}
              </button>
              <button onClick={() => router.push("/customer")} className="bg-gray-500 text-white px-6 py-2 rounded text-sm font-bold hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}