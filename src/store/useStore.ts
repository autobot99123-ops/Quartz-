import { create } from "zustand";

interface AppState {
  user: { id: string; email: string; name: string } | null;
  setUser: (user: AppState["user"]) => void;
  currentProblem: string | null;
  setCurrentProblem: (id: string | null) => void;
  submissions: any[];
  addSubmission: (sub: any) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  currentProblem: null,
  setCurrentProblem: (id) => set({ currentProblem: id }),
  submissions: [],
  addSubmission: (sub) => set((state) => ({ submissions: [...state.submissions, sub] })),
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
