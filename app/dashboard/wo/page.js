"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import DashboardNav from "@/components/DashboardNav";

// Format Excel yang diharapkan: kolom "No Unit" dan kolom "Area"
export default function WorkOrderPage() {
  const [preview, setPreview] = useState(null); // { areaName: [unitNo, ...] }
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setMessage("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Cari nama kolom secara fleksibel (tidak case-sensitive)
      const grouped = {};
      rows.forEach((row) => {
        const keys = Object.keys(row);
        const unitKey = keys.find((k) => k.toLowerCase().includes("unit"));
        const areaKey = keys.find((k) => k.toLowerCase().includes("area"));
        const unitNo = String(row[unitKey] || "").trim();
        const area = String(row[areaKey] || "Tanpa Area").trim();
        if (!unitNo) return;
        if (!grouped[area]) grouped[area] = [];
        grouped[area].push(unitNo);
      });

      setPreview(grouped);
    };
    reader.readAsBinaryString(file);
  }

  async function createWorkOrders() {
    if (!preview) return;
    setCreating(true);
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage(
        `Mode demo: ${Object.keys(preview).length} Work Order akan dibuat (belum tersimpan karena Supabase belum disetup).`
      );
      setCreating(false);
      return;
    }

    try {
      for (const [areaName, unitNos] of Object.entries(preview)) {
        // 1. Pastikan area ada
        let { data: area } = await supabase.from("areas").select("id").eq("name", areaName).maybeSingle();
        if (!area) {
          const { data: newArea } = await supabase.from("areas").insert({ name: areaName }).select().single();
          area = newArea;
        }

        // 2. Buat Work Order untuk area ini
        const woNumber = `WO-${areaName.replace(/\s+/g, "").toUpperCase()}-${Date.now()}`;
        const { data: wo } = await supabase
          .from("work_orders")
          .insert({ wo_number: woNumber, area_id: area.id, status: "open" })
          .select()
          .single();

        // 3. Pastikan setiap unit ada, lalu masukkan ke wo_units
        for (const unitNo of unitNos) {
          let { data: unit } = await supabase.from("units").select("id").eq("unit_no", unitNo).maybeSingle();
          if (!unit) {
            const { data: newUnit } = await supabase
              .from("units")
              .insert({ unit_no: unitNo, area_id: area.id })
              .select()
              .single();
            unit = newUnit;
          }
          await supabase.from("wo_units").insert({ wo_id: wo.id, unit_id: unit.id, status: "pending" });
        }
      }
      setMessage(`Berhasil! ${Object.keys(preview).length} Work Order dibuat dan dikelompokkan per area.`);
      setPreview(null);
    } catch (err) {
      setMessage("Terjadi kesalahan saat membuat Work Order: " + err.message);
    }
    setCreating(false);
  }

  return (
    <div className="flex">
      <DashboardNav />
      <main className="flex-1 p-8 max-w-3xl">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Work Order Digital</h1>
        <p className="text-sm text-gray-500 mb-6">
          Upload file Excel berisi kolom <b>No Unit</b> dan <b>Area</b>. Sistem akan otomatis
          mengelompokkan unit menjadi beberapa Work Order sesuai areanya masing-masing.
        </p>

        <div className="card mb-6">
          <label className="block">
            <span className="text-sm font-medium text-gray-600">Pilih file Excel (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="block w-full mt-2 text-sm"
            />
          </label>
          {fileName && <p className="text-xs text-gray-400 mt-2">File: {fileName}</p>}
        </div>

        {preview && (
          <div className="card mb-6">
            <p className="font-semibold text-gray-700 mb-3">
              Preview pengelompokan ({Object.keys(preview).length} Work Order akan dibuat)
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(preview).map(([area, unitNos]) => (
                <div key={area} className="border rounded-xl p-3">
                  <p className="font-medium text-gray-800">
                    {area} <span className="text-gray-400 text-xs">({unitNos.length} unit)</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{unitNos.join(", ")}</p>
                </div>
              ))}
            </div>
            <button onClick={createWorkOrders} disabled={creating} className="btn-primary mt-4">
              {creating ? "Membuat Work Order..." : "Buat Work Order Sekarang"}
            </button>
          </div>
        )}

        {message && <p className="text-sm bg-green-50 text-green-700 rounded-lg p-3">{message}</p>}
      </main>
    </div>
  );
}
