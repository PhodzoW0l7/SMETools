import { UserRole } from "./index";

export interface User {
  id: string;
  org_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email?: string;
}
