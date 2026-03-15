import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Simple role-based users for MVP (no Supabase Auth yet)
const USERS: Record<string, { password: string; name: string; role: Role }> = {
  'admin@wesco.co.kr': { password: 'wesco2026', name: '관리자', role: 'admin' },
  'sales@wesco.co.kr': { password: 'wesco2026', name: '영업팀', role: 'sales' },
  'production@wesco.co.kr': { password: 'wesco2026', name: '생산팀', role: 'production' },
  'warehouse@wesco.co.kr': { password: 'wesco2026', name: '자재팀', role: 'warehouse' },
  'service@wesco.co.kr': { password: 'wesco2026', name: '서비스팀', role: 'service' },
  'executive@wesco.co.kr': { password: 'wesco2026', name: '경영진', role: 'executive' },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: 'sales' as Role,
      isAuthenticated: false,

      login: async (email: string, password: string): Promise<boolean> => {
        const userConfig = USERS[email];
        if (!userConfig || userConfig.password !== password) {
          return false;
        }

        const user: User = {
          id: email,
          email,
          name: userConfig.name,
          role: userConfig.role,
        };

        set({ user, role: userConfig.role, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, role: 'sales', isAuthenticated: false });
      },
    }),
    {
      name: 'wesco-auth',
    }
  )
);

// Menu access control
const MENU_ACCESS: Record<Role, string[]> = {
  admin: ['home', 'orders', 'production', 'materials', 'service', 'management'],
  sales: ['home', 'orders'],
  production: ['home', 'production', 'materials'],
  warehouse: ['home', 'materials'],
  service: ['home', 'service'],
  executive: ['home', 'orders', 'production', 'materials', 'service', 'management'],
};

export function canAccess(role: Role, menu: string): boolean {
  return MENU_ACCESS[role]?.includes(menu) ?? false;
}
