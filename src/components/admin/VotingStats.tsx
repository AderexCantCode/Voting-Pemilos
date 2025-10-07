import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Vote, TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const VotingStats = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    // Get vote counts per candidate
    const { data: votesData } = await supabase
      .from("votes")
      .select(`
        candidate_id,
        candidates (
          candidate_number,
          chairman_name,
          vice_chairman_name
        )
      `);

    // Get total registered voters
    const { count: votersCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "voter");

    if (votesData) {
      const grouped = votesData.reduce((acc: any, vote: any) => {
        const candidateId = vote.candidate_id;
        if (!acc[candidateId]) {
          acc[candidateId] = {
            id: candidateId,
            name: `#${vote.candidates?.candidate_number} - ${vote.candidates?.chairman_name} & ${vote.candidates?.vice_chairman_name}`,
            candidate_number: vote.candidates?.candidate_number,
            votes: 0,
          };
        }
        acc[candidateId].votes += 1;
        return acc;
      }, {});

      const statsArray = Object.values(grouped).sort(
        (a: any, b: any) => a.candidate_number - b.candidate_number
      );
      
      setStats(statsArray);
      setTotalVotes(votesData.length);
      setTotalVoters(votersCount || 0);
    }
  };

  const participationRate = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemilih Terdaftar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVoters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suara Masuk</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partisipasi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participationRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Perolehan Suara</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="candidate_number" label={{ value: "Nomor Kandidat", position: "insideBottom", offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#3b82f6" name="Jumlah Suara" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Suara</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ candidate_number, votes }) => `#${candidate_number}: ${votes}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="votes"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Perolehan Suara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat, index) => {
              const percentage = totalVotes > 0 ? ((stat.votes / totalVotes) * 100).toFixed(1) : 0;
              return (
                <div key={stat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {stat.votes} suara ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
