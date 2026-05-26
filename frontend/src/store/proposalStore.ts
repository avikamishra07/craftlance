import { create } from "zustand";

interface ProposalStore {
  proposals: any[];
  setProposals: (proposals: any[]) => void;
}

export const useProposalStore = create<ProposalStore>((set) => ({
  proposals: [],
  setProposals: (proposals) => set({ proposals }),
}));