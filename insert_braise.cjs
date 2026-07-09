const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const ingredients = JSON.stringify([
  // Braising liquid
  { id: "i1",  name: "Water",                        quantity: 10000, unit: "g",    category: "Liquid",  isOptional: false },
  { id: "i2",  name: "Old Chicken",                  quantity: 1,     unit: "each", category: "Protein", isOptional: true,  notes: "Probably not necessary for this test" },
  { id: "i3",  name: "Pork Bones (blanched)",         quantity: 600,   unit: "g",    category: "Protein", isOptional: false },
  { id: "i4",  name: "Pork Fatback",                  quantity: 300,   unit: "g",    category: "Protein", isOptional: false },
  { id: "i5",  name: "Ginger",                        quantity: 100,   unit: "g",    category: "Aromatics", isOptional: false },
  { id: "i6",  name: "Salt",                          quantity: 260,   unit: "g",    category: "Seasoning", isOptional: false, notes: "Currently 260g — reduce to taste, noted as too much" },
  { id: "i7",  name: "Chicken Crack",                 quantity: 75,    unit: "g",    category: "Seasoning", isOptional: false },
  { id: "i8",  name: "MSG",                           quantity: 20,    unit: "g",    category: "Seasoning", isOptional: false },
  { id: "i9",  name: "Light Soy Sauce",               quantity: 100,   unit: "g",    category: "Seasoning", isOptional: false },
  { id: "i10", name: "Sugar",                         quantity: 100,   unit: "g",    category: "Seasoning", isOptional: false },
  { id: "i11", name: "Sugar (for caramel color)",     quantity: 150,   unit: "g",    category: "Seasoning", isOptional: false },
  // Spice bag
  { id: "i12", name: "Star Anise",                    quantity: 14,    unit: "g",    category: "Spice",   isOptional: false },
  { id: "i13", name: "Cassia",                        quantity: 9,     unit: "g",    category: "Spice",   isOptional: false, notes: "Use 14g if no cinnamon" },
  { id: "i14", name: "Cinnamon",                      quantity: 9,     unit: "g",    category: "Spice",   isOptional: true,  notes: "If unavailable, use 14g cassia total" },
  { id: "i15", name: "Nutmeg (cracked)",              quantity: 8,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i16", name: "Angelica / Bai Zhi",            quantity: 10,    unit: "g",    category: "Spice",   isOptional: false },
  { id: "i17", name: "Galangal",                      quantity: 10,    unit: "g",    category: "Spice",   isOptional: false, notes: "If no dried ginger, add extra 3g galangal" },
  { id: "i18", name: "Sand Ginger",                   quantity: 8,     unit: "g",    category: "Spice",   isOptional: false, notes: "Use 12g if no dried ginger" },
  { id: "i19", name: "Dried Ginger",                  quantity: 7,     unit: "g",    category: "Spice",   isOptional: true,  notes: "If unavailable, use 12g sand ginger total" },
  { id: "i20", name: "Brown Peppercorn",              quantity: 10,    unit: "g",    category: "Spice",   isOptional: false },
  { id: "i21", name: "Fennel Seed",                   quantity: 7,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i22", name: "Cardamom",                      quantity: 4,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i23", name: "Black Cardamom (cracked)",      quantity: 5,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i24", name: "White Cardamom",                quantity: 4,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i25", name: "Licorice Root",                 quantity: 3,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i26", name: "Bay Leaves",                    quantity: 2,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i27", name: "Fructus Amomum (Sha Ren)",      quantity: 7,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i28", name: "Coriander Seed",                quantity: 5,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i29", name: "Dried Orange Peel",             quantity: 3,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i30", name: "Ginseng",                       quantity: 3,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i31", name: "Gardenia (crushed)",            quantity: 4,     unit: "g",    category: "Spice",   isOptional: false },
  { id: "i32", name: "Cumin",                         quantity: 3,     unit: "g",    category: "Spice",   isOptional: false },
]);

const steps = JSON.stringify([
  { id: "s1",  instruction: "Blanch old chicken (if using) and pork bones in boiling water for 3 minutes. Drain, rinse, and clean thoroughly." },
  { id: "s2",  instruction: "In a heavy pot, caramelize 150g sugar over medium heat until deep amber. Watch carefully — do not burn." },
  { id: "s3",  instruction: "Deglaze the caramel with a splash of the 10kg water, stirring to dissolve. Add the remaining water." },
  { id: "s4",  instruction: "Add the blanched chicken (if using), pork bones, pork fatback, ginger, salt, chicken crack, MSG, 100g sugar, and light soy sauce." },
  { id: "s5",  instruction: "Bring to a boil and skim any scum that rises to the surface." },
  { id: "s6",  instruction: "Bundle all spices into a spice bag (cheesecloth). Add the spice bag and pork fatback to the pot." },
  { id: "s7",  instruction: "Return to a full boil and cook for 30 minutes." },
  { id: "s8",  instruction: "Reduce to a simmer and cook for 2 hours." },
  { id: "s9",  instruction: "Taste the braise. Once satisfied with the flavor, remove and discard the spice bag. Continue simmering with the meats for an additional 30 minutes to 1 hour." },
  { id: "s10", instruction: "Cool the braising liquid. The master braise is now ready to use for chicken thighs." },
  { id: "s11", instruction: "Add brined chicken thighs to the cooled or warm braise. Simmer on very low heat for 25-30 minutes. Do not boil — the skin will break." },
  { id: "s12", instruction: "Remove chicken thighs and immediately transfer to an ice bath. Chill completely." },
  { id: "s13", instruction: "Remove from ice bath and air dry on a rack for a minimum of 12 hours." },
  { id: "s14", instruction: "Optional: brush skin with infused oil before grilling." },
  { id: "s15", instruction: "Grill over very low to medium heat to finish and crisp the skin before service." },
]);

const recipe = {
  recipe_name: "Master Braise — Test 1 (Chicken Thighs)",
  name_zh: null,
  concept: "Lao Peng You",
  category: "Braise/Stew",
  subcategory: "Master Braise",
  station: "Prep",
  recipe_version: "1.0",
  status: "draft",
  author: "Chops",
  yield_qty: 10,
  yield_unit: "kg",
  portion_size: null,
  portion_unit: null,
  batch_multiplier: 1,
  prep_time: 30,
  cook_time: 210,
  total_time: 240,
  shelf_life: "3-5 days refrigerated; freeze for longer storage",
  storage_method: "Cool completely before storing. Keep meats submerged in braising liquid.",
  ingredients,
  steps,
  final_appearance: "Deep amber to mahogany braising liquid. Chicken skin intact, golden-brown after grilling.",
  final_texture: "Chicken thighs: tender throughout, skin crisp from grill finish.",
  final_flavor: null,
  final_temp: "Serve hot off the grill.",
  plating_notes: "Grill to order. Brush with infused oil on skin side before grilling.",
  allergens: JSON.stringify(["Soy", "Gluten"]),
  dietary_flags: JSON.stringify([]),
  food_cost_target: null,
  photo_url: null,
  chef_notes: "SALT: 260g is currently too much — dial this back on next test. Taste and adjust before committing. Cinnamon is interchangeable with cassia — use whichever is available. Dried ginger and sand ginger are interchangeable — see substitution notes on each. Old chicken adds body to the braise but is likely not necessary for this test batch. Brine the chicken thighs before braising. After braising, air dry a minimum of 12 hours for best skin texture on the grill.",
  common_mistakes: "Boiling the chicken thighs too hard — the skin will break. Not skimming scum after initial boil. Pulling spice bag too early or too late — taste it.",
  critical_points: "Keep the thigh braise at a very low simmer — no rolling boil. Ice bath immediately after pulling. Minimum 12 hours air dry before grilling.",
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
