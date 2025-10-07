import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, KeyRound, UserPlus } from "lucide-react";
import { VotingStats } from "@/components/admin/VotingStats";
import { VotersList } from "@/components/admin/VotersList";
import { RegistrationCodes } from "@/components/admin/RegistrationCodes";
import { CandidateManagement } from "@/components/admin/CandidateManagement";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || !roles.some(r => r.role === "admin")) {
      navigate("/vote");
      return;
    }

    setUser(session.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
            <p className="text-muted-foreground">Kelola pemilihan ketua OSIS</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Kandidat
            </TabsTrigger>
            <TabsTrigger value="voters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pemilih
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Kode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <VotingStats />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="voters">
            <VotersList />
          </TabsContent>

          <TabsContent value="codes">
            <RegistrationCodes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
