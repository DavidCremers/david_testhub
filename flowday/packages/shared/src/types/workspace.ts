export type WorkspaceType = 'work' | 'private';

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  type: WorkspaceType;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface WorkspaceCreate {
  name: string;
  type: WorkspaceType;
  color?: string;
  icon?: string;
}

export interface WorkspaceUpdate {
  name?: string;
  color?: string;
  icon?: string;
}

export const DEFAULT_WORKSPACES: Omit<WorkspaceCreate, 'type'>[] = [
  {
    name: 'Werk',
    color: '#007AFF', // iOS systemBlue
    icon: 'briefcase.fill',
  },
  {
    name: 'Privé',
    color: '#34C759', // iOS systemGreen
    icon: 'house.fill',
  },
];
