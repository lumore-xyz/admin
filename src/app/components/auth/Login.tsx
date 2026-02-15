"use client";

import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import { loginAdminWithGoogle } from "@/lib/admin-api";
import { getAdminSession, setAdminSession } from "@/lib/admin-auth";
import { useGoogleLogin } from "@react-oauth/google";
import { Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CardBox from "../shared/CardBox";

export const Login = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getAdminSession();
    if (session?.accessToken && session?.user?.isAdmin) {
      router.replace("/");
    }
  }, [router]);

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const res = await loginAdminWithGoogle(tokenResponse.code);
        const user = res?.data?.user || res?.user;
        const accessToken = res?.data?.accessToken || res?.accessToken;
        if (!user?.isAdmin || !accessToken) {
          setError("Admin access denied.");
          return;
        }
        setAdminSession({
          accessToken,
          user,
        });
        router.replace("/");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Google login failed";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google authentication was cancelled or failed."),
  });

  return (
    <>
      <div className="h-screen w-full flex justify-center items-center bg-lightprimary">
        <div className="md:min-w-[450px] min-w-max">
          <CardBox>
            <div className="flex justify-center mb-4">
              <FullLogo />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Sign in with your admin Google account.
            </p>
            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
              <p className="text-sm text-warning mb-4">
                Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in admin-template env.
              </p>
            ) : null}
            {error ? <p className="text-sm text-error mb-4">{error}</p> : null}
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => googleLogin()}
            >
              <Chrome size={16} />
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>
            <div className="flex items center gap-2 justify-center mt-6 flex-wrap">
              <p className="text-base font-medium text-muted-foreground">
                Need admin access?
              </p>
              <Link
                href="mailto:support@lumore.com"
                className="text-sm font-medium text-primary hover:text-primaryemphasis"
              >
                Contact support
              </Link>
            </div>
          </CardBox>
        </div>
      </div>
    </>
  );
};
