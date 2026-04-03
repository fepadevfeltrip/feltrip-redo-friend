import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const KNOWN_ROUTES = ["app", "auth", "reset-password", "join", "concierge", "premium"];

const AffiliateRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");

  useEffect(() => {
    if (!slug || KNOWN_ROUTES.includes(slug)) {
      setStatus("invalid");
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("slug")
        .eq("slug", slug)
        .limit(1);

      if (data && data.length > 0) {
        localStorage.setItem("active_affiliate", slug);
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    };

    check();
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Valid affiliate → redirect to home
  if (status === "valid") {
    return <Navigate to="/" replace />;
  }

  // Invalid slug → 404
  return <Navigate to="/404" replace />;
};

export default AffiliateRedirect;
