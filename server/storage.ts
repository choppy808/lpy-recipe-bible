import { Pool } from "pg";
import type { Recipe, InsertRecipe } from "@shared/schema";

// Connection pool — DATABASE_URL must be set in the environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Helper: map a raw Postgres row (snake_case) to our Recipe type (camelCase)
function rowToRecipe(row: any): Recipe {
  return {
    id: Number(row.id),
    recipeName: row.recipe_name,
    nameZh: row.name_zh,
    concept: row.concept,
    category: row.category,
    subcategory: row.subcategory,
    station: row.station,
    recipeVersion: row.recipe_version,
    status: row.status,
    author: row.author,
    yieldQty: row.yield_qty !== null ? Number(row.yield_qty) : null,
    yieldUnit: row.yield_unit,
    portionSize: row.portion_size !== null ? Number(row.portion_size) : null,
    portionUnit: row.portion_unit,
    batchMultiplier: row.batch_multiplier !== null ? Number(row.batch_multiplier) : null,
    prepTime: row.prep_time !== null ? Number(row.prep_time) : null,
    cookTime: row.cook_time !== null ? Number(row.cook_time) : null,
    totalTime: row.total_time !== null ? Number(row.total_time) : null,
    shelfLife: row.shelf_life,
    storageMethod: row.storage_method,
    ingredients: row.ingredients,
    steps: row.steps,
    finalAppearance: row.final_appearance,
    finalTexture: row.final_texture,
    finalFlavor: row.final_flavor,
    finalTemp: row.final_temp,
    platingNotes: row.plating_notes,
    allergens: row.allergens,
    dietaryFlags: row.dietary_flags,
    foodCostTarget: row.food_cost_target !== null ? Number(row.food_cost_target) : null,
    photoUrl: row.photo_url,
    chefNotes: row.chef_notes,
    commonMistakes: row.common_mistakes,
    criticalPoints: row.critical_points,
    createdAt: row.created_at !== null ? Number(row.created_at) : null,
    updatedAt: row.updated_at !== null ? Number(row.updated_at) : null,
  };
}

export interface IStorage {
  getAllRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(data: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, data: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  searchRecipes(query: string): Promise<Recipe[]>;
  getRecipesByCategory(category: string): Promise<Recipe[]>;
  getRecipesByConcept(concept: string): Promise<Recipe[]>;
}

export class Storage implements IStorage {
  async getAllRecipes(): Promise<Recipe[]> {
    const { rows } = await pool.query(
      "SELECT * FROM recipes ORDER BY updated_at DESC"
    );
    return rows.map(rowToRecipe);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const { rows } = await pool.query(
      "SELECT * FROM recipes WHERE id = $1",
      [id]
    );
    return rows[0] ? rowToRecipe(rows[0]) : undefined;
  }

  async createRecipe(data: InsertRecipe): Promise<Recipe> {
    const now = Date.now();
    const { rows } = await pool.query(
      `INSERT INTO recipes (
        recipe_name, name_zh, concept, category, subcategory, station,
        recipe_version, status, author,
        yield_qty, yield_unit, portion_size, portion_unit, batch_multiplier,
        prep_time, cook_time, total_time, shelf_life, storage_method,
        ingredients, steps,
        final_appearance, final_texture, final_flavor, final_temp, plating_notes,
        allergens, dietary_flags, food_cost_target, photo_url,
        chef_notes, common_mistakes, critical_points,
        created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
      ) RETURNING *`,
      [
        data.recipeName, data.nameZh ?? null, data.concept, data.category,
        data.subcategory ?? null, data.station ?? null,
        data.recipeVersion ?? "1.0", data.status ?? "draft", data.author ?? null,
        data.yieldQty, data.yieldUnit,
        data.portionSize ?? null, data.portionUnit ?? null,
        data.batchMultiplier ?? 1,
        data.prepTime ?? null, data.cookTime ?? null, data.totalTime ?? null,
        data.shelfLife ?? null, data.storageMethod ?? null,
        data.ingredients ?? "[]", data.steps ?? "[]",
        data.finalAppearance ?? null, data.finalTexture ?? null,
        data.finalFlavor ?? null, data.finalTemp ?? null,
        data.platingNotes ?? null,
        data.allergens ?? "[]", data.dietaryFlags ?? "[]",
        data.foodCostTarget ?? null, data.photoUrl ?? null,
        data.chefNotes ?? null, data.commonMistakes ?? null,
        data.criticalPoints ?? null,
        now, now,
      ]
    );
    return rowToRecipe(rows[0]);
  }

  async updateRecipe(id: number, data: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const now = Date.now();

    // Build dynamic SET clause from provided fields
    const fieldMap: Record<string, string> = {
      recipeName: "recipe_name",
      nameZh: "name_zh",
      concept: "concept",
      category: "category",
      subcategory: "subcategory",
      station: "station",
      recipeVersion: "recipe_version",
      status: "status",
      author: "author",
      yieldQty: "yield_qty",
      yieldUnit: "yield_unit",
      portionSize: "portion_size",
      portionUnit: "portion_unit",
      batchMultiplier: "batch_multiplier",
      prepTime: "prep_time",
      cookTime: "cook_time",
      totalTime: "total_time",
      shelfLife: "shelf_life",
      storageMethod: "storage_method",
      ingredients: "ingredients",
      steps: "steps",
      finalAppearance: "final_appearance",
      finalTexture: "final_texture",
      finalFlavor: "final_flavor",
      finalTemp: "final_temp",
      platingNotes: "plating_notes",
      allergens: "allergens",
      dietaryFlags: "dietary_flags",
      foodCostTarget: "food_cost_target",
      photoUrl: "photo_url",
      chefNotes: "chef_notes",
      commonMistakes: "common_mistakes",
      criticalPoints: "critical_points",
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (camel in data) {
        setClauses.push(`${snake} = $${paramIdx++}`);
        values.push((data as any)[camel] ?? null);
      }
    }

    // Always update updated_at
    setClauses.push(`updated_at = $${paramIdx++}`);
    values.push(now);

    // WHERE id
    values.push(id);

    if (setClauses.length === 1) {
      // Only updated_at — still run it
    }

    const { rows } = await pool.query(
      `UPDATE recipes SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return rows[0] ? rowToRecipe(rows[0]) : undefined;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      "DELETE FROM recipes WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const q = `%${query}%`;
    const { rows } = await pool.query(
      `SELECT * FROM recipes
       WHERE recipe_name ILIKE $1 OR name_zh ILIKE $1 OR category ILIKE $1 OR station ILIKE $1
       ORDER BY updated_at DESC`,
      [q]
    );
    return rows.map(rowToRecipe);
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    const { rows } = await pool.query(
      "SELECT * FROM recipes WHERE category = $1 ORDER BY recipe_name",
      [category]
    );
    return rows.map(rowToRecipe);
  }

  async getRecipesByConcept(concept: string): Promise<Recipe[]> {
    const { rows } = await pool.query(
      "SELECT * FROM recipes WHERE concept = $1 ORDER BY updated_at DESC",
      [concept]
    );
    return rows.map(rowToRecipe);
  }
}

export const storage = new Storage();
