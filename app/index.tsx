import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/get-started" />;
}
