import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Upload, LogOut, User, LayoutGrid } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Cinematic Dark Elegance: Netflix-inspired dark theme with red accents
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

export default function Home() {
  const [, navigate] = useLocation();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    donationLink: "",
    file: null as File | null,
  });

  // Initialize IndexedDB and load data
  useEffect(() => {
    initializeDB();
    loadSubtitles();
    initializeTelegramUser();
  }, []);

  const initializeDB = async () => {
    const request = indexedDB.open("SubflixDB", 1);
    
    request.onerror = () => {
      toast.error("Failed to initialize database");
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending_subtitles")) {
        db.createObjectStore("pending_subtitles", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("approved_subtitles")) {
        db.createObjectStore("approved_subtitles", { keyPath: "id", autoIncrement: true });
      }
    };
  };

  const loadSubtitles = async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const approvedStore = db.transaction("approved_subtitles", "readonly").objectStore("approved_subtitles");
    const approvedRequest = approvedStore.getAll();

    approvedRequest.onsuccess = () => {
      setSubtitles(approvedRequest.result.filter((s) => s.status === "approved"));
    };
  };

  const initializeTelegramUser = () => {
    // Simulate Telegram user data (in production, use Telegram Web App API)
    const mockUser = {
      id: 12345,
      username: "testuser",
      first_name: "Test",
    };
    setUserInfo(mockUser);
    // Check if user is admin (hardcoded for demo)
    setIsAdmin(mockUser.id === 12345);
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.file) {
      toast.error("Please fill in all fields");
      return;
    }

    const fileContent = await uploadForm.file.text();
    const newSubtitle: Subtitle = {
      id: Date.now().toString(),
      title: uploadForm.title,
      uploader: userInfo?.username || "Anonymous",
      userId: userInfo?.id.toString() || "0",
      content: fileContent,
      donationLink: uploadForm.donationLink,
      posterUrl: `https://via.placeholder.com/300x450?text=${encodeURIComponent(uploadForm.title)}`,
      status: "pending",
      uploadedAt: Date.now(),
    };

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("SubflixDB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const store = db.transaction("pending_subtitles", "readwrite").objectStore("pending_subtitles");
    store.add(newSubtitle);

    toast.success("Subtitle uploaded! Awaiting admin approval.");
    setShowUploadModal(false);
    setUploadForm({ title: "", donationLink: "", file: null });
  };

  const filteredSubtitles = subtitles.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.uploader.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-lg">
        <div className="container flex items-center justify-between h-16 gap-4">
          <h1 className="text-2xl font-bold text-accent">Subflix!</h1>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search subtitles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Upload Subtitle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Movie/Series Title</label>
                    <Input
                      type="text"
                      placeholder="Enter title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Donation Link (Optional)</label>
                    <Input
                      type="url"
                      placeholder="https://buymeacoffee.com/..."
                      value={uploadForm.donationLink}
                      onChange={(e) => setUploadForm({ ...uploadForm, donationLink: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">.SRT File</label>
                    <input
                      type="file"
                      accept=".srt"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleUpload} className="w-full">
                    Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2 border-border"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/creator")}
              className="gap-2 border-border"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8">
        <div className="container">
          {/* Results Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">
              {searchQuery ? `Search Results: "${searchQuery}"` : "Approved Subtitles"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredSubtitles.length} subtitle{filteredSubtitles.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Subtitle Grid */}
          {filteredSubtitles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSubtitles.map((subtitle) => (
                <div
                  key={subtitle.id}
                  className="card-cinema group overflow-hidden cursor-pointer"
                >
                  {/* Poster Image */}
                  <div className="relative h-64 overflow-hidden bg-secondary">
                    <img
                      src={subtitle.posterUrl}
                      alt={subtitle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 gradient-overlay" />
                  </div>

                  {/* Card Content */}
                  <div className="p-4 relative z-10">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {subtitle.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      by <span className="text-accent">{subtitle.uploader}</span>
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          const element = document.createElement("a");
                          element.setAttribute(
                            "href",
                            "data:text/plain;charset=utf-8," + encodeURIComponent(subtitle.content)
                          );
                          element.setAttribute("download", `${subtitle.title}.srt`);
                          element.style.display = "none";
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          toast.success("Downloaded!");
                        }}
                      >
                        Download
                      </Button>
                      {subtitle.donationLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                          onClick={() => window.open(subtitle.donationLink, "_blank")}
                        >
                          Donate
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Red accent border on hover */}
                  <div className="absolute left-0 top-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? "No subtitles found matching your search." : "No approved subtitles yet."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-muted-foreground text-sm">
        <p>Subflix! - High-quality Sinhala subtitles for everyone</p>
        <p className="mt-2 text-xs">
          This is a fan-made subtitle distribution platform. All content is user-generated.
        </p>
      </footer>
    </div>
  );
}
