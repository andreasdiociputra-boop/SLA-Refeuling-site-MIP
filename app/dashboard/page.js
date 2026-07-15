"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import DashboardNav from "@/components/DashboardNav";

const DEMO_WOS = [
  { id: 1, wo_number: "WO-PITA-01", area: "Pit A", target_minutes: 120, created_at: new Date(Date.now() - 60 * 60000).toISOString(), units: [
    { status: "fuel_aman", updated_at: new Date(Date.now() - 40 * 60000).toISOString() },
    { status: "pending", updated_at: null },
    { status: "refueling", updated_at: null },
  ]},
  { id: 2, wo_number: "WO-PITB-01", area: "Pit B", target_minutes: 90, created_at: new Date(Date.now() - 150 * 60000).toISOString(), units: [
    { status: "fuel_aman", updated_at: new Date(Date.now() - 100 * 60000).toISOString() },
    { status: "fuel_aman", updated_at: new Date(Date.now() - 130 * 60000).toISOString() },
  ]},
];

function computeSLA(wo) {
  const total = wo.units.length;
  const completed = wo.units.filter((u) => u.status !== "pending" && u.status !== "refueling").length;
  const onTimeDeadline = new Date(wo.created_at).getTime() + wo.target_minutes * 60000;
  const onTime = wo.units.filter(
    (u) => u.updated_at && new Date(u.updated_at).getTime() <= onTimeDeadline && u.status === "fuel_aman"
  ).length;
  return {
    total,
    completed,
    completionPct: total ? Math.round((completed / total) * 100) : 0,
    slaPct: total ? Math.round((onTime / total) * 100) : 0,
  };
}

export default function DashboardPage() {
  const [wos, setWos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setWos(DEMO_WOS);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("work_orders")
        .select("id, wo_number, target_minutes, created_at, areas(name), wo_units(status, updated_at)");

      setWos(
        (data || []).map((wo) => ({
          id: wo.id,
          wo_number: wo.wo_number,
          area: wo.areas?.name,
          target_minutes: wo.target_minutes,
          created_at: wo.created_at,
          units: wo.wo_units || [],
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const overallSLA = wos.length
    ? Math.round(wos.reduce((acc, wo) => acc + computeSLA(wo).slaPct, 0) / wos.length)
    : 0;

  return (
    <div className="flex">
      <DashboardNav />
      <main className="flex-1 p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Pencapaian SLA Refueling</h1>
        <p className="text-sm text-gray-500 mb-6">Ringkasan performa pengisian bahan bakar per Work Order</p>

        {!isSupabaseConfigured && (
          <p className="text-xs bg-yellow-50 text-yellow-800 rounded-lg p-3 mb-6 inline-block">
            Menampilkan DATA DEMO — hubungkan Supabase untuk data sungguhan.
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500">Overall SLA</p>
            <p className="text-3xl font-bold text-brand mt-1">{overallSLA}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Work Order Aktif</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{wos.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Unit Dipantau</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {wos.reduce((acc, wo) => acc + wo.units.length, 0)}
            </p>
          </div>
        </div>

        <div className="card">
          <p className="font-semibold text-gray-700 mb-4">Detail per Work Order</p>
          {loading ? (
            <p className="text-sm text-gray-400">Memuat data...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Work Order</th>
                  <th>Area</th>
                  <th>Target (menit)</th>
                  <th>Selesai</th>
                  <th>SLA %</th>
                </tr>
              </thead>
              <tbody>
                {wos.map((wo) => {
                  const s = computeSLA(wo);
                  return (
                    <tr key={wo.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-800">{wo.wo_number}</td>
                      <td>{wo.area}</td>
                      <td>{wo.target_minutes}</td>
                      <td>
                        {s.completed}/{s.total}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            s.slaPct >= 90
                              ? "bg-green-100 text-green-700"
                              : s.slaPct >= 70
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.slaPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
