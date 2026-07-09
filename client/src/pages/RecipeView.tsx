import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recipe, Ingredient, Step } from "@shared/schema";
import { ArrowLeft, Pencil, Printer, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function RecipeViewPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [batchScale, setBatchScale] = useState(1);

  // Fetch all recipe names for ingredient linking
  const { data: recipeNames } = useQuery<{ id: number; recipe_name: string }[]>({
    queryKey: ["/api/recipes/names"],
    staleTime: 60000,
  });

  // Build a lookup map: normalized name -> recipe id
  const recipeNameMap = new Map<string, number>();
  (recipeNames ?? []).forEach(r => {
    recipeNameMap.set(r.recipe_name.toLowerCase().trim(), r.id);
  });

  // Find a linked recipe id for an ingredient name (fuzzy: check if any recipe name
  // is contained within the ingredient name or vice versa)
  function findLinkedRecipe(ingName: string): number | null {
    const normalized = ingName.toLowerCase().trim();
    // Exact match first
    if (recipeNameMap.has(normalized)) return recipeNameMap.get(normalized)!;
    // Partial match: ingredient name contains a recipe name
    for (const [name, id] of recipeNameMap.entries()) {
      if (name.length > 4 && (normalized.includes(name) || name.includes(normalized))) {
        return id;
      }
    }
    return null;
  }

  const { data: recipe, isLoading } = useQuery<Recipe>({
    queryKey: ["/api/recipes", params.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/recipes/${params.id}`);
      return res.json();
    },
    enabled: !!params.id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/recipes/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe deleted" });
      navigate("/");
    },
  });

  if (isLoading) return <div style={{ padding: 40, color: "#888" }}>Loading...</div>;
  if (!recipe) return <div style={{ padding: 40, color: "#888" }}>Recipe not found.</div>;

  const ingredients: Ingredient[] = JSON.parse(recipe.ingredients || "[]");
  const steps: Step[] = JSON.parse(recipe.steps || "[]");
  const allergens: string[] = JSON.parse(recipe.allergens || "[]");
  const dietaryFlags: string[] = JSON.parse(recipe.dietaryFlags || "[]");
  const criticalSteps = steps.filter(s => s.criticalPoint);

  const scaledQty = (qty: number) => {
    const scaled = qty * batchScale;
    if (scaled % 1 === 0) return scaled.toLocaleString();
    return scaled.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div style={{ background: "#f0ebe1", minHeight: "100dvh" }}>

      {/* Action bar — no print */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "#014643", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <Link href="/">
          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }} data-testid="button-back">
            <ArrowLeft size={14} /> Library
          </button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Batch scale */}
          <div style={{ display: "flex", gap: 5, marginRight: 6 }}>
            {[{ label: "½×", val: 0.5 }, { label: "1×", val: 1 }, { label: "2×", val: 2 }, { label: "3×", val: 3 }, { label: "4×", val: 4 }].map(b => (
              <button key={b.label} type="button"
                onClick={() => setBatchScale(b.val)}
                style={{
                  background: batchScale === b.val ? "#faf7f2" : "rgba(255,255,255,0.12)",
                  color: batchScale === b.val ? "#014643" : "rgba(255,255,255,0.8)",
                  border: "none", borderRadius: 3, padding: "5px 10px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.04em",
                }}
                data-testid={`scale-btn-${b.label}`}>
                {b.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => window.print()}
            style={{ background: "rgba(255,255,255,0.12)", color: "#faf7f2", border: "none", borderRadius: 3, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}
            data-testid="button-print">
            <Printer size={13} /> Print
          </button>
          <Link href={`/edit/${recipe.id}`}>
            <button type="button" style={{ background: "rgba(255,255,255,0.12)", color: "#faf7f2", border: "none", borderRadius: 3, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }} data-testid="button-edit">
              <Pencil size={13} /> Edit
            </button>
          </Link>
          <button type="button"
            style={{ background: "none", color: "rgba(255,100,80,0.8)", border: "none", borderRadius: 3, padding: "6px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => {
              const pw = prompt(`Enter password to delete "${recipe.recipeName}":`);
              if (pw === null) return;
              if (pw !== "1234") { alert("Incorrect password."); return; }
              deleteMutation.mutate();
            }}
            data-testid="button-delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Recipe card */}
      <div style={{ maxWidth: 680, margin: "32px auto", padding: "0 20px 80px" }} data-testid="recipe-card">
        <div style={{ background: "#faf7f2", border: "1px solid #d4ccbc", borderRadius: 4, padding: "32px 36px" }}>

          {/* LPY Header */}
          <div className="preview-header">
            <div>
              <span className="preview-logo">LAO PENG YOU</span>
              <span className="preview-logo-zh">老朋友</span>
            </div>
            <span className="preview-version">RECIPE BIBLE — V1.0</span>
          </div>

          {/* Recipe name */}
          <div className="preview-recipe-name">
            {recipe.recipeName}
            {recipe.nameZh && <span style={{ fontSize: 16, marginLeft: 12, fontStyle: "normal", color: "#888070", fontFamily: "'DM Sans', sans-serif" }}>{recipe.nameZh}</span>}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 4 }}>
            <span className="tag-green">{recipe.category}</span>
            {recipe.station && <span className="tag-gold">{recipe.station} Station</span>}
            {recipe.status !== "active" && (
              <span style={{ display: "inline-block", marginLeft: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 2, background: recipe.status === "archived" ? "#e0dcd4" : "#e8dfc8", color: recipe.status === "archived" ? "#888070" : "#6b5a2a" }}>
                {recipe.status}
              </span>
            )}
          </div>

          {/* Meta grid */}
          <div className="meta-grid">
            <div className="meta-cell">
              <span className="meta-cell-label">Yield</span>
              <span className="meta-cell-value">
                {batchScale !== 1
                  ? `${(recipe.yieldQty * batchScale).toLocaleString()} ${recipe.yieldUnit} (${batchScale}×)`
                  : `${recipe.yieldQty.toLocaleString()} ${recipe.yieldUnit}`}
              </span>
            </div>
            <div className="meta-cell">
              <span className="meta-cell-label">Portion</span>
              <span className="meta-cell-value">{recipe.portionSize ? `${recipe.portionSize} ${recipe.portionUnit ?? ""}` : "—"}</span>
            </div>
            <div className="meta-cell">
              <span className="meta-cell-label">Active / Total</span>
              <span className="meta-cell-value">{recipe.prepTime || recipe.totalTime ? `${recipe.prepTime ?? "?"}min / ${recipe.totalTime ?? "?"}min` : "—"}</span>
            </div>
            <div className="meta-cell">
              <span className="meta-cell-label">Shelf Life</span>
              <span className="meta-cell-value" style={{ fontSize: 11 }}>{recipe.shelfLife || "—"}</span>
            </div>
          </div>

          {/* CCP callout */}
          {criticalSteps.length > 0 && (
            <div style={{ border: "1px solid rgba(192,57,43,0.25)", borderRadius: 3, padding: "12px 14px", background: "rgba(192,57,43,0.05)", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c0392b", marginBottom: 8 }}>
                <AlertTriangle size={13} /> Critical Control Points
              </div>
              {criticalSteps.map(s => (
                <div key={s.id} style={{ display: "flex", gap: 8, fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: "#c0392b", fontWeight: 600 }}>Step {s.order}</span>
                  <span style={{ color: "#888070" }}>—</span>
                  <span>{s.action}</span>
                </div>
              ))}
            </div>
          )}

          {/* INGREDIENTS */}
          <div className="preview-section-label">Ingredients{batchScale !== 1 && <span style={{ fontWeight: 400, fontSize: 11, letterSpacing: "0.04em", marginLeft: 8, color: "#b8892a" }}>Scaled {batchScale}×</span>}</div>
          {ingredients.length === 0 ? (
            <p style={{ color: "#c8c0b0", fontStyle: "italic", fontSize: 12.5 }}>No ingredients.</p>
          ) : (
            <table className="ing-table">
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} data-testid={`ing-row-${ing.id}`}>
                    <td>{ing.quantity ? scaledQty(ing.quantity) : ""}</td>
                    <td>{ing.unit}</td>
                    <td>
                      {(() => {
                        const linkedId = findLinkedRecipe(ing.name);
                        // Don't link to the recipe currently being viewed
                        if (linkedId && linkedId !== Number(params.id)) {
                          return (
                            <Link href={`/recipe/${linkedId}`}>
                              <a
                                data-testid={`link-ingredient-recipe-${ing.id}`}
                                style={{
                                  color: "#014643",
                                  textDecoration: "none",
                                  borderBottom: "1px solid #b8892a",
                                  paddingBottom: 1,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                                title={`Go to recipe: ${ing.name}`}
                              >
                                {ing.name}
                                <ExternalLink size={10} style={{ color: "#b8892a", flexShrink: 0 }} />
                              </a>
                            </Link>
                          );
                        }
                        return <>{ing.name}</>;
                      })()}
                      {ing.nameZh && <span style={{ color: "#aaa", marginLeft: 5, fontSize: 11 }}>{ing.nameZh}</span>}
                      {ing.isOptional && <span style={{ color: "#aaa", marginLeft: 5, fontStyle: "italic", fontSize: 11 }}>opt.</span>}
                    </td>
                    <td>{ing.prepNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* METHOD */}
          <div className="preview-section-label">Method</div>
          {steps.length === 0 ? (
            <p style={{ color: "#c8c0b0", fontStyle: "italic", fontSize: 12.5 }}>No steps.</p>
          ) : (
            <div>
              {steps.map((step, idx) => (
                <div key={step.id} className="step-row" data-testid={`step-view-${idx}`}>
                  <div className={`step-num ${step.criticalPoint ? "ccp" : ""}`}>{step.order}</div>
                  <div className="step-content">
                    {step.action && (
                      <div className="step-action">
                        {step.action}
                        {step.criticalPoint && <span className="ccp-badge"><AlertTriangle size={9} /> CCP</span>}
                      </div>
                    )}
                    {step.instruction && <div className="step-instruction">{step.instruction}</div>}
                    {(step.duration || step.temp) && (
                      <div className="step-meta">
                        {[step.duration, step.temp].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {step.visualCue && <div className="step-cue">Look for: {step.visualCue}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STORAGE & ALLERGENS */}
          <div className="bottom-grid">
            <div>
              <div className="preview-section-label" style={{ marginTop: 0 }}>Storage &amp; Holding</div>
              <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }}>
                {recipe.storageMethod || "—"}
              </div>
              {recipe.shelfLife && (
                <div style={{ fontSize: 11, color: "#888070", marginTop: 4 }}>{recipe.shelfLife}</div>
              )}
            </div>
            <div>
              <div className="preview-section-label" style={{ marginTop: 0 }}>Allergens</div>
              <div>
                {allergens.length === 0
                  ? <span className="allergen-pill">None Declared</span>
                  : allergens.map(a => <span key={a} className="allergen-pill" data-testid={`allergen-tag-${a}`}>{a}</span>)
                }
              </div>
              {dietaryFlags.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {dietaryFlags.map(d => <span key={d} className="diet-pill" data-testid={`diet-tag-${d}`}>{d}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* QC / Plating */}
          {(recipe.finalAppearance || recipe.finalTexture || recipe.finalFlavor || recipe.finalTemp || recipe.platingNotes) && (
            <>
              <div className="preview-section-label">Quality Standards</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[
                  { label: "Appearance", val: recipe.finalAppearance },
                  { label: "Texture", val: recipe.finalTexture },
                  { label: "Flavor", val: recipe.finalFlavor },
                  { label: "Serve Temp", val: recipe.finalTemp },
                ].filter(x => x.val).map(({ label, val }) => (
                  <div key={label} style={{ border: "1px solid #d4ccbc", borderRadius: 3, padding: "8px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888070", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: "#1a2e2c" }}>{val}</div>
                  </div>
                ))}
              </div>
              {recipe.platingNotes && (
                <div style={{ border: "1px solid #d4ccbc", borderRadius: 3, padding: "8px 12px", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888070", marginBottom: 3 }}>Plating &amp; Portioning</div>
                  <div style={{ fontSize: 12.5, color: "#1a2e2c" }}>{recipe.platingNotes}</div>
                </div>
              )}
            </>
          )}

          {/* Chef Notes */}
          {(recipe.chefNotes || recipe.commonMistakes) && (
            <>
              <div className="preview-section-label">Chef Notes &amp; Training</div>
              {recipe.chefNotes && (
                <div style={{ marginBottom: 10, fontSize: 12.5, color: "#444", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{recipe.chefNotes}</div>
              )}
              {recipe.commonMistakes && (
                <div style={{ border: "1px solid rgba(192,57,43,0.2)", borderRadius: 3, padding: "10px 12px", background: "rgba(192,57,43,0.04)", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c0392b", marginBottom: 4 }}>Common Mistakes</div>
                  <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{recipe.commonMistakes}</div>
                </div>
              )}
            </>
          )}

          {/* Reference photo */}
          {recipe.photoUrl ? (
            <>
              <div className="preview-section-label">Reference Photo</div>
              <img src={recipe.photoUrl} alt={recipe.recipeName} style={{ width: "100%", borderRadius: 3, objectFit: "cover", maxHeight: 280, border: "1px solid #d4ccbc" }} />
            </>
          ) : null}

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 12, borderTop: "1px solid #d4ccbc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Lao Peng You · Recipe Bible
            </span>
            <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              v{recipe.recipeVersion} · {recipe.author ? `by ${recipe.author}` : ""}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
