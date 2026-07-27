import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recipe, Ingredient, Step } from "@shared/schema";
import { ArrowLeft, Plus, Trash2, AlertTriangle, Save, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

// Parse a time input — accepts plain minutes ("90") or h:mm / Xh / XhYm / XhY format
function parseTimeInput(val: string): number {
  if (!val) return 0;
  const s = val.trim().toLowerCase();
  // Formats: 1h30, 1h 30m, 1h30m, 1:30
  const hm = s.match(/^(\d+)\s*h\s*(\d*)\s*m?$/);
  if (hm) return parseInt(hm[1]) * 60 + (parseInt(hm[2]) || 0);
  // Format: 1:30
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  // Plain number = minutes
  const plain = parseFloat(s);
  return isNaN(plain) ? 0 : Math.round(plain);
}

// Format stored minutes into human-readable string
export function formatMinutes(mins: number | null | undefined): string {
  if (!mins) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

const CATEGORIES = [
  "Prep", "Sauce", "Component", "Dough/Noodle", "Filling",
  "Braise/Stew", "Cold Dish", "Line Dish", "Stock/Broth",
  "Pickle/Ferment", "Dessert", "Family Meal", "Catering", "Festival", "Specials", "Other"
];
const STATIONS = ["Prep", "Dumpling", "Noodle", "Salad / Bing", "All Stations"];
const UNITS = ["g", "kg", "ml", "L", "oz", "lb", "each", "bunch", "tbsp", "tsp", "cup", "clove", "sheet", "piece", "qt", "portions"];
const YIELD_UNITS = ["g", "kg", "ml", "L", "qt", "portions", "pieces", "batches", "servings"];
const ALLERGENS_LIST = ["Gluten", "Soy", "Shellfish", "Fish", "Egg", "Dairy", "Peanut", "Tree Nut", "Sesame", "Sulfite"];
const DIETARY_LIST = ["Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-Free", "Dairy-Free", "Nut-Free"];

function newIngredient(): Ingredient {
  return { id: nanoid(), name: "", quantity: 0, unit: "g", category: "Other", isOptional: false };
}
function newStep(): Step {
  return { id: nanoid(), order: 1, action: "", instruction: "", criticalPoint: false };
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ── Tiny form primitives that match the mockup exactly ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="form-field-label">{children}</label>;
}
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-label">{children}</div>
      <hr className="section-divider" />
    </div>
  );
}

export default function RecipeFormPage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!params.id;

  const { data: existing, isLoading: loadingExisting } = useQuery<Recipe>({
    queryKey: ["/api/recipes", params.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/recipes/${params.id}`);
      return res.json();
    },
    enabled: isEditing,
  });

  const [form, setForm] = useState({
    recipeName: "",
    nameZh: "",
    category: "Prep",
    subcategory: "",
    station: "Prep",
    recipeVersion: "1.0",
    status: "draft",
    author: "chops",
    date: todayStr(),
    yieldQty: "" as string | number,
    yieldUnit: "portions",
    portionSize: "",
    portionUnit: "",
    batchMultiplier: 1,
    prepTime: "",
    cookTime: "",
    totalTime: "",
    shelfLife: "",
    storageMethod: "",
    finalAppearance: "",
    finalTexture: "",
    finalFlavor: "",
    finalTemp: "",
    platingNotes: "",
    allergens: [] as string[],
    dietaryFlags: [] as string[],
    foodCostTarget: "",
    chefNotes: "",
    commonMistakes: "",
    criticalPoints: "",
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([newIngredient()]);
  const [steps, setSteps] = useState<Step[]>([newStep()]);
  const [batchScale, setBatchScale] = useState(1);
  const [customScale, setCustomScale] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        recipeName: existing.recipeName,
        nameZh: existing.nameZh ?? "",
        category: existing.category,
        subcategory: existing.subcategory ?? "",
        station: existing.station ?? "Prep",
        recipeVersion: existing.recipeVersion,
        status: existing.status,
        author: existing.author ?? "",
        date: todayStr(),
        yieldQty: existing.yieldQty,
        yieldUnit: existing.yieldUnit,
        portionSize: existing.portionSize?.toString() ?? "",
        portionUnit: existing.portionUnit ?? "",
        batchMultiplier: existing.batchMultiplier,
        prepTime: existing.prepTime?.toString() ?? "",
        cookTime: existing.cookTime?.toString() ?? "",
        totalTime: existing.totalTime?.toString() ?? "",
        shelfLife: existing.shelfLife ?? "",
        storageMethod: existing.storageMethod ?? "",
        finalAppearance: existing.finalAppearance ?? "",
        finalTexture: existing.finalTexture ?? "",
        finalFlavor: existing.finalFlavor ?? "",
        finalTemp: existing.finalTemp ?? "",
        platingNotes: existing.platingNotes ?? "",
        allergens: JSON.parse(existing.allergens) as string[],
        dietaryFlags: JSON.parse(existing.dietaryFlags) as string[],
        foodCostTarget: existing.foodCostTarget?.toString() ?? "",
        chefNotes: existing.chefNotes ?? "",
        commonMistakes: existing.commonMistakes ?? "",
        criticalPoints: existing.criticalPoints ?? "",
      });
      setIngredients(JSON.parse(existing.ingredients));
      setSteps(JSON.parse(existing.steps));
      if (existing.photoUrl) setPhotoPreview(existing.photoUrl);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/recipes/${params.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/recipes", data);
        return res.json();
      }
    },
    onSuccess: async (data) => {
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const fd = new FormData();
          fd.append("photo", photoFile);
          await fetch(`/api/recipes/${data.id}/photo`, { method: "POST", body: fd });
        } catch {}
        setUploadingPhoto(false);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: isEditing ? "Recipe updated" : "Recipe created", description: form.recipeName as string });
      navigate(`/recipe/${data.id}`);
    },
    onError: () => {
      toast({ title: "Error saving recipe", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalTime = form.totalTime || (
      parseTimeInput(form.prepTime as string) + parseTimeInput(form.cookTime as string)
    ).toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date: _date, ...formData } = form;
    mutation.mutate({
      ...formData,
      concept: "Lao Peng You",
      yieldQty: Number(form.yieldQty) || 0,
      portionSize: form.portionSize ? Number(form.portionSize) : null,
      batchMultiplier: Number(form.batchMultiplier),
      prepTime: form.prepTime ? parseTimeInput(form.prepTime as string) || null : null,
      cookTime: form.cookTime ? parseTimeInput(form.cookTime as string) || null : null,
      totalTime: totalTime ? parseTimeInput(String(totalTime)) || null : null,
      foodCostTarget: form.foodCostTarget ? Number(form.foodCostTarget) : null,
      allergens: JSON.stringify(form.allergens),
      dietaryFlags: JSON.stringify(form.dietaryFlags),
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps.map((s, i) => ({ ...s, order: i + 1 }))),
    });
  };

  const updateField = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const addIngredient = () => setIngredients(i => [...i, newIngredient()]);
  const removeIngredient = (id: string) => setIngredients(i => i.filter(x => x.id !== id));
  const updateIngredient = (id: string, key: keyof Ingredient, val: any) =>
    setIngredients(i => i.map(x => x.id === id ? { ...x, [key]: val } : x));
  const addStep = () => setSteps(s => [...s, { ...newStep(), order: s.length + 1 }]);
  const removeStep = (id: string) => setSteps(s => s.filter(x => x.id !== id));
  const updateStep = (id: string, key: keyof Step, val: any) =>
    setSteps(s => s.map(x => x.id === id ? { ...x, [key]: val } : x));
  const toggleAllergen = (a: string) =>
    setForm(f => ({
      ...f,
      allergens: f.allergens.includes(a) ? f.allergens.filter(x => x !== a) : [...f.allergens, a],
    }));
  const toggleDiet = (d: string) =>
    setForm(f => ({
      ...f,
      dietaryFlags: f.dietaryFlags.includes(d) ? f.dietaryFlags.filter(x => x !== d) : [...f.dietaryFlags, d],
    }));

  const effectiveScale = batchScale;
  const scaledYield = form.yieldQty ? (Number(form.yieldQty) * effectiveScale).toLocaleString() : "—";

  if (loadingExisting) {
    return <div style={{ padding: 40, color: "#888" }}>Loading recipe...</div>;
  }

  /* ══════════════════════════════════════════════════════════
     LIVE PREVIEW (right column)
  ══════════════════════════════════════════════════════════ */
  const PreviewPanel = () => (
    <div className="preview-panel" style={{ padding: "28px 28px 60px", overflowY: "auto", height: "100dvh", position: "sticky", top: 0 }}>
      <div className="preview-card">

        {/* Header */}
        <div className="preview-header">
          <div>
            <span className="preview-logo">LAO PENG YOU</span>
            <span className="preview-logo-zh">老朋友</span>
          </div>
          <span className="preview-version">RECIPE BIBLE — V1.0</span>
        </div>

        {/* Recipe name */}
        <div className="preview-recipe-name">
          {(form.recipeName as string) || <span style={{ color: "#c8c0b0", fontStyle: "italic" }}>Recipe name...</span>}
          {form.nameZh && <span style={{ fontSize: 15, marginLeft: 10, fontStyle: "normal", color: "#888070" }}>{form.nameZh}</span>}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 4 }}>
          {form.category && <span className="tag-green">{form.category}</span>}
          {form.station && <span className="tag-gold">{form.station} Station</span>}
        </div>

        {/* Meta grid */}
        <div className="meta-grid">
          <div className="meta-cell">
            <span className="meta-cell-label">Yield</span>
            <span className="meta-cell-value">
              {form.yieldQty ? `${Number(form.yieldQty) * effectiveScale} ${form.yieldUnit}` : "—"}
            </span>
          </div>
          <div className="meta-cell">
            <span className="meta-cell-label">Portion</span>
            <span className="meta-cell-value">
              {form.portionSize ? `${form.portionSize} ${form.portionUnit}` : "—"}
            </span>
          </div>
          <div className="meta-cell">
            <span className="meta-cell-label">Active / Total</span>
            <span className="meta-cell-value">
              {form.prepTime || form.totalTime
                ? `${formatMinutes(parseTimeInput(form.prepTime as string) || undefined)} / ${formatMinutes(parseTimeInput(form.totalTime as string) || undefined)}`
                : "—"}
            </span>
          </div>
          <div className="meta-cell">
            <span className="meta-cell-label">Shelf Life</span>
            <span className="meta-cell-value" style={{ fontSize: 11 }}>{form.shelfLife || "—"}</span>
          </div>
        </div>

        {/* Ingredients */}
        <div className="preview-section-label">Ingredients</div>
        {ingredients.filter(i => i.name).length === 0 ? (
          <p style={{ color: "#c8c0b0", fontStyle: "italic", fontSize: 12.5 }}>Add ingredients on the left...</p>
        ) : (
          <table className="ing-table">
            <tbody>
              {ingredients.filter(i => i.name).map(ing => (
                <tr key={ing.id}>
                  <td>{ing.quantity ? (ing.quantity * effectiveScale).toLocaleString() : ""}</td>
                  <td>{ing.unit}</td>
                  <td>{ing.name}{ing.nameZh ? <span style={{ color: "#aaa", marginLeft: 5 }}>{ing.nameZh}</span> : null}</td>
                  <td>{ing.prepNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Method */}
        <div className="preview-section-label">Method</div>
        {steps.filter(s => s.instruction || s.action).length === 0 ? (
          <p style={{ color: "#c8c0b0", fontStyle: "italic", fontSize: 12.5 }}>Add method steps...</p>
        ) : (
          <div>
            {steps.map((step, idx) => (
              <div key={step.id} className="step-row">
                <div className={`step-num ${step.criticalPoint ? "ccp" : ""}`}>{idx + 1}</div>
                <div className="step-content">
                  {step.action && <div className="step-action">{step.action}{step.criticalPoint && <span className="ccp-badge">⚠ CCP</span>}</div>}
                  {step.instruction && <div className="step-instruction">{step.instruction}</div>}
                  {(step.duration || step.temp) && (
                    <div className="step-meta">
                      {step.duration && <span>{step.duration}</span>}
                      {step.duration && step.temp && <span> · </span>}
                      {step.temp && <span>{step.temp}</span>}
                    </div>
                  )}
                  {step.visualCue && <div className="step-cue">{step.visualCue}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Storage & Allergens */}
        <div className="bottom-grid">
          <div>
            <div className="preview-section-label" style={{ marginTop: 0 }}>Storage &amp; Holding</div>
            <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.5 }}>
              {form.storageMethod || "—"}
            </div>
          </div>
          <div>
            <div className="preview-section-label" style={{ marginTop: 0 }}>Allergens</div>
            <div>
              {form.allergens.length === 0
                ? <span className="allergen-pill">None Declared</span>
                : form.allergens.map(a => <span key={a} className="allergen-pill">{a}</span>)
              }
            </div>
            {form.dietaryFlags.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {form.dietaryFlags.map(d => <span key={d} className="diet-pill">{d}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Reference photo */}
        <div className="preview-section-label">Reference Photo</div>
        {photoPreview ? (
          <img src={photoPreview} alt="Recipe" style={{ width: "100%", borderRadius: 3, objectFit: "cover", maxHeight: 200, border: "1px solid #d4ccbc" }} />
        ) : (
          <div className="photo-placeholder">Photo Placeholder</div>
        )}

        {/* Chef notes in preview */}
        {form.chefNotes && (
          <>
            <div className="preview-section-label">Chef Notes</div>
            <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{form.chefNotes as string}</div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #d4ccbc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            v{form.recipeVersion} · {form.author || "Author"}
          </span>
          <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {form.date}
          </span>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#f0ebe1" }} data-testid="recipe-form">

      {/* ── LEFT: Form Panel ── */}
      <div className="form-panel" style={{ flex: "0 0 520px", maxWidth: 520, overflowY: "auto", height: "100dvh", borderRight: "1px solid #d4ccbc" }}>

        {/* Top bar inside form panel */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 14px",
          borderBottom: "1px solid #d4ccbc",
          background: "#014643",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/">
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} data-testid="button-back">
                <ArrowLeft size={14} />
              </button>
            </Link>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", color: "#faf7f2", fontSize: 15, letterSpacing: "0.02em" }}>
                Lao Peng You <span style={{ fontSize: 13, opacity: 0.75 }}>老朋友</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Recipe Bible — Template Generator
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              style={{
                background: "#faf7f2", color: "#014643",
                border: "none", borderRadius: 3, padding: "7px 16px",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
                letterSpacing: "0.06em", textTransform: "uppercase",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                opacity: mutation.isPending ? 0.6 : 1,
              }}
              data-testid="button-save"
            >
              <Save size={13} />
              {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Save Recipe"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 20px 60px" }}>

          {/* ── RECIPE INFO ── */}
          <SectionHeader>Recipe Info</SectionHeader>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Recipe Name *</FieldLabel>
            <input className="form-input" value={form.recipeName as string} onChange={e => updateField("recipeName", e.target.value)}
              placeholder="e.g. Shanxi Chili Oil" required data-testid="input-recipe-name" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Chinese Name / Subtitle</FieldLabel>
            <input className="form-input" value={form.nameZh} onChange={e => updateField("nameZh", e.target.value)}
              placeholder="e.g. 山西辣椒油 — house chili oil" data-testid="input-name-zh" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select className="form-select" value={form.category} onChange={e => updateField("category", e.target.value)} data-testid="select-category">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Station</FieldLabel>
              <select className="form-select" value={form.station} onChange={e => updateField("station", e.target.value)} data-testid="select-station">
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            <div>
              <FieldLabel>Author / Chef</FieldLabel>
              <input className="form-input" value={form.author} onChange={e => updateField("author", e.target.value)} placeholder="chops" data-testid="input-author" />
            </div>
            <div>
              <FieldLabel>Version</FieldLabel>
              <input className="form-input" value={form.recipeVersion} onChange={e => updateField("recipeVersion", e.target.value)} placeholder="1.0" data-testid="input-version" />
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input className="form-input" type="date" value={form.date} onChange={e => updateField("date", e.target.value)} data-testid="input-date" />
            </div>
          </div>

          {/* ── YIELD & TIMES ── */}
          <SectionHeader>Yield &amp; Times</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <FieldLabel>Yield Qty</FieldLabel>
              <input className="form-input" type="number" min="0" step="any" value={form.yieldQty as string}
                onChange={e => updateField("yieldQty", e.target.value)} placeholder="2" data-testid="input-yield-qty" />
            </div>
            <div>
              <FieldLabel>Yield Unit</FieldLabel>
              <select className="form-select" value={form.yieldUnit} onChange={e => updateField("yieldUnit", e.target.value)}>
                {YIELD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Portion Size</FieldLabel>
              <input className="form-input" value={form.portionSize} onChange={e => updateField("portionSize", e.target.value)}
                placeholder="60 g / order" data-testid="input-portion-size" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            <div>
              <FieldLabel>Active Time</FieldLabel>
              <input className="form-input" type="text" value={form.prepTime}
                onChange={e => {
                  updateField("prepTime", e.target.value);
                  const mins = parseTimeInput(e.target.value);
                  const cookMins = parseTimeInput(form.cookTime as string);
                  const t = mins + cookMins;
                  updateField("totalTime", t > 0 ? String(t) : "");
                }} placeholder="30 or 1h30" data-testid="input-prep-time" />
            </div>
            <div>
              <FieldLabel>Total Time</FieldLabel>
              <input className="form-input" type="text" value={form.totalTime}
                onChange={e => updateField("totalTime", e.target.value)} placeholder="60 or 2h30" data-testid="input-total-time" />
            </div>
            <div>
              <FieldLabel>Shelf Life / Hold</FieldLabel>
              <input className="form-input" value={form.shelfLife} onChange={e => updateField("shelfLife", e.target.value)}
                placeholder="5 days refrigerated" data-testid="input-shelf-life" />
            </div>
          </div>

          {/* ── BATCH SCALING ── */}
          <SectionHeader>Batch Scaling</SectionHeader>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {[{ label: "½×", val: 0.5 }, { label: "1×", val: 1 }, { label: "2×", val: 2 }, { label: "3×", val: 3 }, { label: "4×", val: 4 }].map(b => (
              <button
                key={b.label} type="button"
                className={`scale-btn${batchScale === b.val ? " active" : ""}`}
                onClick={() => { setBatchScale(b.val); setCustomScale(""); }}
                data-testid={`scale-btn-${b.label}`}
              >
                {b.label}
              </button>
            ))}
            <input
              className="form-input"
              style={{ width: 72, display: "inline-block" }}
              placeholder="Custom"
              value={customScale}
              onChange={e => {
                setCustomScale(e.target.value);
                const v = parseFloat(e.target.value);
                if (v > 0) setBatchScale(v);
              }}
              data-testid="input-custom-scale"
            />
          </div>
          <div style={{ fontSize: 11.5, color: "#888070", marginBottom: 24, lineHeight: 1.5 }}>
            Enter base quantities below — scaling recalculates the printed recipe.<br />
            Print each batch size you need.
          </div>

          {/* ── INGREDIENTS ── */}
          <SectionHeader>Ingredients</SectionHeader>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "56px 90px 1fr 100px 20px", gap: 6, marginBottom: 6 }}>
            {["Qty", "Unit", "Ingredient", "Prep note", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b0a898" }}>{h}</span>
            ))}
          </div>
          <div style={{ marginBottom: 12 }} data-testid="ingredients-list">
            {ingredients.map((ing, idx) => (
              <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "56px 90px 1fr 100px 20px", gap: 6, marginBottom: 6, alignItems: "center" }} data-testid={`ingredient-row-${idx}`}>
                <input
                  className="form-input" type="number" min="0" step="any"
                  style={{ padding: "6px 8px" }}
                  value={ing.quantity || ""}
                  onChange={e => updateIngredient(ing.id, "quantity", parseFloat(e.target.value))}
                  data-testid={`input-ing-qty-${idx}`}
                />
                <select className="form-select" style={{ padding: "6px 24px 6px 8px" }} value={ing.unit} onChange={e => updateIngredient(ing.id, "unit", e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  className="form-input"
                  style={{ padding: "6px 8px" }}
                  value={ing.name}
                  onChange={e => updateIngredient(ing.id, "name", e.target.value)}
                  placeholder="Ingredient"
                  data-testid={`input-ing-name-${idx}`}
                />
                <input
                  className="form-input"
                  style={{ padding: "6px 8px" }}
                  value={ing.prepNote ?? ""}
                  onChange={e => updateIngredient(ing.id, "prepNote", e.target.value)}
                  placeholder="Prep note"
                  data-testid={`input-ing-prep-${idx}`}
                />
                <button type="button" onClick={() => removeIngredient(ing.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#c8c0b0", padding: 2, display: "flex", alignItems: "center" }}
                  data-testid={`button-remove-ing-${idx}`}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addIngredient}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#014643", background: "none", border: "1.5px dashed #b8c8c6", borderRadius: 3, padding: "6px 14px", cursor: "pointer", marginBottom: 24, letterSpacing: "0.04em" }}
            data-testid="button-add-ingredient">
            <Plus size={13} /> Add Ingredient
          </button>

          {/* ── METHOD ── */}
          <SectionHeader>Method</SectionHeader>
          <div style={{ marginBottom: 12 }} data-testid="steps-list">
            {steps.map((step, idx) => (
              <div key={step.id} style={{ marginBottom: 14, padding: "12px 14px", background: "#f8f5ef", border: "1px solid #d4ccbc", borderRadius: 3 }} data-testid={`step-card-${idx}`}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: step.criticalPoint ? "#c0392b" : "#014643",
                    color: "#faf7f2", fontFamily: "'DM Mono', monospace",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: 8, marginBottom: 8 }}>
                      <div>
                        <FieldLabel>Action</FieldLabel>
                        <input className="form-input" style={{ padding: "5px 8px" }} value={step.action}
                          onChange={e => updateStep(step.id, "action", e.target.value)}
                          placeholder="e.g. Season the protein" data-testid={`input-step-action-${idx}`} />
                      </div>
                      <div>
                        <FieldLabel>Duration</FieldLabel>
                        <input className="form-input" style={{ padding: "5px 8px" }} value={step.duration ?? ""}
                          onChange={e => updateStep(step.id, "duration", e.target.value)}
                          placeholder="2–3 min" data-testid={`input-step-duration-${idx}`} />
                      </div>
                      <div>
                        <FieldLabel>Temp</FieldLabel>
                        <input className="form-input" style={{ padding: "5px 8px" }} value={step.temp ?? ""}
                          onChange={e => updateStep(step.id, "temp", e.target.value)}
                          placeholder="165°F" data-testid={`input-step-temp-${idx}`} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <FieldLabel>Full Instruction</FieldLabel>
                      <textarea className="form-input" rows={3}
                        style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
                        value={step.instruction}
                        onChange={e => updateStep(step.id, "instruction", e.target.value)}
                        placeholder="Detailed step. Include what to look for, quantities, common mistakes..."
                        data-testid={`input-step-instruction-${idx}`}
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <FieldLabel>Visual Cue</FieldLabel>
                      <input className="form-input" style={{ padding: "5px 8px" }} value={step.visualCue ?? ""}
                        onChange={e => updateStep(step.id, "visualCue", e.target.value)}
                        placeholder="e.g. Oil shimmers; edges turn translucent"
                        data-testid={`input-step-visual-${idx}`} />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: step.criticalPoint ? "#c0392b" : "#888070" }}>
                      <input type="checkbox" checked={step.criticalPoint}
                        onChange={e => updateStep(step.id, "criticalPoint", e.target.checked)}
                        data-testid={`switch-critical-${idx}`}
                        style={{ accentColor: "#c0392b" }}
                      />
                      <AlertTriangle size={12} style={{ color: "#c0392b" }} />
                      Critical Control Point (CCP)
                    </label>
                  </div>
                  <button type="button" onClick={() => removeStep(step.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#c8c0b0", padding: 2, flexShrink: 0 }}
                    data-testid={`button-remove-step-${idx}`}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStep}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#014643", background: "none", border: "1.5px dashed #b8c8c6", borderRadius: 3, padding: "6px 14px", cursor: "pointer", marginBottom: 24, letterSpacing: "0.04em" }}
            data-testid="button-add-step">
            <Plus size={13} /> Add Step
          </button>

          {/* ── STORAGE & HOLDING ── */}
          <SectionHeader>Storage &amp; Holding</SectionHeader>
          <div style={{ marginBottom: 24 }}>
            <textarea className="form-input" rows={2}
              style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
              value={form.storageMethod}
              onChange={e => updateField("storageMethod", e.target.value)}
              placeholder="e.g. Vacuum seal, store in hotel pan with parchment, refrigerate at 36–40°F..."
              data-testid="input-storage-method"
            />
          </div>

          {/* ── ALLERGENS & DIETARY ── */}
          <SectionHeader>Allergens &amp; Dietary</SectionHeader>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Allergens Present</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {ALLERGENS_LIST.map(a => (
                <label key={a} style={{
                  display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                  fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                  padding: "4px 10px", borderRadius: 2, cursor: "pointer",
                  border: form.allergens.includes(a) ? "1.5px solid #c0392b" : "1px solid #c8c0b0",
                  background: form.allergens.includes(a) ? "rgba(192,57,43,0.08)" : "#f8f5ef",
                  color: form.allergens.includes(a) ? "#c0392b" : "#888070",
                  transition: "all 0.1s",
                }} data-testid={`allergen-${a}`}>
                  <input type="checkbox" className="sr-only" checked={form.allergens.includes(a)} onChange={() => toggleAllergen(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <FieldLabel>Dietary Flags</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {DIETARY_LIST.map(d => (
                <label key={d} style={{
                  display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                  fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                  padding: "4px 10px", borderRadius: 2, cursor: "pointer",
                  border: form.dietaryFlags.includes(d) ? "1.5px solid #014643" : "1px solid #c8c0b0",
                  background: form.dietaryFlags.includes(d) ? "rgba(1,70,67,0.08)" : "#f8f5ef",
                  color: form.dietaryFlags.includes(d) ? "#014643" : "#888070",
                  transition: "all 0.1s",
                }} data-testid={`diet-${d}`}>
                  <input type="checkbox" className="sr-only" checked={form.dietaryFlags.includes(d)} onChange={() => toggleDiet(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          {/* ── QUALITY STANDARDS ── */}
          <SectionHeader>Quality Standards</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <FieldLabel>Appearance</FieldLabel>
              <input className="form-input" value={form.finalAppearance}
                onChange={e => updateField("finalAppearance", e.target.value)}
                placeholder="e.g. Deep amber, glossy coat" data-testid="input-appearance" />
            </div>
            <div>
              <FieldLabel>Texture</FieldLabel>
              <input className="form-input" value={form.finalTexture}
                onChange={e => updateField("finalTexture", e.target.value)}
                placeholder="e.g. Silky, tender" data-testid="input-texture" />
            </div>
            <div>
              <FieldLabel>Flavor Profile</FieldLabel>
              <input className="form-input" value={form.finalFlavor}
                onChange={e => updateField("finalFlavor", e.target.value)}
                placeholder="e.g. Savory, numbing heat, hint of smoke" data-testid="input-flavor" />
            </div>
            <div>
              <FieldLabel>Serve Temp</FieldLabel>
              <input className="form-input" value={form.finalTemp}
                onChange={e => updateField("finalTemp", e.target.value)}
                placeholder="e.g. Room temp, 140°F+" data-testid="input-final-temp" />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <FieldLabel>Plating &amp; Portioning Notes</FieldLabel>
            <textarea className="form-input" rows={2}
              style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
              value={form.platingNotes}
              onChange={e => updateField("platingNotes", e.target.value)}
              placeholder="e.g. Serve in chilled bowl, 6 pieces per portion, garnish with scallion..."
              data-testid="input-plating-notes"
            />
          </div>

          {/* ── CHEF NOTES ── */}
          <SectionHeader>Chef Notes &amp; Training</SectionHeader>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Chef Notes</FieldLabel>
            <textarea className="form-input" rows={3}
              style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
              value={form.chefNotes}
              onChange={e => updateField("chefNotes", e.target.value)}
              placeholder="Context, history, technique insights, preferred sourcing..."
              data-testid="input-chef-notes"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Common Mistakes to Avoid</FieldLabel>
            <textarea className="form-input" rows={3}
              style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
              value={form.commonMistakes}
              onChange={e => updateField("commonMistakes", e.target.value)}
              placeholder="List the most common errors line cooks make with this dish..."
              data-testid="input-common-mistakes"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <FieldLabel>Critical Control Points (Food Safety)</FieldLabel>
            <textarea className="form-input" rows={2}
              style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }}
              value={form.criticalPoints}
              onChange={e => updateField("criticalPoints", e.target.value)}
              placeholder="Temperature thresholds, cross-contamination risks, holding time limits..."
              data-testid="input-critical-points"
            />
          </div>

          {/* ── PHOTO UPLOAD ── */}
          <SectionHeader>Recipe Photo</SectionHeader>
          <div style={{ marginBottom: 32 }}>
            {photoPreview && (
              <div style={{ position: "relative", marginBottom: 10, maxWidth: 320 }}>
                <img src={photoPreview} alt="Recipe photo" style={{ width: "100%", borderRadius: 3, objectFit: "cover", maxHeight: 220, border: "1px solid #d4ccbc" }} />
                <button type="button"
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", padding: 5, cursor: "pointer", color: "#fff", display: "flex" }}
                  data-testid="button-remove-photo">
                  <X size={13} />
                </button>
              </div>
            )}
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              border: "1.5px dashed #b8892a", borderRadius: 3, padding: "24px 16px",
              cursor: "pointer", background: "rgba(184,137,42,0.03)", transition: "all 0.12s",
            }} data-testid="photo-upload-area">
              <Camera size={24} style={{ color: "#b8892a" }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: "#b8892a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {photoPreview ? "Replace Photo" : "Upload Photo"}
              </div>
              <div style={{ fontSize: 11, color: "#b0a070" }}>JPG, PNG, WEBP up to 10MB</div>
              <input type="file" accept="image/*" className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
                data-testid="input-photo"
              />
            </label>
            {uploadingPhoto && <div style={{ fontSize: 12, color: "#888070", marginTop: 8 }}>Uploading photo...</div>}
          </div>

          {/* Save footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #d4ccbc" }}>
            <Link href="/">
              <button type="button" style={{ background: "none", border: "1px solid #c8c0b0", borderRadius: 3, padding: "8px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888070", cursor: "pointer" }} data-testid="button-cancel">
                Cancel
              </button>
            </Link>
            <button type="submit" disabled={mutation.isPending}
              style={{ background: "#014643", color: "#faf7f2", border: "none", borderRadius: 3, padding: "8px 20px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, opacity: mutation.isPending ? 0.7 : 1 }}
              data-testid="button-save-footer">
              <Save size={14} />
              {mutation.isPending ? "Saving..." : isEditing ? "Update Recipe" : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>

      {/* ── RIGHT: Preview Panel ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <PreviewPanel />
      </div>
    </div>
  );
}
