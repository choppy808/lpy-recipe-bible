import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "lpy-secret-key-change-in-prod";

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

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if ((req as any).user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}

// ── Zod schemas ───────────────────────────────────────────────────────────────
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

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1`, [username.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid username or password" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid username or password" });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e: any) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me — verify current token
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

// ── USER MANAGEMENT (admin only) ──────────────────────────────────────────────

// GET /api/users
app.get("/api/users", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, username, role, created_at FROM users ORDER BY created_at ASC`);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users — create a new user
app.post("/api/users", requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at`,
      [username.toLowerCase(), hash, role === "admin" ? "admin" : "staff"]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === "23505") return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH /api/users/:id/password — change a user's password
app.patch("/api/users/:id/password", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, role`,
      [hash, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

// DELETE /api/users/:id
app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  try {
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── RECIPE ROUTES (all protected) ────────────────────────────────────────────

// GET lightweight name index — used for ingredient linking
app.get("/api/recipes/names", requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, recipe_name FROM recipes ORDER BY recipe_name`);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch recipe names" });
  }
});

app.get("/api/recipes", requireAuth, async (req, res) => {
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
      ({ rows } = await pool.query(`SELECT * FROM recipes WHERE category = $1 ORDER BY recipe_name`, [category]));
    } else if (concept) {
      ({ rows } = await pool.query(`SELECT * FROM recipes WHERE concept = $1 ORDER BY updated_at DESC`, [concept]));
    } else {
      ({ rows } = await pool.query(`SELECT * FROM recipes ORDER BY updated_at DESC`));
    }
    res.json(rows.map(rowToRecipe));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch recipes", detail: e.message });
  }
});

app.get("/api/recipes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(`SELECT * FROM recipes WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Recipe not found" });
    res.json(rowToRecipe(rows[0]));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch recipe", detail: e.message });
  }
});

app.post("/api/recipes", requireAuth, async (req, res) => {
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
    res.status(500).json({ error: "Failed to create recipe", detail: e.message });
  }
});

app.patch("/api/recipes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const data = insertRecipeSchema.partial().parse(req.body);
    const now = Date.now();
    // Snapshot current recipe into version history before overwriting
    const { rows: current } = await pool.query(`SELECT * FROM recipes WHERE id = $1`, [id]);
    if (current[0]) {
      await pool.query(
        `INSERT INTO recipe_versions (recipe_id, version_label, saved_by, snapshot, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [id, current[0].recipe_version ?? "1.0", (req as any).user?.username ?? "unknown", JSON.stringify(current[0]), now]
      );
    }
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
    res.status(500).json({ error: "Failed to update recipe", detail: e.message });
  }
});

app.post("/api/recipes/:id/photo", requireAuth, upload.single("photo"), async (req, res) => {
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

app.delete("/api/recipes/:id/photo", requireAuth, async (req, res) => {
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

// GET /api/recipes/:id/versions — list version snapshots for a recipe
app.get("/api/recipes/:id/versions", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(
      `SELECT id, recipe_id, version_label, saved_by, created_at FROM recipe_versions WHERE recipe_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch versions", detail: e.message });
  }
});

// GET /api/versions/:versionId — get full snapshot of a specific version
app.get("/api/versions/:versionId", requireAuth, async (req, res) => {
  const versionId = parseInt(req.params.versionId as string);
  if (isNaN(versionId)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(`SELECT * FROM recipe_versions WHERE id = $1`, [versionId]);
    if (!rows[0]) return res.status(404).json({ error: "Version not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch version", detail: e.message });
  }
});

// POST /api/versions/:versionId/restore — restore a snapshot as the current recipe
app.post("/api/versions/:versionId/restore", requireAuth, async (req, res) => {
  const versionId = parseInt(req.params.versionId as string);
  if (isNaN(versionId)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows: vRows } = await pool.query(`SELECT * FROM recipe_versions WHERE id = $1`, [versionId]);
    if (!vRows[0]) return res.status(404).json({ error: "Version not found" });
    const snap = vRows[0].snapshot;
    const now = Date.now();
    // Snapshot the current recipe first
    const { rows: current } = await pool.query(`SELECT * FROM recipes WHERE id = $1`, [snap.id]);
    if (current[0]) {
      await pool.query(
        `INSERT INTO recipe_versions (recipe_id, version_label, saved_by, snapshot, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [snap.id, current[0].recipe_version ?? "1.0", (req as any).user?.username ?? "unknown", JSON.stringify(current[0]), now]
      );
    }
    const { rows } = await pool.query(
      `UPDATE recipes SET recipe_name=$1,name_zh=$2,category=$3,subcategory=$4,station=$5,recipe_version=$6,status=$7,author=$8,yield_qty=$9,yield_unit=$10,portion_size=$11,portion_unit=$12,batch_multiplier=$13,prep_time=$14,cook_time=$15,total_time=$16,shelf_life=$17,storage_method=$18,ingredients=$19,steps=$20,final_appearance=$21,final_texture=$22,final_flavor=$23,final_temp=$24,plating_notes=$25,allergens=$26,dietary_flags=$27,food_cost_target=$28,chef_notes=$29,common_mistakes=$30,critical_points=$31,updated_at=$32 WHERE id=$33 RETURNING *`,
      [snap.recipe_name,snap.name_zh,snap.category,snap.subcategory,snap.station,snap.recipe_version,snap.status,snap.author,snap.yield_qty,snap.yield_unit,snap.portion_size,snap.portion_unit,snap.batch_multiplier,snap.prep_time,snap.cook_time,snap.total_time,snap.shelf_life,snap.storage_method,snap.ingredients,snap.steps,snap.final_appearance,snap.final_texture,snap.final_flavor,snap.final_temp,snap.plating_notes,snap.allergens,snap.dietary_flags,snap.food_cost_target,snap.chef_notes,snap.common_mistakes,snap.critical_points,now,snap.id]
    );
    res.json(rowToRecipe(rows[0]));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to restore version", detail: e.message });
  }
});

app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
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
