import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Vote, Shield, Users, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-voting.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pemilihan Ketua OSIS
              </span>
              <br />
              Digital & Transparan
            </h1>
            <p className="text-xl text-muted-foreground">
              Platform voting modern yang aman, mudah, dan real-time untuk memilih pemimpin OSIS masa depan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="shadow-medium">
                <Vote className="mr-2 h-5 w-5" />
                Mulai Voting
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Login Admin
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Voting System"
              className="rounded-2xl shadow-strong w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Kenapa Memilih Platform Kami?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aman & Terverifikasi</h3>
            <p className="text-muted-foreground">
              Sistem kode registrasi memastikan hanya siswa yang terdaftar yang dapat memberikan suara.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Stats</h3>
            <p className="text-muted-foreground">
              Pantau perolehan suara secara langsung dengan grafik dan statistik yang update otomatis.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mudah Digunakan</h3>
            <p className="text-muted-foreground">
              Interface yang simple dan intuitif membuat proses voting menjadi cepat dan mudah.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-center text-primary-foreground shadow-strong">
          <h2 className="text-3xl font-bold mb-4">Siap Memberikan Suara?</h2>
          <p className="text-lg mb-8 opacity-90">
            Gunakan kode registrasi dari admin untuk membuat akun dan mulai voting!
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="shadow-medium"
          >
            Daftar Sekarang
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>&copy; 2024 Pemilihan Ketua OSIS. Platform voting digital yang aman dan transparan.</p>
      </footer>
    </div>
  );
};

export default Index;
