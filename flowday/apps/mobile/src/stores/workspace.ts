import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workspace, WorkspaceType } from '@flowday/shared';
import { getWorkspaces, getWorkspaceByType } from '@flowday/shared';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceType: WorkspaceType;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWorkspaces: () => Promise<void>;
  setActiveWorkspace: (type: WorkspaceType) => void;
  switchWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      activeWorkspaceType: 'private',
      isLoading: false,
      error: null,

      loadWorkspaces: async () => {
        try {
          set({ isLoading: true, error: null });
          const workspaces = await getWorkspaces();

          // Find the active workspace based on type
          const activeType = get().activeWorkspaceType;
          const activeWorkspace = workspaces.find(w => w.type === activeType) || workspaces[0] || null;

          set({
            workspaces,
            activeWorkspace,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load workspaces',
          });
        }
      },

      setActiveWorkspace: (type: WorkspaceType) => {
        const { workspaces } = get();
        const workspace = workspaces.find(w => w.type === type);
        if (workspace) {
          set({
            activeWorkspace: workspace,
            activeWorkspaceType: type,
          });
        }
      },

      switchWorkspace: () => {
        const { activeWorkspaceType } = get();
        const newType: WorkspaceType = activeWorkspaceType === 'work' ? 'private' : 'work';
        get().setActiveWorkspace(newType);
      },
    }),
    {
      name: 'flowday-workspace',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeWorkspaceType: state.activeWorkspaceType,
      }),
    }
  )
);
