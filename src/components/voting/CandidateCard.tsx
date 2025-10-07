import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users } from "lucide-react";

interface CandidateCardProps {
  candidate: {
    id: string;
    candidate_number: number;
    chairman_name: string;
    vice_chairman_name: string;
    chairman_photo: string | null;
    vice_chairman_photo: string | null;
    vision: string | null;
    mission: string | null;
  };
  onVote: (candidateId: string) => void;
  hasVoted: boolean;
  isSelected: boolean;
  disabled: boolean;
}

export const CandidateCard = ({
  candidate,
  onVote,
  hasVoted,
  isSelected,
  disabled,
}: CandidateCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-medium ${
      isSelected ? "ring-2 ring-secondary" : ""
    }`}>
      <div className="absolute top-0 left-0 bg-gradient-to-br from-primary to-accent text-primary-foreground px-4 py-2 rounded-br-xl font-bold text-lg">
        #{candidate.candidate_number}
      </div>
      
      <CardContent className="p-6 pt-16">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-muted shadow-soft">
              {candidate.chairman_photo ? (
                <img
                  src={candidate.chairman_photo}
                  alt={candidate.chairman_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg text-foreground">{candidate.chairman_name}</h3>
            <p className="text-sm text-muted-foreground">Ketua</p>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-muted shadow-soft">
              {candidate.vice_chairman_photo ? (
                <img
                  src={candidate.vice_chairman_photo}
                  alt={candidate.vice_chairman_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg text-foreground">{candidate.vice_chairman_name}</h3>
            <p className="text-sm text-muted-foreground">Wakil Ketua</p>
          </div>
        </div>

        {candidate.vision && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-foreground mb-2">Visi:</h4>
            <p className="text-sm text-muted-foreground">{candidate.vision}</p>
          </div>
        )}

        {candidate.mission && (
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-foreground mb-2">Misi:</h4>
            <p className="text-sm text-muted-foreground">{candidate.mission}</p>
          </div>
        )}

        <Button
          onClick={() => onVote(candidate.id)}
          disabled={disabled || hasVoted}
          className="w-full"
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Pilihan Anda
            </>
          ) : hasVoted ? (
            "Anda sudah memilih"
          ) : (
            "Pilih Kandidat Ini"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
