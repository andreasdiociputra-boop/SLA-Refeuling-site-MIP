"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import DashboardNav from "@/components/DashboardNav";

const DEMO_PENDING = [
  { unit_no: "HD-102", wo_number: "WO-PITA-01", area: "Pit A", minutes_waiting: 45 },
  { unit_no: "HD-103", wo_number: "WO-PITA-01", area: "Pit A", minutes_waiting: 130 },
  { unit_no: "EX-205", wo_number: "WO-PITB-01", area: "Pit B", minutes_waiting: 20 },
];

export default function MonitoringPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setPending(DEMO_PENDING);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("wo_units")
        .select("id, status, created_at:work_orders(created_at), units(unit_no), work_orders(wo_number, areas(name))")
        .in("status", ["pending", "jalan_tidak_ready", "unit_tidak_reposisi"]);

      setPending(
        (data || []).map((row) => ({
          unit_no: row.units?.unit_no,
          wo_number: row.work_orders?.wo_number,
          area: row.work_orders?.areas?.name,
          minutes_waiting: null,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex">
      <DashboardNav />
      <main className="flex-1 p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Monitoring Unit Belum Terisi</h1>
        <p className="text-sm text-gray-500 mb-6">
          Daftar unit yang belum selesai diisi (pending, jalan tidak ready, atau tidak reposisi)
        </p>

        {!isSupabaseConfigured && (
          <p className="text-xs bg-yellow-50 text-yellow-800 rounded-lg p-3 mb-6 inline-block">
            Menampilkan DATA DEMO — hubungkan Supabase untuk data sungguhan.
          </p>
        )}

        <div className="card">
          {loading ? (
            <p className="text-sm text-gray-400">Memuat data...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-green-600">🎉 Semua unit sudah terisi!</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">No Unit</th>
                  <th>Work Order</th>
                  <th>Area</th>
                  <th>Menunggu (menit)</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-800">{p.unit_no}</td>
                    <td>{p.wo_number}</td>
                    <td>{p.area}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          p.minutes_waiting > 90
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {p.minutes_waiting ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
