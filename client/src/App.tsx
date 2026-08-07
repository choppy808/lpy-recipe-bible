import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { Toaster } from "@/components/ui/toaster";
import LibraryPage from "./pages/Library";
import RecipeFormPage from "./pages/RecipeForm";
import RecipeViewPage from "./pages/RecipeView";
import LoginPage from "./pages/Login";
import UsersPage from "./pages/Users";
import ArchivePage from "./pages/Archive";
import NotFound from "./pages/not-found";
import Sidebar from "./components/Layout";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ backgroundColor: "#f0ebe1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1.1rem" }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={() => (
          <Sidebar>
            <LibraryPage />
          </Sidebar>
        )} />
        <Route path="/new" component={RecipeFormPage} />
        <Route path="/edit/:id" component={RecipeFormPage} />
        <Route path="/recipe/:id" component={RecipeViewPage} />
        <Route path="/archive" component={() => (
          <Sidebar>
            <ArchivePage />
          </Sidebar>
        )} />
        <Route path="/users" component={() => (
          user.role === "admin" ? (
            <Sidebar>
              <UsersPage />
            </Sidebar>
          ) : (
            <Sidebar>
              <div style={{ padding: "2rem", color: "#014643", fontFamily: "DM Serif Display, serif" }}>Access denied.</div>
            </Sidebar>
          )
        )} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
