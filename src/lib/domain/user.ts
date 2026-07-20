export type AppRole = "admin" | "customer";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_lang: string;
  created_at: string;
  updated_at: string;
};

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
  roles: AppRole[];
};
