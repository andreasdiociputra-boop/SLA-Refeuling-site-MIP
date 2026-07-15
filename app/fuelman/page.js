"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const STATUS_OPTIONS = [
  { value: "refueling", label: "Refueling", color: "bg-blue-500" },
  { value: "fuel_aman", label: "Fuel Aman", color: "bg-green-500" },
  { value: "unit_bd", label: "Unit BD", color: "bg-red-500" },
  { value: "jalan_tidak_ready", label: "Jalan Tidak Ready", color: "bg-yellow-500" },
  { value: "unit_tidak_reposisi", label: "Unit Tidak Reposisi", color: "bg-orange-500" },
];

// Data contoh dipakai HANYA jika Supabase belum disetup (mode demo)
const DEMO_TRUCKS = [{ id: 1, code: "FT-01", name: "Fuel Truck 01" }, { id: 2, code: "FT-02", name: "Fuel Truck 02" }];
const DEMO_WO = [{ id: 1, wo_number: "WO-PITA-01", area: "Pit A" }, { id: 2, wo_number: "WO-PITB-01", area: "Pit B" }];
const DEMO_UNITS = [
  { id: 1, unit_no: "HD-101", status: "pending" },
  { id: 2, unit_no: "HD-102", status: "pending" },
  { id: 3, unit_no: "EX-201", status: "fuel_aman" },
];

export default function FuelmanPage() {
  const [step, setStep] = useState(1); // 1: truck, 2: WO, 3: list unit, 4: pilih status
  const [trucks, setTrucks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedWO, setSelectedWO] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTrucks() {
      if (!isSupabaseConfigured) {
        setTrucks(DEMO_TRUCKS);
        return;
      }
      const { data } = await supabase.from("fuel_trucks").select("*").eq("is_active", true);
      setTrucks(data || []);
    }
    loadTrucks();
  }, []);

  async function loadWorkOrders() {
    if (!isSupabaseConfigured) {
      setWorkOrders(DEMO_WO);
      return;
    }
    const { data } = await supabase
      .from("work_orders")
      .select("id, wo_number, areas(name)")
      .eq("status", "open");
    setWorkOrders((data || []).map((wo) => ({ id: wo.id, wo_number: wo.wo_number, area: wo.areas?.name })));
  }

  async function loadUnits(woId) {
    if (!isSupabaseConfigured) {
      setUnits(DEMO_UNITS);
      return;
    }
    const { data } = await supabase
      .from("wo_units")
      .select("id, status, units(unit_no)")
      .eq("wo_id", woId);
    setUnits((data || []).map((u) => ({ id: u.id, unit_no: u.units?.unit_no, status: u.status })));
  }

  async function saveStatus(status) {
    setSaving(true);
    if (isSupabaseConfigured) {
      const { data: authData } = await supabase.auth.getUser();
      await supabase
        .from("wo_units")
        .update({
          status,
          truck_id: selectedTruck.id,
          updated_by: authData?.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUnit.id);

      await supabase.from("refueling_logs").insert({
        wo_unit_id: selectedUnit.id,
        status,
        truck_id: selectedTruck.id,
        created_by: authData?.user?.id,
      });

      await loadUnits(selectedWO.id);
    } else {
      // mode demo: update state lokal saja
      setUnits((prev) => prev.map((u) => (u.id === selectedUnit.id ? { ...u, status } : u)));
    }
    setSaving(false);
    setSelectedUnit(null);
    setStep(3);
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 py-6 pb-24">
      <header className="mb-5">
        <h1 className="text-lg font-bold text-gray-800">Input Refueling</h1>
        <p className="text-sm text-gray-500">
          {selectedTruck ? `Truck: ${selectedTruck.code}` : "Pilih fuel truck untuk memulai"}
          {selectedWO ? ` • Lokasi: ${selectedWO.wo_number}` : ""}
        </p>
      </header>

      {/* STEP 1: PILIH FUEL TRUCK */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">Pilih Fuel Truck</p>
          {trucks.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTruck(t);
                loadWorkOrders();
                setStep(2);
              }}
              className="card w-full text-left flex items-center justify-between"
            >
              <span className="font-semibold text-gray-800">{t.code}</span>
              <span className="text-sm text-gray-500">{t.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: PILIH WORK ORDER / LOKASI */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">Pilih Lokasi (Work Order)</p>
          {workOrders.map((wo) => (
            <button
              key={wo.id}
              onClick={() => {
                setSelectedWO(wo);
                loadUnits(wo.id);
                setStep(3);
              }}
              className="card w-full text-left flex items-center justify-between"
            >
              <span className="font-semibold text-gray-800">{wo.wo_number}</span>
              <span className="text-sm text-gray-500">{wo.area}</span>
            </button>
          ))}
          <button className="btn-secondary w-full" onClick={() => setStep(1)}>
            ← Kembali
          </button>
        </div>
      )}

      {/* STEP 3: LIST UNIT DALAM WO */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">Pilih Unit</p>
          {units.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUnit(u);
                setStep(4);
              }}
              className="card w-full text-left flex items-center justify-between"
            >
              <span className="font-semibold text-gray-800">{u.unit_no}</span>
              <span className={`text-xs px-2 py-1 rounded-full status-${u.status}`}>
                {u.status.replaceAll("_", " ")}
              </span>
            </button>
          ))}
          <button className="btn-secondary w-full" onClick={() => setStep(2)}>
            ← Kembali
          </button>
        </div>
      )}

      {/* STEP 4: PILIH STATUS UNIT */}
      {step === 4 && selectedUnit && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">
            Update Status untuk unit <span className="font-bold">{selectedUnit.unit_no}</span>
          </p>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              disabled={saving}
              onClick={() => saveStatus(s.value)}
              className={`w-full text-white font-medium rounded-xl px-4 py-4 active:scale-95 transition ${s.color}`}
            >
              {s.label}
            </button>
          ))}
          <button className="btn-secondary w-full" onClick={() => setStep(3)}>
            ← Batal
          </button>
        </div>
      )}
    </div>
  );
}
