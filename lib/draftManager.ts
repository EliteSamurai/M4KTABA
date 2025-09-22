import { ListingFormData } from '@/lib/validation/listingSchema';

const DRAFT_KEY_PREFIX = 'm4ktaba:draft:';

export interface DraftData {
  id: string;
  data: Partial<ListingFormData>;
  lastSaved: string;
  version: number;
}

export class DraftManager {
  private static instance: DraftManager;
  private drafts: Map<string, DraftData> = new Map();

  static getInstance(): DraftManager {
    if (!DraftManager.instance) {
      DraftManager.instance = new DraftManager();
    }
    return DraftManager.instance;
  }

  // Save draft to localStorage
  saveDraft(id: string, data: Partial<ListingFormData>): void {
    if (typeof window === 'undefined') return;

    const draft: DraftData = {
      id,
      data,
      lastSaved: new Date().toISOString(),
      version: 1,
    };

    try {
      localStorage.setItem(`${DRAFT_KEY_PREFIX}${id}`, JSON.stringify(draft));
      this.drafts.set(id, draft);
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }

  // Load draft from localStorage
  loadDraft(id: string): DraftData | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`);
      if (!stored) return null;

      const draft = JSON.parse(stored) as DraftData;
      this.drafts.set(id, draft);
      return draft;
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
      return null;
    }
  }

  // Delete draft from localStorage
  deleteDraft(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${id}`);
      this.drafts.delete(id);
    } catch (error) {
      console.warn('Failed to delete draft from localStorage:', error);
    }
  }

  // Get all drafts
  getAllDrafts(): DraftData[] {
    if (typeof window === 'undefined') return [];

    const drafts: DraftData[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_KEY_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft = JSON.parse(stored) as DraftData;
            drafts.push(draft);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all drafts from localStorage:', error);
    }

    return drafts.sort(
      (a, b) =>
        new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
    );
  }

  // Clear all drafts
  clearAllDrafts(): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      this.drafts.clear();
    } catch (error) {
      console.warn('Failed to clear all drafts from localStorage:', error);
    }
  }

  // Check if draft exists
  hasDraft(id: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`) !== null;
  }

  // Get draft count
  getDraftCount(): number {
    if (typeof window === 'undefined') return 0;

    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_KEY_PREFIX)) {
          count++;
        }
      }
    } catch (error) {
      console.warn('Failed to count drafts in localStorage:', error);
    }

    return count;
  }
}
