const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const ingredients = JSON.stringify([
  { id: "i1",  name: "Boneless Skinless Chicken Thigh", quantity: 4500, unit: "g", category: "Protein",   isOptional: false },
  { id: "i2",  name: "Red Pepper",                      quantity: 675,  unit: "g", category: "Vegetable", isOptional: false },
  { id: "i3",  name: "Green Pepper",                    quantity: 675,  unit: "g", category: "Vegetable", isOptional: false },
  { id: "i4",  name: "Celery",                          quantity: 450,  unit: "g", category: "Vegetable", isOptional: false },
  { id: "i5",  name: "Onion",                           quantity: 900,  unit: "g", category: "Vegetable", isOptional: false },
  { id: "i6",  name: "Oil for Frying",                  quantity: 4500, unit: "g", category: "Other",     isOptional: false },
  { id: "i7",  name: "Stock",                           quantity: 4500, unit: "g", category: "Liquid",    isOptional: false },
  { id: "i8",  name: "Salt (marinade)",                 quantity: 45,   unit: "g", category: "Seasoning", isOptional: false },
  { id: "i9",  name: "Shaoxing Wine (marinade)",        quantity: 450,  unit: "g", category: "Seasoning", isOptional: false },
  { id: "i10", name: "Ginger (marinade)",               quantity: 270,  unit: "g", category: "Aromatics", isOptional: false },
  { id: "i11", name: "Scallion (marinade)",             quantity: 450,  unit: "g", category: "Aromatics", isOptional: false },
  { id: "i12", name: "Baking Soda",                     quantity: null, unit: "",  category: "Other",     isOptional: false, notes: "Quantity not specified — see chef notes." },
  { id: "i13", name: "Dried Chilis",                    quantity: 225,  unit: "g", category: "Spice",     isOptional: false },
  { id: "i14", name: "Brown Peppercorn",                quantity: 14,   unit: "g", category: "Spice",     isOptional: false },
  { id: "i15", name: "Ginger",                          quantity: 225,  unit: "g", category: "Aromatics", isOptional: false },
  { id: "i16", name: "Garlic",                          quantity: 225,  unit: "g", category: "Aromatics", isOptional: false },
  { id: "i17", name: "Scallion",                        quantity: 360,  unit: "g", category: "Aromatics", isOptional: false },
  { id: "i18", name: "DouBanJiang",                     quantity: 450,  unit: "g", category: "Seasoning", isOptional: false },
  { id: "i19", name: "Salt",                            quantity: 34,   unit: "g", category: "Seasoning", isOptional: false },
  { id: "i20", name: "Soy Sauce",                       quantity: 113,  unit: "g", category: "Seasoning", isOptional: false },
  { id: "i21", name: "Sugar",                           quantity: 45,   unit: "g", category: "Seasoning", isOptional: false },
  { id: "i22", name: "MSG",                             quantity: 23,   unit: "g", category: "Seasoning", isOptional: false },
  { id: "i23", name: "Shaoxing Wine",                   quantity: 360,  unit: "g", category: "Seasoning", isOptional: false },
]);

const steps = JSON.stringify([]);

const recipe = {
  recipe_name: "Chili Chicken",
  name_zh: null,
  concept: "Lao Peng You",
  category: "Catering",
  subcategory: null,
  station: "Prep",
  recipe_version: "1.0",
  status: "draft",
  author: "Chops",
  yield_qty: 4500,
  yield_unit: "g",
  portion_size: null,
  portion_unit: null,
  batch_multiplier: 1,
  prep_time: null,
  cook_time: null,
  total_time: null,
  shelf_life: null,
  storage_method: null,
  ingredients,
  steps,
  final_appearance: null,
  final_texture: null,
  final_flavor: null,
  final_temp: null,
  plating_notes: null,
  allergens: JSON.stringify(["Soy", "Gluten"]),
  dietary_flags: JSON.stringify([]),
  food_cost_target: null,
  photo_url: null,
  chef_notes: "Baking soda quantity not specified in original notes — confirm amount before finalizing recipe. Ingredient weights are based on original formula; note that original source indicated weights had been cut in half from a larger batch.",
  common_mistakes: null,
  critical_points: null,
  created_at: now,
  updated_at: now,
};

async function main() {
  try {
    const result = await pool.query(
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
      ) RETURNING id, recipe_name`,
      [
        recipe.recipe_name, recipe.name_zh, recipe.concept, recipe.category,
        recipe.subcategory, recipe.station, recipe.recipe_version, recipe.status,
        recipe.author, recipe.yield_qty, recipe.yield_unit,
        recipe.portion_size, recipe.portion_unit, recipe.batch_multiplier,
        recipe.prep_time, recipe.cook_time, recipe.total_time,
        recipe.shelf_life, recipe.storage_method,
        recipe.ingredients, recipe.steps,
        recipe.final_appearance, recipe.final_texture, recipe.final_flavor,
        recipe.final_temp, recipe.plating_notes,
        recipe.allergens, recipe.dietary_flags,
        recipe.food_cost_target, recipe.photo_url,
        recipe.chef_notes, recipe.common_mistakes, recipe.critical_points,
        recipe.created_at, recipe.updated_at,
      ]
    );
    console.log('Inserted:', result.rows[0]);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
