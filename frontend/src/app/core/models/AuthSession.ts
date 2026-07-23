import {User} from './User';
import { Organisation } from './Organisation';

export interface AuthSession {
  user: User;
  organisation: Organisation;
}