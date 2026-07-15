import "./globals.css";

export const metadata = {
  title: "Refueling SLA Monitoring",
  description: "Aplikasi input refueling & dashboard monitoring SLA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
