import { useCallback } from "react";
import { useNavigate } from "react-router";

import { ApiError } from "./api";
import { loginPathFor } from "./guards";
import { clearSession, loadSession, type Role } from "./session";

export function useAuthorized(role: Role) {
  const navigate = useNavigate();

  return useCallback(
    async <T>(request: (token: string) => Promise<T>): Promise<T | null> => {
      const session = loadSession();
      if (session) {
        try {
          return await request(session.accessToken);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) throw error;
        }
      }
      clearSession();
      navigate(`${loginPathFor(role)}?expired=1`);
      return null;
    },
    [navigate, role],
  );
}
