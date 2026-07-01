import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export type EnrollResult = {
  queueId: string;
  identity: string;
  enrolledAt: string;
  conflict: boolean;
  cancelled: boolean;
};

export function useEnrollment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollResult | null>(null);

  const enroll = async (queueId: string, identity: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/enrollments/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, identity }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? json?.message ?? `HTTP ${res.status}`);
        return false;
      }
      setResult(json as EnrollResult);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (queueId: string, identity: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/enrollments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, identity }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        return false;
      }
      setResult(null);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { enroll, cancel, loading, error, result };
}
