import {UserRole} from './index';

export interface InviteUserDto {
  email: string;
  full_name: string;
  role: UserRole;
}
