export type UserRole =
  | 'root'
  | 'admin'
  | 'csr'
  | 'noc'
  | 'installer';

export interface UserNote {
  created: number;
  note: string;
}

export interface UserMfaInfo {
  enabled: boolean;
  method?: 'authenticator' | 'sms' | 'email' | '';
}

export interface User {
  id: string;
  name: string;
  email: string;
  userRole: UserRole;
  avatar?: string;
  description?: string;
  notes?: UserNote[];
  suspended: boolean;
  validated?: boolean;
  lastLogin?: number;
  creationDate?: number;
  modified?: number;
  userTypeProprietaryInfo?: {
    authenticatorSecret?: string;
    mfa?: UserMfaInfo;
    mobiles?: { number: string }[];
  };
}

export interface LoginCredentials {
  userId: string; // OpenWiFi takes userId (usually the email or username)
  password: string;
}

export interface LoginApiResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  // If MFA challenge is required by OWSEC:
  uuid?: string;
  method?: 'authenticator' | 'sms' | 'email';
  ErrorCode?: number;
  ErrorDescription?: string;
}
