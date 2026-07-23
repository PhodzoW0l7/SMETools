import { OrgMode } from "./index";

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  mode: OrgMode;
  created_at: string;
  updated_at: string;
}
