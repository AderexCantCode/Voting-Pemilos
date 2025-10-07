import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CandidateCard } from "@/components/voting/CandidateCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Vote = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Get user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    // Check if user has voted
    const { data: voteData } = await supabase
      .from("votes")
      .select("*, candidates(*)")
      .eq("voter_id", session.user.id)
      .maybeSingle();

    if (voteData) {
      setHasVoted(true);
      setUserVote(voteData);
    }

    // Fetch candidates
    const { data: candidatesData } = await supabase
      .from("candidates")
      .select("*")
      .order("candidate_number");

    if (candidatesData) setCandidates(candidatesData);
  };

  const handleVote = async (candidateId: string) => {
    if (hasVoted) {
      toast({
        title: "Sudah memilih",
        description: "Anda sudah memberikan suara.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCandidate(candidateId);
  };

  const confirmVote = async () => {
    if (!selectedCandidate || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          voter_id: user.id,
          candidate_id: selectedCandidate,
        });

      if (error) throw error;

      toast({
        title: "Suara berhasil!",
        description: "Terima kasih telah memberikan suara Anda.",
      });

      checkAuth();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (hasVoted && userVote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Pemilihan Ketua OSIS</h1>
              <p className="text-muted-foreground">Selamat datang, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto text-center shadow-medium">
            <CardHeader>
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Terima Kasih Sudah Memilih!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Suara Anda telah berhasil dicatat dalam sistem.
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Pilihan Anda:</p>
                <p className="font-bold text-xl">
                  Kandidat #{userVote.candidates.candidate_number}
                </p>
                <p className="text-lg">
                  {userVote.candidates.chairman_name} & {userVote.candidates.vice_chairman_name}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Hasil pemilihan akan diumumkan setelah periode voting berakhir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pemilihan Ketua OSIS</h1>
            <p className="text-muted-foreground">
              Pilih kandidat terbaik menurutmu, {profile?.full_name}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onVote={handleVote}
              hasVoted={hasVoted}
              isSelected={selectedCandidate === candidate.id}
              disabled={loading}
            />
          ))}
        </div>

        {selectedCandidate && !hasVoted && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-strong p-4">
            <div className="container mx-auto flex items-center justify-between">
              <p className="font-medium">Anda telah memilih kandidat</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                  Batal
                </Button>
                <Button onClick={confirmVote} disabled={loading}>
                  Konfirmasi Pilihan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vote;
