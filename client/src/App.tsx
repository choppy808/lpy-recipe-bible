import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LibraryPage from "./pages/Library";
import RecipeFormPage from "./pages/RecipeForm";
import RecipeViewPage from "./pages/RecipeView";
import NotFound from "./pages/not-found";
import Sidebar from "./components/Layout";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          {/* Library — uses sidebar layout */}
          <Route path="/" component={() => (
            <Sidebar>
              <LibraryPage />
            </Sidebar>
          )} />

          {/* Form — full-screen split layout, no sidebar */}
          <Route path="/new" component={RecipeFormPage} />
          <Route path="/edit/:id" component={RecipeFormPage} />

          {/* Recipe view — full-screen card, no sidebar */}
          <Route path="/recipe/:id" component={RecipeViewPage} />

          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
