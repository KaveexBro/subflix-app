import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Initialize anonymous authentication
signInAnonymously(auth).catch((error) => {
  console.error("Firebase authentication error:", error);
});

export interface Subtitle {
  id: string;
  title: string;
  uploader: string;
  userId: string;
  content: string;
  donationLink: string;
  posterUrl: string;
  status: "pending" | "approved";
  uploadedAt: Date;
  fileUrl?: string;
}

/**
 * Firebase service module for Subflix
 * Handles all Firestore and Storage operations
 */
export const firebaseService = {
  /**
   * Get all approved subtitles
   */
  async getApprovedSubtitles(): Promise<Subtitle[]> {
    try {
      const q = query(collection(db, "approved_subtitles"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
        uploadedAt: docSnap.data().uploadedAt?.toDate() || new Date(),
      })) as Subtitle[];
    } catch (error) {
      console.error("Error fetching approved subtitles:", error);
      return [];
    }
  },

  /**
   * Get all pending subtitles (admin only)
   */
  async getPendingSubtitles(): Promise<Subtitle[]> {
    try {
      const q = query(collection(db, "pending_subtitles"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
        uploadedAt: docSnap.data().uploadedAt?.toDate() || new Date(),
      })) as Subtitle[];
    } catch (error) {
      console.error("Error fetching pending subtitles:", error);
      return [];
    }
  },

  /**
   * Get user's own subtitles (both pending and approved)
   */
  async getUserSubtitles(userId: string): Promise<Subtitle[]> {
    try {
      // Get pending subtitles
      const pendingQ = query(
        collection(db, "pending_subtitles"),
        where("userId", "==", userId)
      );
      const pendingSnapshot = await getDocs(pendingQ);
      const pending = pendingSnapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
        uploadedAt: docSnap.data().uploadedAt?.toDate() || new Date(),
      })) as Subtitle[];

      // Get approved subtitles
      const approvedQ = query(
        collection(db, "approved_subtitles"),
        where("userId", "==", userId)
      );
      const approvedSnapshot = await getDocs(approvedQ);
      const approved = approvedSnapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
        uploadedAt: docSnap.data().uploadedAt?.toDate() || new Date(),
      })) as Subtitle[];

      return [...pending, ...approved];
    } catch (error) {
      console.error("Error fetching user subtitles:", error);
      return [];
    }
  },

  /**
   * Upload a new subtitle
   */
  async uploadSubtitle(
    subtitle: Omit<Subtitle, "id" | "fileUrl" | "uploadedAt">,
    srtFile: File
  ): Promise<string> {
    try {
      // Upload SRT file to storage
      const fileName = `subtitles/${Date.now()}-${subtitle.title.replace(/\s+/g, "_")}.srt`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, srtFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Add subtitle to pending collection
      const docRef = await addDoc(collection(db, "pending_subtitles"), {
        ...subtitle,
        fileUrl: downloadURL,
        status: "pending",
        uploadedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error uploading subtitle:", error);
      throw error;
    }
  },

  /**
   * Approve a pending subtitle (admin only)
   */
  async approveSubtitle(subtitleId: string): Promise<void> {
    try {
      // Get the pending subtitle
      const pendingDocRef = doc(db, "pending_subtitles", subtitleId);
      const pendingSnapshot = await getDocs(
        query(collection(db, "pending_subtitles"))
      );

      const subtitleDoc = pendingSnapshot.docs.find((d: any) => d.id === subtitleId);
      if (!subtitleDoc) {
        throw new Error("Subtitle not found");
      }

      const subtitleData = subtitleDoc.data();

      // Add to approved collection
      await addDoc(collection(db, "approved_subtitles"), {
        ...subtitleData,
        status: "approved",
      });

      // Remove from pending collection
      await deleteDoc(pendingDocRef);
    } catch (error) {
      console.error("Error approving subtitle:", error);
      throw error;
    }
  },

  /**
   * Reject a pending subtitle (admin only)
   */
  async rejectSubtitle(subtitleId: string): Promise<void> {
    try {
      const docRef = doc(db, "pending_subtitles", subtitleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error rejecting subtitle:", error);
      throw error;
    }
  },

  /**
   * Search subtitles by title
   */
  async searchSubtitles(query: string): Promise<Subtitle[]> {
    try {
      const allSubtitles = await this.getApprovedSubtitles();
      return allSubtitles.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.uploader.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching subtitles:", error);
      return [];
    }
  },

  /**
   * Get admin configuration
   */
  async getAdminIds(): Promise<number[]> {
    try {
      const adminDocRef = doc(db, "admin_config", "admins");
      const snapshot = await getDocs(query(collection(db, "admin_config")));
      const adminDoc = snapshot.docs.find((d: any) => d.id === "admins");
      return adminDoc?.data()?.ids || [];
    } catch (error) {
      console.error("Error fetching admin IDs:", error);
      return [];
    }
  },
};
