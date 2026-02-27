import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// Cinematic Dark Elegance: Creator dashboard showing user's own submissions
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

export default function CreatorDashboard() {
  const [, navigate] = useLocation();
  const [userSubtitles, setUserSubtitles] = useState<Subtitle[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    initializeTelegramUser();
    loadUserSubtitles();
  }, []);

  const initializeTelegramUser = () => {
    // Simulate Telegram user data
    const mockUser = {
      id: 12345,
      username: "testuser",
      first_name: "Test",
    };
    setUserInfo(mockUser);
  };

  const loadUserSubtitles = async () => {
    const mockUserId = "12345";
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Load pending subtitles
    const pendingStore = db.transaction("pending_subtitles", "readonly").objectStore("pending_subtitles");
    const pendingRequest = pendingStore.getAll();

    pendingRequest.onsuccess = () => {
      const pending = pendingRequest.result.filter((s) => s.userId === mockUserId);

      // Load approved subtitles
      const approvedStore = db.transaction("approved_subtitles", "readonly").objectStore("approved_subtitles");
      const approvedRequest = approvedStore.getAll();

      approvedRequest.onsuccess = () => {
        const approved = approvedRequest.result.filter((s) => s.userId === mockUserId);
        setUserSubtitles([...pending, ...approved]);
      };
    };
  };

  const pendingSubtitles = userSubtitles.filter((s) => s.status === "pending");
  const approvedSubtitles = userSubtitles.filter((s) => s.status === "approved");

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
          <h1 className="text-2xl font-bold text-accent">My Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Pending Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Pending Approval
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {pendingSubtitles.length} subtitle{pendingSubtitles.length !== 1 ? "s" : ""} awaiting admin review
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
                      Uploaded: {new Date(subtitle.uploadedAt).toLocaleDateString()}
                    </p>
                    {subtitle.donationLink && (
                      <p className="text-xs text-accent truncate">
                        Donation: {subtitle.donationLink}
                      </p>
                    )}
                  </div>

                  {/* Red accent border */}
                  <div className="absolute left-0 top-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary rounded-lg">
              <p className="text-muted-foreground">No pending subtitles</p>
            </div>
          )}
        </section>

        {/* Approved Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Approved Subtitles
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {approvedSubtitles.length} subtitle{approvedSubtitles.length !== 1 ? "s" : ""} published
            </p>
          </div>

          {approvedSubtitles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {approvedSubtitles.map((subtitle) => (
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
                      <span className="badge-status badge-approved">Approved</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 relative z-10">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {subtitle.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Published: {new Date(subtitle.uploadedAt).toLocaleDateString()}
                    </p>
                    {subtitle.donationLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                        onClick={() => window.open(subtitle.donationLink, "_blank")}
                      >
                        View Donation Link
                      </Button>
                    )}
                  </div>

                  {/* Red accent border */}
                  <div className="absolute left-0 top-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary rounded-lg">
              <p className="text-muted-foreground">No approved subtitles yet</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
