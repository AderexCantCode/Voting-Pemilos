import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Plus, FileDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const RegistrationCodes = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [newCodeCount, setNewCodeCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data } = await supabase
      .from("registration_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCodes(data);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCodes = async () => {
    setLoading(true);
    try {
      const newCodes = Array.from({ length: newCodeCount }, () => ({
        code: generateCode(),
      }));

      const { error } = await supabase.from("registration_codes").insert(newCodes);

      if (error) throw error;

      toast({
        title: "Kode berhasil dibuat!",
        description: `${newCodeCount} kode registrasi baru telah dibuat.`,
      });

      fetchCodes();
      setNewCodeCount(1);
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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Kode disalin!",
      description: `Kode ${code} telah disalin ke clipboard.`,
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Daftar Kode Registrasi Pemilihan OSIS", 14, 20);

    doc.setFontSize(11);
    doc.text(`Total Kode: ${codes.length}`, 14, 30);
    doc.text(`Tersedia: ${codes.filter(c => !c.is_used).length}`, 14, 36);
    doc.text(`Terpakai: ${codes.filter(c => c.is_used).length}`, 14, 42);

    const tableData = codes.map(code => [
      code.code,
      code.is_used ? "Sudah Digunakan" : "Tersedia",
      code.is_used ? "Ya" : "-"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Kode", "Status", "Digunakan"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`kode-registrasi-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF berhasil diunduh!",
      description: "Daftar kode registrasi telah diexport ke PDF.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Kode Registrasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            type="number"
            min="1"
            max="50"
            value={newCodeCount}
            onChange={(e) => setNewCodeCount(parseInt(e.target.value) || 1)}
            className="w-24"
          />
          <Button onClick={handleGenerateCodes} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Generate {newCodeCount} Kode
          </Button>
          <Button
            onClick={exportToPDF}
            variant="outline"
            disabled={codes.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export ke PDF
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Digunakan Oleh</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada kode registrasi
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>
                      {code.is_used ? (
                        <Badge variant="secondary">Sudah Digunakan</Badge>
                      ) : (
                        <Badge variant="default">Tersedia</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {code.is_used ? "Ya" : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
