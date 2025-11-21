// Stub for auth - not implemented yet
export type UserType = 'guest' | 'free' | 'regular' | 'discipulo' | 'mestre';

export type Session = {
  user?: {
    email?: string;
    name?: string;
    type?: UserType;
  };
};

export async function auth(): Promise<Session | null> {
  return null;
}
