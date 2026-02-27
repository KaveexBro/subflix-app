import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Cinematic Dark Elegance: Admin panel for reviewing pending subtitles
interface Subtitle {
  id: string;
  title: string;
  uploader: string;
  userId: string;
  content: string;
  donationLink: string;
  posterUrl: string;
  status: "pending" | "approved";
  uploadedAt: number;
}

const ADMIN_IDS = [12345]; // Hardcoded admin IDs

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [pendingSubtitles, setPendingSubtitles] = useState<Subtitle[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
    loadPendingSubtitles();
  }, []);

  const checkAuthorization = () => {
    // In production, use Telegram Web App API to get user ID
    const mockUserId = 12345;
    if (ADMIN_IDS.includes(mockUserId)) {
      setIsAuthorized(true);
    } else {
      toast.error("Unauthorized access");
      navigate("/");
    }
  };

  const loadPendingSubtitles = async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const store = db.transaction("pending_subtitles", "readonly").objectStore("pending_subtitles");
    const request = store.getAll();

    request.onsuccess = () => {
      setPendingSubtitles(request.result);
    };
  };

  const approveSubtitle = async (subtitle: Subtitle) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Add to approved store
    const approvedStore = db.transaction("approved_subtitles", "readwrite").objectStore("approved_subtitles");
    approvedStore.add({ ...subtitle, status: "approved" });

    // Remove from pending store
    const pendingStore = db.transaction("pending_subtitles", "readwrite").objectStore("pending_subtitles");
    pendingStore.delete(subtitle.id);

    toast.success(`"${subtitle.title}" approved!`);
    setPendingSubtitles(pendingSubtitles.filter((s) => s.id !== subtitle.id));
  };

  const rejectSubtitle = async (subtitle: Subtitle) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const store = db.transaction("pending_subtitles", "readwrite").objectStore("pending_subtitles");
    store.delete(subtitle.id);

    toast.success(`"${subtitle.title}" rejected.`);
    setPendingSubtitles(pendingSubtitles.filter((s) => s.id !== subtitle.id));
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-lg">
        <div className="container flex items-center gap-4 h-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-accent">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground">
            Pending Subtitles
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingSubtitles.length} subtitle{pendingSubtitles.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>

        {pendingSubtitles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingSubtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                className="card-cinema group overflow-hidden"
              >
                {/* Poster Image */}
                <div className="relative h-64 overflow-hidden bg-secondary">
                  <img
                    src={subtitle.posterUrl}
                    alt={subtitle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 gradient-overlay" />
                  <div className="absolute top-2 right-2">
                    <span className="badge-status badge-pending">Pending</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 relative z-10">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                    {subtitle.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    by <span className="text-accent">{subtitle.uploader}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {new Date(subtitle.uploadedAt).toLocaleDateString()}
                  </p>

                  {/* Preview */}
                  <div className="mb-4 p-2 bg-secondary rounded text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    <p className="line-clamp-4">{subtitle.content.substring(0, 200)}...</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={() => approveSubtitle(subtitle)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => rejectSubtitle(subtitle)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>

                {/* Red accent border */}
                <div className="absolute left-0 top-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No pending subtitles. All submissions have been reviewed!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
