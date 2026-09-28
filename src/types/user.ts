export interface Note {
  created: number;
  note: string;
  createdBy?: string;
}

export type UserRole =
  | 'root'
  | 'admin'
  | 'subscriber'
  | 'partner'
  | 'csr'
  | 'installer'
  | 'noc'
  | 'accounting';

export interface User {
  id: string;
  name: string;
  email: string;
  description: string;
  avatar: string;
  userRole: UserRole;
  suspended: boolean;
  blackListed: boolean;
  creationDate: number;
  modified: number;
  lastLogin: number;
  lastPasswordChange: number;
  lastPasswords?: string[];
  locale: string;
  location: string;
  notes?: Note[];
  owner?: string;
  securityPolicy?: string;
  validated?: boolean;
  validationDate?: number;
  validationEmail?: string;
  userTypeProprietaryInfo?: {
    authenticatorSecret?: string;
    mfa?: {
      enabled: boolean;
      method?: 'authenticator' | 'sms' | 'email' | '';
    };
    mobiles?: { number: string }[];
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  currentPassword?: string;
  description?: string;
  userRole: string;
  notes?: { note: string }[];
  emailValidation?: boolean;
  changePassword?: boolean;
}

export interface UpdateUserPayload {
  id: string;
  name?: string;
  email?: string;
  description?: string;
  userRole?: string;
  suspended?: boolean;
  currentPassword?: string;
  notes?: { note: string }[];
}
