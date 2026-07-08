import express from "express";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

const app = express();

// ── Database ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

function rowToRecipe(row: any) {
  return {
    id: Number(row.id),
    recipeName: row.recipe_name,
    nameZh: row.name_zh ?? null,
    concept: row.concept ?? "Lao Peng You",
    category: row.category,
    subcategory: row.subcategory ?? null,
    station: row.station ?? null,
    recipeVersion: row.recipe_version ?? "1.0",
    status: row.status ?? "draft",
    author: row.author ?? null,
    yieldQty: row.yield_qty !== null ? Number(row.yield_qty) : 0,
    yieldUnit: row.yield_unit ?? "",
    portionSize: row.portion_size !== null ? Number(row.portion_size) : null,
    portionUnit: row.portion_unit ?? null,
    batchMultiplier: row.batch_multiplier !== null ? Number(row.batch_multiplier) : 1,
    prepTime: row.prep_time !== null ? Number(row.prep_time) : null,
    cookTime: row.cook_time !== null ? Number(row.cook_time) : null,
    totalTime: row.total_time !== null ? Number(row.total_time) : null,
    shelfLife: row.shelf_life ?? null,
    storageMethod: row.storage_method ?? null,
    ingredients: row.ingredients ?? "[]",
    steps: row.steps ?? "[]",
    finalAppearance: row.final_appearance ?? null,
    finalTexture: row.final_texture ?? null,
    finalFlavor: row.final_flavor ?? null,
    finalTemp: row.final_temp ?? null,
    platingNotes: row.plating_notes ?? null,
    allergens: row.allergens ?? "[]",
    dietaryFlags: row.dietary_flags ?? "[]",
    foodCostTarget: row.food_cost_target !== null ? Number(row.food_cost_target) : null,
    photoUrl: row.photo_url ?? null,
    chefNotes: row.chef_notes ?? null,
    commonMistakes: row.common_mistakes ?? null,
    criticalPoints: row.critical_points ?? null,
    createdAt: row.created_at !== null ? Number(row.created_at) : Date.now(),
    updatedAt: row.updated_at !== null ? Number(row.updated_at) : Date.now(),
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Uploads — use /tmp on Vercel (ephemeral but works for session)
const UPLOAD_DIR = "/tmp/lpy-uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

app.use("/uploads", express.static(UPLOAD_DIR));

// ── Zod validation schema (mirrors shared/schema.ts insertRecipeSchema) ──────
const insertRecipeSchema = z.object({
  recipeName: z.string().min(1),
  nameZh: z.string().nullable().optional(),
  concept: z.string().default("Lao Peng You"),
  category: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  station: z.string().nullable().optional(),
  recipeVersion: z.string().default("1.0"),
  status: z.string().default("draft"),
  author: z.string().nullable().optional(),
  yieldQty: z.number(),
  yieldUnit: z.string(),
  portionSize: z.number().nullable().optional(),
  portionUnit: z.string().nullable().optional(),
  batchMultiplier: z.number().int().default(1),
  prepTime: z.number().int().nullable().optional(),
  cookTime: z.number().int().nullable().optional(),
  totalTime: z.number().int().nullable().optional(),
  shelfLife: z.string().nullable().optional(),
  storageMethod: z.string().nullable().optional(),
  ingredients: z.string().default("[]"),
  steps: z.string().default("[]"),
  finalAppearance: z.string().nullable().optional(),
  finalTexture: z.string().nullable().optional(),
  finalFlavor: z.string().nullable().optional(),
  finalTemp: z.string().nullable().optional(),
  platingNotes: z.string().nullable().optional(),
  allergens: z.string().default("[]"),
  dietaryFlags: z.string().default("[]"),
  foodCostTarget: z.number().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  chefNotes: z.string().nullable().optional(),
  commonMistakes: z.string().nullable().optional(),
  criticalPoints: z.string().nullable().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all recipes
app.get("/api/recipes", async (req, res) => {
  try {
    const { search, category, concept } = req.query as Record<string, string>;
    let rows;
    if (search) {
      const q = `%${search}%`;
      ({ rows } = await pool.query(
        `SELECT * FROM recipes WHERE recipe_name ILIKE $1 OR name_zh ILIKE $1 OR category ILIKE $1 OR station ILIKE $1 ORDER BY updated_at DESC`,
        [q]
      ));
    } else if (category) {
      ({ rows } = await pool.query(
        `SELECT * FROM recipes WHERE category = $1 ORDER BY recipe_name`,
        [category]
      ));
    } else if (concept) {
      ({ rows } = await pool.query(
        `SELECT * FROM recipes WHERE concept = $1 ORDER BY updated_at DESC`,
        [concept]
      ));
    } else {
      ({ rows } = await pool.query(`SELECT * FROM recipes ORDER BY updated_at DESC`));
    }
    res.json(rows.map(rowToRecipe));
  } catch (e: any) {
    console.error("GET /api/recipes error:", e.message);
    res.status(500).json({ error: "Failed to fetch recipes", detail: e.message });
  }
});

// GET single recipe
app.get("/api/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(`SELECT * FROM recipes WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Recipe not found" });
    res.json(rowToRecipe(rows[0]));
  } catch (e: any) {
    console.error("GET /api/recipes/:id error:", e.message);
    res.status(500).json({ error: "Failed to fetch recipe", detail: e.message });
  }
});

// POST create recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const data = insertRecipeSchema.parse(req.body);
    const now = Date.now();
    const { rows } = await pool.query(
      `INSERT INTO recipes (
        recipe_name, name_zh, concept, category, subcategory, station,
        recipe_version, status, author, yield_qty, yield_unit,
        portion_size, portion_unit, batch_multiplier,
        prep_time, cook_time, total_time, shelf_life, storage_method,
        ingredients, steps, final_appearance, final_texture, final_flavor,
        final_temp, plating_notes, allergens, dietary_flags, food_cost_target,
        photo_url, chef_notes, common_mistakes, critical_points, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
      ) RETURNING *`,
      [
        data.recipeName, data.nameZh ?? null, data.concept, data.category,
        data.subcategory ?? null, data.station ?? null,
        data.recipeVersion ?? "1.0", data.status ?? "draft", data.author ?? null,
        data.yieldQty, data.yieldUnit,
        data.portionSize ?? null, data.portionUnit ?? null, data.batchMultiplier ?? 1,
        data.prepTime ?? null, data.cookTime ?? null, data.totalTime ?? null,
        data.shelfLife ?? null, data.storageMethod ?? null,
        data.ingredients ?? "[]", data.steps ?? "[]",
        data.finalAppearance ?? null, data.finalTexture ?? null,
        data.finalFlavor ?? null, data.finalTemp ?? null, data.platingNotes ?? null,
        data.allergens ?? "[]", data.dietaryFlags ?? "[]",
        data.foodCostTarget ?? null, data.photoUrl ?? null,
        data.chefNotes ?? null, data.commonMistakes ?? null, data.criticalPoints ?? null,
        now, now,
      ]
    );
    res.status(201).json(rowToRecipe(rows[0]));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    console.error("POST /api/recipes error:", e.message);
    res.status(500).json({ error: "Failed to create recipe", detail: e.message });
  }
});

// PATCH update recipe
app.patch("/api/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const data = insertRecipeSchema.partial().parse(req.body);
    const now = Date.now();

    const fieldMap: Record<string, string> = {
      recipeName: "recipe_name", nameZh: "name_zh", concept: "concept",
      category: "category", subcategory: "subcategory", station: "station",
      recipeVersion: "recipe_version", status: "status", author: "author",
      yieldQty: "yield_qty", yieldUnit: "yield_unit",
      portionSize: "portion_size", portionUnit: "portion_unit",
      batchMultiplier: "batch_multiplier", prepTime: "prep_time",
      cookTime: "cook_time", totalTime: "total_time",
      shelfLife: "shelf_life", storageMethod: "storage_method",
      ingredients: "ingredients", steps: "steps",
      finalAppearance: "final_appearance", finalTexture: "final_texture",
      finalFlavor: "final_flavor", finalTemp: "final_temp",
      platingNotes: "plating_notes", allergens: "allergens",
      dietaryFlags: "dietary_flags", foodCostTarget: "food_cost_target",
      photoUrl: "photo_url", chefNotes: "chef_notes",
      commonMistakes: "common_mistakes", criticalPoints: "critical_points",
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (camel in data) {
        setClauses.push(`${snake} = $${idx++}`);
        values.push((data as any)[camel] ?? null);
      }
    }
    setClauses.push(`updated_at = $${idx++}`);
    values.push(now);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE recipes SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: "Recipe not found" });
    res.json(rowToRecipe(rows[0]));
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
    console.error("PATCH /api/recipes/:id error:", e.message);
    res.status(500).json({ error: "Failed to update recipe", detail: e.message });
  }
});

// POST upload photo
app.post("/api/recipes/:id/photo", upload.single("photo"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const ext = (req.file.mimetype.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const newName = `recipe_${id}_${Date.now()}.${ext}`;
  const newPath = path.join(UPLOAD_DIR, newName);
  fs.renameSync(req.file.path, newPath);
  const photoUrl = `/uploads/${newName}`;
  try {
    const { rows } = await pool.query(
      `UPDATE recipes SET photo_url = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [photoUrl, Date.now(), id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Recipe not found" });
    res.json({ photoUrl });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update photo", detail: e.message });
  }
});

// DELETE photo
app.delete("/api/recipes/:id/photo", async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(`SELECT photo_url FROM recipes WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Recipe not found" });
    if (rows[0].photo_url) {
      const filePath = path.join(UPLOAD_DIR, path.basename(rows[0].photo_url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query(`UPDATE recipes SET photo_url = NULL, updated_at = $1 WHERE id = $2`, [Date.now(), id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete photo", detail: e.message });
  }
});

// DELETE recipe
app.delete("/api/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rowCount } = await pool.query(`DELETE FROM recipes WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "Recipe not found" });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete recipe", detail: e.message });
  }
});

export default app;
