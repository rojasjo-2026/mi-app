import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import GlobalTopBar from "@/components/layout/GlobalTopBar";
import BottomStatusBar from "@/components/layout/BottomStatusBar";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-slate-100 text-slate-900">
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex min-h-screen flex-1 flex-col">
            <GlobalTopBar />

            <main className="flex-1 p-4 lg:p-6">{children}</main>

            <BottomStatusBar />
          </div>
        </div>

        {/* 🔥 GOOGLE MAPS */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
