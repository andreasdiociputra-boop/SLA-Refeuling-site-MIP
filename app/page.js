"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured) {
      // Mode demo: belum ada Supabase, langsung masuk sebagai fuelman demo
      localStorage.setItem("demo_role", "fuelman");
      router.push("/fuelman");
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // Menampilkan pesan asli dari Supabase supaya mudah tahu penyebabnya:
      // - "Invalid login credentials" = email/password salah, ATAU user belum di-confirm
      // - "Email not confirmed" = user belum klik konfirmasi / belum di-auto-confirm
      setError(`Login gagal: ${loginError.message}`);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError("Login gagal: tidak ada data user yang dikembalikan.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      setError(`Login berhasil, tapi gagal ambil data profil: ${profileError.message}`);
      setLoading(false);
      return;
    }

    if (!profile) {
      setError(
        "Login berhasil, tapi belum ada data di tabel 'profiles' untuk user ini. Tambahkan row di Supabase Table Editor > profiles dengan id = " +
          data.user.id
      );
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.push("/dashboard");
    } else {
      router.push("/fuelman");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            ⛽
          </div>
          <h1 className="text-xl font-bold text-gray-800">Refueling & SLA Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {!isSupabaseConfigured && (
            <p className="text-xs bg-yellow-50 text-yellow-800 rounded-lg p-3">
              Mode demo aktif (Supabase belum disetup). Klik "Masuk" untuk mencoba alur fuelman.
            </p>
          )}
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="w-full mt-1 border rounded-xl px-3 py-2 outline-brand"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              className="w-full mt-1 border rounded-xl px-3 py-2 outline-brand"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
