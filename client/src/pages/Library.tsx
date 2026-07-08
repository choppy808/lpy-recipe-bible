import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";
import { PlusCircle, Search, Clock, ChefHat, Layers, Trash2, Eye, Pencil, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "All", "Prep", "Sauce", "Component", "Dough/Noodle", "Filling",
  "Braise/Stew", "Cold Dish", "Line Dish", "Stock/Broth",
  "Pickle/Ferment", "Dessert", "Family Meal", "Specials", "Other"
];
const STATUSES = ["All", "draft", "active", "archived"];

function statusBadge(status: string) {
  if (status === "active") return <span className="status-badge-active">Active</span>;
  if (status === "archived") return <span className="status-badge-archived">Archived</span>;
  return <span className="status-badge-draft">Draft</span>;
}

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const { toast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  else if (category !== "All") params.set("category", category);

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes", search, category],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/recipes?${params.toString()}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe deleted" });
    },
  });

  const filtered = recipes.filter(r => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    return true;
  });

  const grouped: Record<string, Recipe[]> = {};
  filtered.forEach(r => {
    const key = r.category || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#014643", marginBottom: 4 }}>
            Recipe Library
          </div>
          <div style={{ fontSize: 12, color: "#888070", letterSpacing: "0.04em" }}>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} · Lao Peng You 老朋友
          </div>
        </div>
        <Link href="/new">
          <button style={{
            background: "#014643", color: "#faf7f2",
            border: "none", borderRadius: 3,
            padding: "9px 18px", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, fontSize: 12, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
          }} data-testid="button-new-recipe">
            <PlusCircle size={14} /> New Recipe
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }} data-testid="filter-bar">
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
          <input
            style={{
              width: "100%", padding: "7px 10px 7px 32px",
              background: "#f8f5ef", border: "1px solid #c8c0b0",
              borderRadius: 3, fontSize: 13, color: "#1a2e2c",
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
            placeholder="Search recipes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <select
          style={{
            background: "#f8f5ef", border: "1px solid #c8c0b0",
            borderRadius: 3, padding: "7px 28px 7px 10px", fontSize: 13,
            color: "#1a2e2c", fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", outline: "none", minWidth: 150,
            appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23014643' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
          value={category}
          onChange={e => setCategory(e.target.value)}
          data-testid="select-category"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>
        <select
          style={{
            background: "#f8f5ef", border: "1px solid #c8c0b0",
            borderRadius: 3, padding: "7px 28px 7px 10px", fontSize: 13,
            color: "#1a2e2c", fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", outline: "none", minWidth: 120,
            appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23014643' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          data-testid="select-status"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Skeleton loading */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ border: "1px solid #e0d8cc", borderRadius: 4, height: 140, background: "#ede8df", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }} data-testid="empty-state">
          <BookOpen size={36} style={{ color: "#c8c0b0", marginBottom: 16 }} />
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#014643", marginBottom: 8 }}>No recipes yet</div>
          <div style={{ fontSize: 13, color: "#888070", marginBottom: 20 }}>Start building your recipe bible by adding your first recipe.</div>
          <Link href="/new">
            <button style={{
              background: "#014643", color: "#faf7f2", border: "none", borderRadius: 3,
              padding: "9px 18px", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, fontSize: 12, letterSpacing: "0.06em",
              textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            }}>
              <PlusCircle size={14} /> Add First Recipe
            </button>
          </Link>
        </div>
      )}

      {/* Grouped recipe grid */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, recs]) => (
            <div key={cat}>
              {/* Category divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#014643", whiteSpace: "nowrap" }}>{cat}</span>
                <div style={{ flex: 1, height: 1, background: "#d4ccbc" }} />
                <span style={{ fontSize: 10, color: "#aaa", whiteSpace: "nowrap" }}>{recs.length}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {recs.map(recipe => (
                  <div key={recipe.id} className="recipe-card-library" style={{ position: "relative" }} data-testid={`card-recipe-${recipe.id}`}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#014643", fontWeight: 400, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {recipe.recipeName}
                        </div>
                        {recipe.nameZh && (
                          <div style={{ fontSize: 11, color: "#888070" }}>{recipe.nameZh}</div>
                        )}
                      </div>
                      {statusBadge(recipe.status)}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10, fontSize: 11, color: "#888070" }}>
                      {recipe.station && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ChefHat size={11} />{recipe.station}
                        </span>
                      )}
                      {recipe.totalTime && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} />{recipe.totalTime}min
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Layers size={11} />{recipe.yieldQty.toLocaleString()} {recipe.yieldUnit}
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.04em", marginBottom: 10 }}>
                      v{recipe.recipeVersion}{recipe.subcategory ? ` · ${recipe.subcategory}` : ""}
                    </div>

                    {/* Actions — always visible */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/recipe/${recipe.id}`}>
                        <button style={{
                          background: "none", border: "1px solid #c8c0b0", borderRadius: 2,
                          padding: "4px 10px", fontSize: 11, fontWeight: 600,
                          letterSpacing: "0.04em", textTransform: "uppercase",
                          color: "#014643", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                        }} data-testid={`button-view-${recipe.id}`}>
                          <Eye size={11} /> View
                        </button>
                      </Link>
                      <Link href={`/edit/${recipe.id}`}>
                        <button style={{
                          background: "none", border: "1px solid #c8c0b0", borderRadius: 2,
                          padding: "4px 10px", fontSize: 11, fontWeight: 600,
                          letterSpacing: "0.04em", textTransform: "uppercase",
                          color: "#014643", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                        }} data-testid={`button-edit-${recipe.id}`}>
                          <Pencil size={11} /> Edit
                        </button>
                      </Link>
                      <button
                        style={{
                          background: "none", border: "1px solid transparent", borderRadius: 2,
                          padding: "4px 8px", fontSize: 11,
                          color: "#c8c0b0", cursor: "pointer", display: "flex", alignItems: "center",
                        }}
                        onClick={() => {
                          const pw = prompt(`Enter password to delete "${recipe.recipeName}":`);
                          if (pw === null) return;
                          if (pw !== "1234") { alert("Incorrect password."); return; }
                          deleteMutation.mutate(recipe.id!);
                        }}
                        data-testid={`button-delete-${recipe.id}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
