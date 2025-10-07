import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [classYear, setClassYear] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login berhasil!",
          description: "Selamat datang kembali.",
        });

        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (roles && roles.some(r => r.role === "admin")) {
          navigate("/admin");
        } else {
          navigate("/vote");
        }
      } else {
        // Verify registration code
        const { data: codeData, error: codeError } = await supabase
          .from("registration_codes")
          .select("*")
          .eq("code", registrationCode)
          .eq("is_used", false)
          .single();

        if (codeError || !codeData) {
          throw new Error("Kode registrasi tidak valid atau sudah digunakan");
        }

        // Sign up user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              class: classYear,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Mark code as used
          await supabase
            .from("registration_codes")
            .update({ is_used: true, used_by: data.user.id, used_at: new Date().toISOString() })
            .eq("id", codeData.id);

          // Add voter role
          await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: "voter" });

          toast({
            title: "Registrasi berhasil!",
            description: "Akun Anda telah dibuat. Silakan login.",
          });

          setIsLogin(true);
        }
      }
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

  return (
    <Card className="w-full max-w-md mx-auto shadow-medium">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isLogin ? "Login" : "Daftar Pemilih"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin
            ? "Masuk untuk memberikan suara Anda"
            : "Daftar dengan kode registrasi"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Input
                  id="class"
                  type="text"
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  required
                  placeholder="Contoh: XII IPA 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Kode Registrasi</Label>
                <Input
                  id="code"
                  type="text"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Masukkan kode dari admin"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimal 6 karakter"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : isLogin ? "Login" : "Daftar"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Belum punya akun? Daftar di sini"
              : "Sudah punya akun? Login di sini"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
