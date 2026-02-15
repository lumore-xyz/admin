"use client";

import { getAdminSession } from "@/lib/admin-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./layout/header/Header";
import Sidebar from "./layout/sidebar/Sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    const isAdmin = !!session?.accessToken && !!session?.user?.isAdmin;
    if (!isAdmin) {
      router.replace("/auth/login");
      return;
    }
    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) return null;

  return (
    <div className="flex w-full min-h-screen">
      <div className="page-wrapper flex w-full">
        {/* Header/sidebar */}
        <div className="xl:block hidden">
          <Sidebar />
        </div>
        <div className="body-wrapper w-full bg-background">
          {/* Top Header  */}
          <Header />
          {/* Body Content  */}
          <div className={`container mx-auto px-6 py-30`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
