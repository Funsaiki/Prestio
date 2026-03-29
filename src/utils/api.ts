import { auth } from '../config/firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}
