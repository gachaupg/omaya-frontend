import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useRouter } from "next/router";

export const useAuthState = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  return {
    isAuthenticated,
    loading,
  };
};
