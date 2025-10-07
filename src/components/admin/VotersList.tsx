import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Voter {
  id: string;
  full_name: string;
  class: string;
  voted_at: string;
  candidate_number: number;
  chairman_name: string;
  vice_chairman_name: string;
}

export const VotersList = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [filteredVoters, setFilteredVoters] = useState<Voter[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("all");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoters();
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (selectedCandidate === "all") {
      setFilteredVoters(voters);
    } else {
      setFilteredVoters(voters.filter(v => v.candidate_number.toString() === selectedCandidate));
    }
  }, [selectedCandidate, voters]);

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .order("candidate_number");
    
    if (data) setCandidates(data);
  };

  const fetchVoters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("votes")
      .select(`
        id,
        voted_at,
        profiles!votes_voter_id_fkey (
          full_name,
          class
        ),
        candidates (
          candidate_number,
          chairman_name,
          vice_chairman_name
        )
      `)
      .order("voted_at", { ascending: false });

    if (data && !error) {
      const formattedVoters = data.map((vote: any) => ({
        id: vote.id,
        full_name: vote.profiles?.full_name || "N/A",
        class: vote.profiles?.class || "N/A",
        voted_at: vote.voted_at,
        candidate_number: vote.candidates?.candidate_number || 0,
        chairman_name: vote.candidates?.chairman_name || "N/A",
        vice_chairman_name: vote.candidates?.vice_chairman_name || "N/A",
      }));
      setVoters(formattedVoters);
      setFilteredVoters(formattedVoters);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daftar Pemilih</CardTitle>
          <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter kandidat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kandidat</SelectItem>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.candidate_number.toString()}>
                  Kandidat #{candidate.candidate_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Memuat data...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Waktu Vote</TableHead>
                  <TableHead>Pilihan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVoters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada pemilih
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVoters.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.full_name}</TableCell>
                      <TableCell>{voter.class}</TableCell>
                      <TableCell>
                        {format(new Date(voter.voted_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          #{voter.candidate_number}
                        </span>
                        {" - "}
                        {voter.chairman_name} & {voter.vice_chairman_name}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
