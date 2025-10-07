import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const CandidateManagement = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [formData, setFormData] = useState({
    candidate_number: "",
    chairman_name: "",
    vice_chairman_name: "",
    chairman_photo: "",
    vice_chairman_photo: "",
    vision: "",
    mission: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .order("candidate_number");

    if (data) setCandidates(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        candidate_number: parseInt(formData.candidate_number),
      };

      if (editingCandidate) {
        const { error } = await supabase
          .from("candidates")
          .update(submitData)
          .eq("id", editingCandidate.id);

        if (error) throw error;
        toast({ title: "Kandidat berhasil diperbarui!" });
      } else {
        const { error } = await supabase
          .from("candidates")
          .insert([submitData]);

        if (error) throw error;
        toast({ title: "Kandidat berhasil ditambahkan!" });
      }

      setIsOpen(false);
      setEditingCandidate(null);
      resetForm();
      fetchCandidates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kandidat ini?")) return;

    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Kandidat berhasil dihapus!" });
      fetchCandidates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      candidate_number: "",
      chairman_name: "",
      vice_chairman_name: "",
      chairman_photo: "",
      vice_chairman_photo: "",
      vision: "",
      mission: "",
    });
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setFormData(candidate);
    setIsOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kelola Kandidat</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingCandidate(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kandidat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidate ? "Edit Kandidat" : "Tambah Kandidat Baru"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Nomor Urut</Label>
                  <Input
                    id="number"
                    type="number"
                    value={formData.candidate_number}
                    onChange={(e) => setFormData({ ...formData, candidate_number: e.target.value })}
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chairman">Nama Ketua</Label>
                    <Input
                      id="chairman"
                      value={formData.chairman_name}
                      onChange={(e) => setFormData({ ...formData, chairman_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vice">Nama Wakil Ketua</Label>
                    <Input
                      id="vice"
                      value={formData.vice_chairman_name}
                      onChange={(e) => setFormData({ ...formData, vice_chairman_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chairmanPhoto">URL Foto Ketua</Label>
                    <Input
                      id="chairmanPhoto"
                      placeholder="https://..."
                      value={formData.chairman_photo}
                      onChange={(e) => setFormData({ ...formData, chairman_photo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vicePhoto">URL Foto Wakil</Label>
                    <Input
                      id="vicePhoto"
                      placeholder="https://..."
                      value={formData.vice_chairman_photo}
                      onChange={(e) => setFormData({ ...formData, vice_chairman_photo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Visi</Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission">Misi</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCandidate ? "Update Kandidat" : "Tambah Kandidat"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada kandidat. Tambahkan kandidat pertama!
            </p>
          ) : (
            candidates.map((candidate) => (
              <Card key={candidate.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      #{candidate.candidate_number} - {candidate.chairman_name} & {candidate.vice_chairman_name}
                    </h3>
                    {candidate.vision && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Visi: {candidate.vision.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(candidate)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(candidate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
