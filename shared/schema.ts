import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipes table
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Header
  recipeName: text("recipe_name").notNull(),
  nameZh: text("name_zh"), // Chinese name
  concept: text("concept").notNull().default("Lao Peng You"), // LPY or Nu Peng You
  category: text("category").notNull(), // e.g. "Cold Dish", "Sauce", "Protein", etc.
  subcategory: text("subcategory"),
  station: text("station"), // e.g. "Prep", "Wok", "Cold Station"
  recipeVersion: text("recipe_version").notNull().default("1.0"),
  status: text("status").notNull().default("draft"), // draft | active | archived
  author: text("author"),
  
  // Yield & Scaling
  yieldQty: real("yield_qty").notNull(),
  yieldUnit: text("yield_unit").notNull(), // grams, portions, liters, etc.
  portionSize: real("portion_size"),
  portionUnit: text("portion_unit"),
  batchMultiplier: integer("batch_multiplier").notNull().default(1),
  
  // Timing
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  totalTime: integer("total_time"), // minutes
  shelfLife: text("shelf_life"), // e.g. "3 days refrigerated"
  storageMethod: text("storage_method"),
  
  // Ingredients JSON (array of ingredient objects)
  ingredients: text("ingredients").notNull().default("[]"), // JSON
  
  // Steps JSON (array of step objects)
  steps: text("steps").notNull().default("[]"), // JSON
  
  // Quality Control
  finalAppearance: text("final_appearance"),
  finalTexture: text("final_texture"),
  finalFlavor: text("final_flavor"),
  finalTemp: text("final_temp"),
  platingNotes: text("plating_notes"),
  
  // Allergens & Diet (JSON array of strings)
  allergens: text("allergens").notNull().default("[]"),
  dietaryFlags: text("dietary_flags").notNull().default("[]"),
  
  // Costings
  foodCostTarget: real("food_cost_target"), // percentage e.g. 28.5
  
  // Photo
  photoUrl: text("photo_url"),

  // Notes
  chefNotes: text("chef_notes"),
  commonMistakes: text("common_mistakes"),
  criticalPoints: text("critical_points"),
  
  // Timestamps
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Ingredient object shape (stored as JSON in ingredients column)
export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameZh: z.string().optional(),
  quantity: z.number(),
  unit: z.string(), // g, kg, ml, L, each, tbsp, tsp, oz
  prepNote: z.string().optional(), // e.g. "julienned", "blanched"
  category: z.string().optional(), // "protein", "aromatics", "sauce", "garnish"
  isOptional: z.boolean().default(false),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Step object shape
export const stepSchema = z.object({
  id: z.string(),
  order: z.number(),
  action: z.string(), // brief action title
  instruction: z.string(), // full instruction
  duration: z.string().optional(), // "2-3 min"
  temp: z.string().optional(), // "high heat", "165°F", etc.
  visualCue: z.string().optional(), // what to look for
  criticalPoint: z.boolean().default(false),
});

export type Step = z.infer<typeof stepSchema>;
