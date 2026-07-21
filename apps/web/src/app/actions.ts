'use server';

import { cookies }        from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function reviewContextUnit(
  unitId:  string,
  action:  'approved' | 'rejected',
  note?:   string
): Promise<{ ok: boolean; error?: string }> {
  const token = cookies().get('synapse_token')?.value;
  if (!token) return { ok: false, error: 'Not authenticated' };

  try {
    const res = await fetch(
      `${API_URL}/context-units/${unitId}/review`,
      {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, note }),
      }
    );

    if (!res.ok) {
      const err = await res.json() as { error: { message: string } };
      return { ok: false, error: err.error.message };
    }

    revalidatePath('/queue');
    revalidatePath('/knowledge');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — is the API running?' };
  }
}
