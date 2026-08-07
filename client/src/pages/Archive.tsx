import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Recipe } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function ArchivePage() {
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    staleTime: 30000,
  });

  const archived = recipes?.filter(r => r.status === "archived") ?? [];

  return (
    <div style={{ background: "#f0ebe1", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ background: "#014643", color: "#faf7f2", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
        <Link href="/">
          <button type="button" style={{ background: "rgba(255,255,255,0.12)", color: "#faf7f2", border: "none", borderRadius: 3, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={13} /> Back
          </button>
        </Link>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6, fontWeight: 600 }}>Lao Peng You</div>
          <div style={{ fontSize: 15, fontFamily: "'DM Serif Display', serif", letterSpacing: "0.02em" }}>Archived Recipes</div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 20px 80px", fontFamily: "'DM Sans', sans-serif" }}>
        {isLoading ? (
          <div style={{ color: "#888", fontSize: 13, padding: 24 }}>Loading…</div>
        ) : archived.length === 0 ? (
          <div style={{ background: "#faf7f2", border: "1px solid #d4ccbc", borderRadius: 4, padding: "32px 24px", textAlign: "center", color: "#888", fontSize: 13 }}>
            No archived recipes yet. Set a recipe's status to <strong>Archived</strong> to store it here.
          </div>
        ) : (
          <div style={{ background: "#faf7f2", border: "1px solid #d4ccbc", borderRadius: 4, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f0ebe1", borderBottom: "1px solid #d4ccbc" }}>
                  <th style={{ textAlign: "left", padding: "9px 18px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Recipe</th>
                  <th style={{ textAlign: "left", padding: "9px 18px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "9px 18px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Version</th>
                  <th style={{ textAlign: "left", padding: "9px 18px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Author</th>
                  <th style={{ padding: "9px 18px" }}></th>
                </tr>
              </thead>
              <tbody>
                {archived.map((recipe, i) => (
                  <tr key={recipe.id} style={{ borderBottom: i < archived.length - 1 ? "1px solid #ece7de" : "none" }}>
                    <td style={{ padding: "11px 18px", fontWeight: 600, color: "#2a2218" }}>
                      {recipe.recipeName}
                      {recipe.nameZh && <span style={{ marginLeft: 8, fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace" }}>{recipe.nameZh}</span>}
                    </td>
                    <td style={{ padding: "11px 18px", color: "#666" }}>{recipe.category ?? "—"}</td>
                    <td style={{ padding: "11px 18px", fontFamily: "'DM Mono', monospace", color: "#014643" }}>v{recipe.recipeVersion ?? "—"}</td>
                    <td style={{ padding: "11px 18px", color: "#666" }}>{recipe.author ?? "—"}</td>
                    <td style={{ padding: "11px 18px", textAlign: "right" }}>
                      <Link href={`/recipe/${recipe.id}`}>
                        <button type="button" style={{ fontSize: 11, fontWeight: 600, color: "#014643", background: "none", border: "1px solid #014643", borderRadius: 3, padding: "4px 12px", cursor: "pointer" }}>
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
