import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import heroImage from "@/assets/hero-voting.jpg";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (roles && roles.some(r => r.role === "admin")) {
          navigate("/admin");
        } else {
          navigate("/vote");
        }
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pemilihan Ketua OSIS
              </h1>
              <p className="text-xl text-muted-foreground">
                Platform voting digital yang aman dan transparan untuk memilih pemimpin OSIS masa depan.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src={heroImage}
                alt="Voting illustration"
                className="rounded-xl shadow-strong w-full"
              />
            </div>
          </div>
          <div>
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
