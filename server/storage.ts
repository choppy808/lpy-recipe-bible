import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { recipes, type Recipe, type InsertRecipe } from "@shared/schema";
import { eq, like, or, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

// Initialize table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_name TEXT NOT NULL,
    name_zh TEXT,
    concept TEXT NOT NULL DEFAULT 'Lao Peng You',
    category TEXT NOT NULL,
    subcategory TEXT,
    station TEXT,
    recipe_version TEXT NOT NULL DEFAULT '1.0',
    status TEXT NOT NULL DEFAULT 'draft',
    author TEXT,
    yield_qty REAL NOT NULL,
    yield_unit TEXT NOT NULL,
    portion_size REAL,
    portion_unit TEXT,
    batch_multiplier INTEGER NOT NULL DEFAULT 1,
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    shelf_life TEXT,
    storage_method TEXT,
    ingredients TEXT NOT NULL DEFAULT '[]',
    steps TEXT NOT NULL DEFAULT '[]',
    final_appearance TEXT,
    final_texture TEXT,
    final_flavor TEXT,
    final_temp TEXT,
    plating_notes TEXT,
    allergens TEXT NOT NULL DEFAULT '[]',
    dietary_flags TEXT NOT NULL DEFAULT '[]',
    food_cost_target REAL,
    photo_url TEXT,
    chef_notes TEXT,
    common_mistakes TEXT,
    critical_points TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )
`);

// Migrations — safely add columns that may be missing in older databases
const existingCols = sqlite.pragma('table_info(recipes)').map((c: any) => c.name);
if (!existingCols.includes('photo_url')) {
  sqlite.exec('ALTER TABLE recipes ADD COLUMN photo_url TEXT');
}

export interface IStorage {
  getAllRecipes(): Recipe[];
  getRecipe(id: number): Recipe | undefined;
  createRecipe(data: InsertRecipe): Recipe;
  updateRecipe(id: number, data: Partial<InsertRecipe>): Recipe | undefined;
  deleteRecipe(id: number): boolean;
  searchRecipes(query: string): Recipe[];
  getRecipesByCategory(category: string): Recipe[];
  getRecipesByConcept(concept: string): Recipe[];
}

export class Storage implements IStorage {
  getAllRecipes(): Recipe[] {
    return db.select().from(recipes).orderBy(desc(recipes.updatedAt)).all();
  }

  getRecipe(id: number): Recipe | undefined {
    return db.select().from(recipes).where(eq(recipes.id, id)).get();
  }

  createRecipe(data: InsertRecipe): Recipe {
    const now = Date.now();
    return db
      .insert(recipes)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning()
      .get();
  }

  updateRecipe(id: number, data: Partial<InsertRecipe>): Recipe | undefined {
    const now = Date.now();
    return db
      .update(recipes)
      .set({ ...data, updatedAt: now })
      .where(eq(recipes.id, id))
      .returning()
      .get();
  }

  deleteRecipe(id: number): boolean {
    const result = db.delete(recipes).where(eq(recipes.id, id)).run();
    return result.changes > 0;
  }

  searchRecipes(query: string): Recipe[] {
    const q = `%${query}%`;
    return db
      .select()
      .from(recipes)
      .where(
        or(
          like(recipes.recipeName, q),
          like(recipes.nameZh, q),
          like(recipes.category, q),
          like(recipes.station, q)
        )
      )
      .orderBy(desc(recipes.updatedAt))
      .all();
  }

  getRecipesByCategory(category: string): Recipe[] {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.category, category))
      .orderBy(recipes.recipeName)
      .all();
  }

  getRecipesByConcept(concept: string): Recipe[] {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.concept, concept))
      .orderBy(desc(recipes.updatedAt))
      .all();
  }
}

export const storage = new Storage();

// ── Seed data — runs on every cold start, inserts if DB is empty ──
function seedIfEmpty() {
  const count = sqlite.prepare('SELECT COUNT(*) as c FROM recipes').get() as { c: number };
  if (count.c > 0) return;

  const now = Date.now();
  const insert = sqlite.prepare(`
    INSERT INTO recipes (
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
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
  `);

  const seedRecipes = [
    ["Chili Oil Wontons","红油抄手","Lao Peng You","Cold Dish","Sichuan","Cold Station","2.1","active","Daniel",1500,"g",150,"g",1,20,5,25,"3 days refrigerated","Hotel pan, covered with plastic wrap on surface","[{\"id\":\"1\",\"name\":\"Pork & Shrimp Wontons\",\"nameZh\":\"鲜肉虾仁馄饨\",\"quantity\":1000,\"unit\":\"g\",\"category\":\"Protein\",\"prepNote\":\"boiled, drained\"},{\"id\":\"2\",\"name\":\"Chili Oil\",\"nameZh\":\"红油\",\"quantity\":80,\"unit\":\"ml\",\"category\":\"Sauce\",\"prepNote\":\"house-made\"},{\"id\":\"3\",\"name\":\"Black Vinegar\",\"nameZh\":\"镇江醋\",\"quantity\":30,\"unit\":\"ml\",\"category\":\"Sauce\"},{\"id\":\"4\",\"name\":\"Soy Sauce\",\"nameZh\":\"生抽\",\"quantity\":25,\"unit\":\"ml\",\"category\":\"Sauce\"},{\"id\":\"5\",\"name\":\"Sesame Paste\",\"nameZh\":\"芝麻酱\",\"quantity\":40,\"unit\":\"g\",\"category\":\"Sauce\"},{\"id\":\"6\",\"name\":\"Scallion\",\"nameZh\":\"香葱\",\"quantity\":30,\"unit\":\"g\",\"category\":\"Garnish\",\"prepNote\":\"thinly sliced\"},{\"id\":\"7\",\"name\":\"Crushed Peanuts\",\"quantity\":20,\"unit\":\"g\",\"category\":\"Garnish\",\"prepNote\":\"toasted, rough crush\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Boil wontons\",\"instruction\":\"Bring a large pot of unsalted water to a rolling boil. Drop wontons one by one — do not overcrowd. Cook 3–4 min until wrappers are translucent and filling is cooked through.\",\"duration\":\"3–4 min\",\"temp\":\"Rolling boil\",\"visualCue\":\"Wonton floats and puffs; press gently — should spring back\",\"criticalPoint\":true},{\"id\":\"s2\",\"order\":2,\"action\":\"Drain & cool slightly\",\"instruction\":\"Transfer wontons to colander. Shake off excess water. Do not run cold water.\",\"criticalPoint\":false},{\"id\":\"s3\",\"order\":3,\"action\":\"Build the sauce\",\"instruction\":\"Combine chili oil, black vinegar, soy sauce, and sesame paste. Whisk until emulsified.\",\"criticalPoint\":false},{\"id\":\"s4\",\"order\":4,\"action\":\"Dress wontons\",\"instruction\":\"Add drained wontons to sauce bowl immediately while still warm. Fold gently.\",\"criticalPoint\":true},{\"id\":\"s5\",\"order\":5,\"action\":\"Plate & garnish\",\"instruction\":\"Portion 150g per bowl. Top with scallion and crushed peanuts.\",\"criticalPoint\":false}]","","","","","","[\"Gluten\",\"Shellfish\",\"Soy\",\"Sesame\",\"Peanut\"]","[]",22.5,null,"The sauce ratio is everything. Sesame paste should emulsify fully.","1. Overcooking wontons\n2. Not shaking off enough water\n3. Saucing too early or too late","Internal temp of pork filling must reach 165°F."],
    ["Garlic Water","","Lao Peng You","Prep","","Prep","1.0","active","chops",1100,"g",null,"g",1,8,20,28,"2 days refrigerated","Cooled, covered, in cambro","[{\"id\":\"1\",\"name\":\"Garlic\",\"quantity\":100,\"unit\":\"g\",\"category\":\"Other\",\"isOptional\":false,\"prepNote\":\"smashed\"},{\"id\":\"2\",\"name\":\"Water\",\"quantity\":1000,\"unit\":\"g\",\"category\":\"Other\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Weigh and smash garlic\",\"instruction\":\"Smash garlic with flat side of a cleaver and add to a heat safe container. Skins can stay on.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Boil water and pour over garlic\",\"instruction\":\"Bring water to a boil and pour over the smashed garlic.\",\"criticalPoint\":false,\"temp\":\"Boiling\"},{\"id\":\"3\",\"order\":3,\"action\":\"Steep covered\",\"instruction\":\"Allow to steep covered for 20 minutes. Garlic may turn green — this is oxidation and is fine.\",\"criticalPoint\":false},{\"id\":\"4\",\"order\":4,\"action\":\"Strain and store\",\"instruction\":\"Strain, cool, cover, label, and refrigerate.\",\"criticalPoint\":false}]","","","","","","[]","[\"Vegan\",\"Gluten-Free\"]",null,null,"","",""],
    ["Garlic Milk","","Lao Peng You","Sauce","","Prep","1.0","active","chops",3840,"g",null,"g",1,10,5,15,"","","[{\"id\":\"1\",\"name\":\"Water\",\"quantity\":3200,\"unit\":\"g\",\"category\":\"Other\"},{\"id\":\"2\",\"name\":\"Garlic\",\"quantity\":400,\"unit\":\"g\",\"category\":\"Aromatics\",\"prepNote\":\"peeled\"},{\"id\":\"3\",\"name\":\"Cooked Oil\",\"quantity\":120,\"unit\":\"g\",\"category\":\"Sauce\",\"prepNote\":\"heated to smoking point, cooled slightly\"},{\"id\":\"4\",\"name\":\"Water (for blending)\",\"quantity\":120,\"unit\":\"g\",\"category\":\"Other\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Heat the oil\",\"instruction\":\"Heat oil to smoking point then turn off burner.\",\"criticalPoint\":false},{\"id\":\"s2\",\"order\":2,\"action\":\"Blend\",\"instruction\":\"Add garlic, 120g water, and smoked oil to Vitamix. Blend until completely smooth.\",\"criticalPoint\":false},{\"id\":\"s3\",\"order\":3,\"action\":\"Combine\",\"instruction\":\"Transfer to container, add 3200g water, stir to combine.\",\"criticalPoint\":false}]","","","","","","[]","[\"Vegan\",\"Gluten-Free\"]",null,null,"","",""],
    ["Salad Dressing Base","","Lao Peng You","Sauce","Dressing","Prep","1.0","active","chops",1800,"g",null,"g",1,5,20,25,"","Cool completely before use or storing","[{\"id\":\"1\",\"name\":\"Light Soy\",\"quantity\":1200,\"unit\":\"g\",\"category\":\"Sauce\"},{\"id\":\"2\",\"name\":\"Rock Sugar\",\"quantity\":400,\"unit\":\"g\",\"category\":\"Seasoning\"},{\"id\":\"3\",\"name\":\"Cane Sugar\",\"quantity\":200,\"unit\":\"g\",\"category\":\"Seasoning\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Heat soy\",\"instruction\":\"Bring light soy up to 87°C.\",\"temp\":\"87°C\",\"criticalPoint\":true},{\"id\":\"s2\",\"order\":2,\"action\":\"Dissolve sugars\",\"instruction\":\"Add sugars and cook under a boil, stirring, until fully dissolved.\",\"criticalPoint\":false},{\"id\":\"s3\",\"order\":3,\"action\":\"Check nappe\",\"instruction\":\"Cook until sauce is smooth and just about nappe — finger line on back of spoon should hold without closing.\",\"criticalPoint\":true},{\"id\":\"s4\",\"order\":4,\"action\":\"Cool\",\"instruction\":\"Let cool completely before using or storing.\",\"criticalPoint\":false}]","Deep amber, smooth, glossy","Nappe — coats spoon","Sweet, balanced, not bitter","","","[\"Soy\",\"Gluten\"]","[\"Vegan\"]",null,null,"Nappe = dip spoon, run finger across back — gap should not close.","Overcooking makes it bitter. Boiling too hard reduces unevenly.",""],
    ["Salad Dressing","","Lao Peng You","Sauce","Dressing","Salad / Bing","1.0","active","chops",2215,"g",null,"g",1,15,0,15,"Refrigerated","Store in refrigerator","[{\"id\":\"1\",\"name\":\"Salad Dressing Base\",\"quantity\":1200,\"unit\":\"g\",\"prepNote\":\"cooled\"},{\"id\":\"2\",\"name\":\"Garlic Water\",\"quantity\":600,\"unit\":\"g\"},{\"id\":\"3\",\"name\":\"Pickled Chili\",\"quantity\":200,\"unit\":\"g\"},{\"id\":\"4\",\"name\":\"Black Vinegar\",\"quantity\":60,\"unit\":\"g\"},{\"id\":\"5\",\"name\":\"Chili Paste with Garlic\",\"quantity\":85,\"unit\":\"g\"},{\"id\":\"6\",\"name\":\"Chao Tian Chili (dried)\",\"quantity\":70,\"unit\":\"g\",\"prepNote\":\"rehydrated, chopped fine\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Rehydrate chili\",\"instruction\":\"Soak dried Chao Tian Chili in hot water until soft.\",\"criticalPoint\":false},{\"id\":\"s2\",\"order\":2,\"action\":\"Chop chili\",\"instruction\":\"Chop to size of crushed red pepper flakes. Drain excess water.\",\"criticalPoint\":false},{\"id\":\"s3\",\"order\":3,\"action\":\"Combine all\",\"instruction\":\"Combine all ingredients and mix well.\",\"criticalPoint\":false},{\"id\":\"s4\",\"order\":4,\"action\":\"Store\",\"instruction\":\"Refrigerate.\",\"criticalPoint\":false}]","","","Sweet-savory, spicy, tangy","","","[\"Soy\",\"Gluten\"]","[\"Vegan\"]",null,null,"Ensure Dressing Base is fully cooled before combining.","Using warm Dressing Base dulls fresh chili aromatics.",""],
    ["Seasoned Soy","","Lao Peng You","Sauce","Braising Base","Prep","1.0","active","chops",4375,"g",null,"g",1,10,20,30,"Refrigerated, spices reusable up to 3 times","Store in cooler. Reserve strained spices separately (max 3 uses).","[{\"id\":\"1\",\"name\":\"Light Soy\",\"quantity\":2150,\"unit\":\"g\"},{\"id\":\"2\",\"name\":\"Salt Brine\",\"quantity\":900,\"unit\":\"g\"},{\"id\":\"3\",\"name\":\"Water\",\"quantity\":725,\"unit\":\"g\"},{\"id\":\"4\",\"name\":\"Rock Sugar\",\"quantity\":600,\"unit\":\"g\"},{\"id\":\"5\",\"name\":\"Caraway\",\"quantity\":30,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"6\",\"name\":\"Nutmeg\",\"quantity\":24,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"7\",\"name\":\"Brown Peppercorn\",\"quantity\":12,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"8\",\"name\":\"Dried Ginger\",\"quantity\":12,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"9\",\"name\":\"Clove\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"10\",\"name\":\"Cinnamon\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"11\",\"name\":\"Cumin\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"12\",\"name\":\"Star Anise\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"13\",\"name\":\"White Cardamom\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"14\",\"name\":\"White Pepper\",\"quantity\":8,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"15\",\"name\":\"Bay Leaf\",\"quantity\":4,\"unit\":\"g\",\"prepNote\":\"toasted\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Toast spices\",\"instruction\":\"Toast all spices in a dry pan on low heat until fragrant. Do not burn.\",\"criticalPoint\":true},{\"id\":\"s2\",\"order\":2,\"action\":\"Heat liquids to 87°C\",\"instruction\":\"Combine Light Soy, Salt Brine, and Water. Heat to 87°C.\",\"temp\":\"87°C\",\"criticalPoint\":true},{\"id\":\"s3\",\"order\":3,\"action\":\"Dissolve sugar\",\"instruction\":\"Add Rock Sugar and stir until fully dissolved.\",\"criticalPoint\":false},{\"id\":\"s4\",\"order\":4,\"action\":\"Add spices & simmer\",\"instruction\":\"Add toasted spices. Simmer on low for 10 min. Do not boil.\",\"temp\":\"Low simmer\",\"criticalPoint\":true},{\"id\":\"s5\",\"order\":5,\"action\":\"Strain & reserve spices\",\"instruction\":\"Strain. Reserve spices for reuse up to 3 total uses.\",\"criticalPoint\":false}]","","","Complex, five-spice adjacent, savory-sweet","","","[\"Soy\",\"Gluten\"]","[]",null,null,"Spices reusable up to 3 total uses — label and store separately.","Boiling instead of simmering = bitter, flat flavor.","Do not exceed a simmer. Spice reuse max 3 times."],
    ["Dan Dan Dressing Soy","","Lao Peng You","Sauce","Dan Dan","Prep","1.0","active","chops",7880,"g",null,"g",1,5,0,5,"","8qt Cambro, refrigerated","[{\"id\":\"1\",\"name\":\"Black Vinegar\",\"quantity\":4000,\"unit\":\"g\"},{\"id\":\"2\",\"name\":\"Light Soy\",\"quantity\":3400,\"unit\":\"g\"},{\"id\":\"3\",\"name\":\"Uncut Dark Soy\",\"quantity\":480,\"unit\":\"g\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Combine\",\"instruction\":\"Add all three ingredients to an 8qt Cambro. Stir to combine.\",\"criticalPoint\":false}]","","","Sharp vinegar-forward, savory soy depth","","","[\"Soy\",\"Sulfite\"]","[\"Vegan\"]",null,null,"Uncut dark soy means undiluted — use as-is.","Using regular dark soy instead of uncut — flavor and color will be off.",""],
    ["Dan Dan Sesame Paste","","Lao Peng You","Sauce","Dan Dan","Prep","1.0","active","chops",1620,"g",null,"g",1,5,10,15,"","Airtight container, refrigerated","[{\"id\":\"1\",\"name\":\"Sesame Seeds\",\"quantity\":1200,\"unit\":\"g\",\"prepNote\":\"toasted\"},{\"id\":\"2\",\"name\":\"Sesame Oil\",\"quantity\":420,\"unit\":\"g\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Toast sesame seeds\",\"instruction\":\"Toast in a pan over medium heat until golden and fragrant. Stir constantly.\",\"criticalPoint\":true},{\"id\":\"s2\",\"order\":2,\"action\":\"Blend immediately\",\"instruction\":\"Transfer hot seeds to Vitamix. Add sesame oil. Blend until completely smooth. Seeds must be hot.\",\"criticalPoint\":true},{\"id\":\"s3\",\"order\":3,\"action\":\"Monitor blender heat\",\"instruction\":\"Blend in intervals — do not run continuously more than 60 seconds.\",\"criticalPoint\":true}]","Smooth, creamy, uniform tan paste","Completely smooth — no graininess","Deep roasted sesame, rich, nutty","","","[\"Sesame\"]","[\"Vegan\",\"Gluten-Free\"]",null,null,"Seeds must be hot when blending. Blend in short bursts if machine runs warm.","Blending cold seeds. Over-toasting. Running Vitamix too long.","Blend while seeds are hot. Never run Vitamix continuously more than 60 sec."],
    ["Dan Dan Infused Lard","","Lao Peng You","Prep","Dan Dan","Prep","1.0","active","chops",1490,"g",null,"g",1,10,20,30,"","Cool completely. Stir before each use to reincorporate settled peppercorns.","[{\"id\":\"1\",\"name\":\"Manteca\",\"quantity\":1000,\"unit\":\"g\"},{\"id\":\"2\",\"name\":\"Green Onion\",\"quantity\":400,\"unit\":\"g\"},{\"id\":\"3\",\"name\":\"Brown Peppercorn\",\"quantity\":50,\"unit\":\"g\",\"prepNote\":\"ground\"},{\"id\":\"4\",\"name\":\"White Pepper\",\"quantity\":40,\"unit\":\"g\",\"prepNote\":\"ground\"}]","[{\"id\":\"s1\",\"order\":1,\"action\":\"Fry green onions\",\"instruction\":\"Heat manteca until liquid and hot. Fry green onions until golden brown.\",\"criticalPoint\":false},{\"id\":\"s2\",\"order\":2,\"action\":\"Remove onions\",\"instruction\":\"Pull out and discard fried green onions.\",\"criticalPoint\":false},{\"id\":\"s3\",\"order\":3,\"action\":\"Add pepper OFF heat\",\"instruction\":\"Turn off burner completely. Add ground peppercorns to hot lard. Heat MUST be off.\",\"temp\":\"Heat OFF\",\"criticalPoint\":true},{\"id\":\"s4\",\"order\":4,\"action\":\"Cool\",\"instruction\":\"Allow to cool to room temperature.\",\"criticalPoint\":false},{\"id\":\"s5\",\"order\":5,\"action\":\"Stir before use\",\"instruction\":\"Before each use, stir thoroughly to reincorporate settled peppercorns.\",\"criticalPoint\":true}]","","","Rich pork fat, floral brown pepper heat","","","[]","[\"Gluten-Free\"]",null,null,"Pepper goes in OFF heat intentionally. Always stir before portioning.","Adding pepper while heat is on — scorched flavor. Not stirring before use.","Pepper MUST be added with heat completely off."],
    ["Charles Barkley Base","","Lao Peng You","Sauce","Dumpling Soup Base","Dumpling","1.0","active","chops",5120,"g",null,"g",1,null,null,null,"","Store in 8qt cambro","[{\"id\":\"1\",\"name\":\"Mushroom Crack\",\"quantity\":480,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Garlic Water\",\"quantity\":1280,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Cut Dark Soy\",\"quantity\":680,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"Black Vinegar\",\"quantity\":1400,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"5\",\"name\":\"Light Soy\",\"quantity\":1280,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Make garlic water\",\"instruction\":\"Prepare garlic water according to the Garlic Water recipe.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Combine all\",\"instruction\":\"Weigh out everything on a scale and mix together in an 8qt cambro.\",\"criticalPoint\":false}]","","","","","","[\"Soy\",\"Sulfite\"]","[]",null,null,"","",""],
    ["Charles Barkley for Service","Spicy Sour Broth","Lao Peng You","Line Dish","","Dumpling","1.0","active","chops",1,"portions",null,"g",1,null,null,null,"","","[{\"id\":\"1\",\"name\":\"Boiling Water\",\"quantity\":20,\"unit\":\"oz\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Barkley Base\",\"quantity\":2,\"unit\":\"oz\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Pleasant Pickles\",\"quantity\":1,\"unit\":\"tsp\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"Sesame Seeds\",\"quantity\":1,\"unit\":\"tsp\",\"isOptional\":false},{\"id\":\"5\",\"name\":\"Green Onion\",\"quantity\":6,\"unit\":\"piece\",\"isOptional\":false},{\"id\":\"6\",\"name\":\"Cilantro\",\"quantity\":1,\"unit\":\"tbsp\",\"isOptional\":false},{\"id\":\"7\",\"name\":\"Sesame Oil\",\"quantity\":1,\"unit\":\"tsp\",\"isOptional\":false},{\"id\":\"8\",\"name\":\"Chili Oil\",\"quantity\":0.5,\"unit\":\"oz\",\"isOptional\":false},{\"id\":\"9\",\"name\":\"Dried Shrimp\",\"quantity\":1,\"unit\":\"tsp\",\"isOptional\":false},{\"id\":\"10\",\"name\":\"Birds Eye Chili\",\"quantity\":6,\"unit\":\"piece\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Build the bowl\",\"instruction\":\"Combine all ingredients except water and cilantro in a bowl.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Finish and serve\",\"instruction\":\"When dumplings are finished cooking, add boiling water, then dumplings, then garnish with cilantro.\",\"criticalPoint\":false}]","","","","","","[\"Soy\",\"Shellfish\",\"Sesame\"]","[]",null,null,"Shrimp should be swimming in the broth and not only on top ;)","",""],
    ["Cold Barkley","","Lao Peng You","Sauce","","Dumpling","1.0","active","chops",2070,"g",null,"g",1,null,null,null,"","Store in deep 6 pan","[{\"id\":\"1\",\"name\":\"Mushroom Crack\",\"quantity\":210,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Garlic Water\",\"quantity\":360,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Black Vinegar\",\"quantity\":270,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"Light Soy\",\"quantity\":540,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"5\",\"name\":\"Cut Dark Soy\",\"quantity\":240,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"6\",\"name\":\"Chili Oil\",\"quantity\":450,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Combine\",\"instruction\":\"Mix everything together in a deep 6 pan.\",\"criticalPoint\":false}]","","","","","","[\"Soy\",\"Sesame\"]","[]",null,null,"","",""],
    ["Cong Roux","","Lao Peng You","Prep","","Prep","1.0","active","chops",1,"shallow 6 pan",null,"g",1,null,null,null,"","Cool before storing","[{\"id\":\"1\",\"name\":\"Rapeseed Oil\",\"quantity\":450,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Sir Galahad Flour\",\"quantity\":450,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Sesame Oil\",\"quantity\":150,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"Salt\",\"quantity\":85,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"5\",\"name\":\"MSG\",\"quantity\":30,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"6\",\"name\":\"13 Spice\",\"quantity\":15,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"7\",\"name\":\"Turmeric\",\"quantity\":6,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Combine dry\",\"instruction\":\"Measure and combine all dry ingredients.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Combine oils\",\"instruction\":\"Measure and combine oils separately.\",\"criticalPoint\":false},{\"id\":\"3\",\"order\":3,\"action\":\"Heat wok and add oil\",\"instruction\":\"Heat wok and add the combined oils.\",\"criticalPoint\":false},{\"id\":\"4\",\"order\":4,\"action\":\"Whisk in dry\",\"instruction\":\"Use a whisk to incorporate dry ingredients into the oil.\",\"criticalPoint\":false},{\"id\":\"5\",\"order\":5,\"action\":\"Fry on low\",\"instruction\":\"Fry on low heat until flour no longer smells raw.\",\"criticalPoint\":true},{\"id\":\"6\",\"order\":6,\"action\":\"Cool\",\"instruction\":\"Remove from wok with spatula and cool completely before using.\",\"criticalPoint\":false}]","","","","","","[\"Gluten\",\"Sesame\"]","[\"Vegan\"]",null,null,"Salt is 80g but experimenting with 90g.","Do not rush — fry on low heat until flour no longer smells raw.",""],
    ["Beef Soup Spice Mix","","Lao Peng You","Prep","","Prep","1.0","active","chops",1,"batch",null,"g",1,null,null,null,"","Store in deli containers","[{\"id\":\"1\",\"name\":\"Salt\",\"quantity\":6,\"unit\":\"pts\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Chicken Crack\",\"quantity\":6,\"unit\":\"pts\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Sand Ginger\",\"quantity\":2,\"unit\":\"pts\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"White Pepper\",\"quantity\":2,\"unit\":\"pts\",\"isOptional\":false},{\"id\":\"5\",\"name\":\"Brown Peppercorn\",\"quantity\":2,\"unit\":\"pts\",\"isOptional\":false},{\"id\":\"6\",\"name\":\"Coriander\",\"quantity\":1,\"unit\":\"pts\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Grind spices separately\",\"instruction\":\"Grind sand ginger, then white peppercorn, then brown peppercorn. Do not grind salt or chicken crack.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Strain brown peppercorn\",\"instruction\":\"Use a double mesh strainer to sieve ground brown peppercorn to remove hulls.\",\"criticalPoint\":false},{\"id\":\"3\",\"order\":3,\"action\":\"Combine and store\",\"instruction\":\"Mix everything together and store in deli containers.\",\"criticalPoint\":false}]","","","","","","[]","[]",null,null,"Parts-based recipe. 20g white pepper = 80g chicken crack, etc.","Do not grind salt or chicken crack. Strain brown peppercorn hulls.",""],
    ["Lemongrass Oil","","Lao Peng You","Prep","","Prep","1.0","active","chops",101.5,"g",null,"g",1,null,null,null,"","","[{\"id\":\"1\",\"name\":\"Canola Oil\",\"quantity\":100,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Lemongrass Oil\",\"quantity\":1.5,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Combine\",\"instruction\":\"Combine oils, stir, and let sit to smooth out flavors.\",\"criticalPoint\":false}]","","","","","","[]","[\"Vegan\"]",null,null,"Rice bran oil preferred but any neutral oil will do.","",""],
    ["Chili Crisp (Finished)","","Lao Peng You","Sauce","","Prep","1.0","active","chops",10460,"g",null,"g",1,10,null,10,"","","[{\"id\":\"1\",\"name\":\"Chili Crisp Base\",\"quantity\":10000,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Lemongrass Oil\",\"quantity\":350,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Salt\",\"quantity\":80,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"4\",\"name\":\"MSG\",\"quantity\":30,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Prep components\",\"instruction\":\"Make sure chili crisp base and lemongrass oil are already made.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Combine and rest\",\"instruction\":\"Mix all ingredients and let sit at least 10 minutes to allow flavors to relax.\",\"criticalPoint\":false}]","","","","","","[]","[]",null,null,"","",""],
    ["Brown Sugar Syrup","","Lao Peng You","Prep","Dou Hua","Prep","1.0","active","chops",1200,"g",null,"g",1,5,5,20,"","Bottle after cooling","[{\"id\":\"1\",\"name\":\"Brown Sugar\",\"quantity\":600,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"2\",\"name\":\"Water\",\"quantity\":600,\"unit\":\"g\",\"isOptional\":false},{\"id\":\"3\",\"name\":\"Ginger\",\"quantity\":50,\"unit\":\"g\",\"isOptional\":false}]","[{\"id\":\"1\",\"order\":1,\"action\":\"Simmer\",\"instruction\":\"Combine water and brown sugar in a pot and bring to a simmer for 5 minutes.\",\"criticalPoint\":false},{\"id\":\"2\",\"order\":2,\"action\":\"Steep ginger\",\"instruction\":\"Slice ginger and steep in syrup until cool.\",\"criticalPoint\":false},{\"id\":\"3\",\"order\":3,\"action\":\"Strain and bottle\",\"instruction\":\"Remove ginger and bottle up for dou hua.\",\"criticalPoint\":false}]","","","","","","[]","[\"Vegan\"]",null,null,"For dou hua.","",""]
  ];

  const insertMany = sqlite.transaction((rows: any[]) => {
    for (const r of rows) {
      insert.run(...r, now, now);
    }
  });

  insertMany(seedRecipes);
  console.log(`[seed] Inserted ${seedRecipes.length} recipes.`);
}

seedIfEmpty();
