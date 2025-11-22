// Stub for auth - not implemented yet
export type UserType = 'guest' | 'free' | 'regular' | 'discipulo' | 'mestre';

export type Session = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    type?: UserType;
  };
};

export async function auth(): Promise<Session | null> {
  return null;
}
