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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const boxWidth = 50;
    const boxHeight = 20;
    const padding = 5;
    const cols = 3;
    const rows = 8;

    const startX = (pageWidth - (cols * boxWidth + (cols - 1) * padding)) / 2;
    const startY = 20;

    doc.setFontSize(16);
    doc.text("KODE REGISTRASI PEMILIHAN OSIS", pageWidth / 2, 12, { align: "center" });

    const availableCodes = codes.filter(c => !c.is_used);
    let currentPage = 0;
    let boxIndex = 0;

    availableCodes.forEach((codeItem, index) => {
      if (boxIndex >= cols * rows) {
        doc.addPage();
        currentPage++;
        boxIndex = 0;
        doc.setFontSize(16);
        doc.text("KODE REGISTRASI PEMILIHAN OSIS", pageWidth / 2, 12, { align: "center" });
      }

      const row = Math.floor(boxIndex / cols);
      const col = boxIndex % cols;

      const x = startX + col * (boxWidth + padding);
      const y = startY + row * (boxHeight + padding);

      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.rect(x, y, boxWidth, boxHeight);

      doc.setLineDash([2, 2]);
      doc.setDrawColor(150, 150, 150);
      doc.line(x, y + boxHeight, x + boxWidth, y + boxHeight);
      doc.line(x + boxWidth, y, x + boxWidth, y + boxHeight);
      doc.setLineDash([]);

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(codeItem.code, x + boxWidth / 2, y + boxHeight / 2 + 2, { align: "center" });

      boxIndex++;
    });

    doc.save(`kode-registrasi-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF berhasil diunduh!",
      description: `${availableCodes.length} kode tersedia telah diexport ke PDF.`,
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
