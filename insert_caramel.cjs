const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const ingredients = JSON.stringify([
  { id: "i1", name: "Sugar",              quantity: 500,  unit: "g", category: "Other",   isOptional: false },
  { id: "i2", name: "Neutral Oil",        quantity: 20,   unit: "g", category: "Other",   isOptional: true,  notes: "15–25g (3–5% of sugar weight). Helps with even melting." },
  { id: "i3", name: "Boiling Water",      quantity: 5500, unit: "g", category: "Liquid",  isOptional: false, notes: "5–6 kg. Must be boiling hot for quench — never cold water." },
]);

const steps = JSON.stringify([
  {
    id: "s1",
    instruction: "SET UP — CCP: Have everything ready before you start. Use a heavy-bottom pot or wok at least 3× the final syrup volume (vigorous foaming will occur). Bring 5–6L water to a boil in a separate vessel and keep it hot. The pot must heat evenly — no thin spots — to avoid localized scorching."
  },
  {
    id: "s2",
    instruction: "MELT THE SUGAR — CCP: No crystals. Add oil (if using) to the pot, then add sugar. Cook over medium heat, stirring constantly, until sugar fully melts into a clear syrup with no visible crystals. Do not leave dry sugar patches — any remaining crystals can seed crystallization and result in grainy syrup."
  },
  {
    id: "s3",
    instruction: "CARAMELIZE TO BRICK RED — CCP: Color window. Continue over medium to medium-low heat. Watch color progression: clear → light yellow → amber → very dark amber → brick red. When syrup reaches very dark amber / brick red and aroma is strong caramel-bitter but not acrid, turn off the heat. CCP: Overshooting even ~30 seconds on strong heat can push flavor into burnt/ashy — batch unusable. Use visual color as primary indicator. Thermometer reference: ~180–190°C at endpoint."
  },
  {
    id: "s4",
    instruction: "RESIDUAL CARRY — CCP: Short stand time. After turning off heat, let residual pan heat carry the syrup slightly darker for 20–40 seconds, watching closely. Do not walk away. A cold/wet towel under the pot or briefly lifting off the burner is your emergency brake if it moves too fast."
  },
  {
    id: "s5",
    instruction: "QUENCH WITH BOILING WATER — CCP: Safety and smooth dissolution. With heat off, slowly add boiling water in 3–4 portions, stirring constantly. Stand back — expect violent bubbling and steam. Use long tools. CCP: Always use hot/boiling water — cold water causes sudden solidification and dangerous splatter. Add in portions, not all at once. Stir until all hardened bits fully redissolve into a uniform dark liquid. Any graininess indicates incomplete dissolution or earlier crystallization."
  },
  {
    id: "s6",
    instruction: "COOL AND STORE — CCP: Hygiene and consistency. Let caramel color cool to room temperature. Transfer only when below 80–90°C to protect containers. Store in clean, covered food-grade bottles or cambros. Label with date and batch code. Document: sugar weight, water weight, visual endpoint description, and aroma notes (bitter-smoky, not acrid) on the recipe card for each batch."
  },
]);

const recipe = {
  recipe_name: "Caramel Color",
  name_zh: null,
  concept: "Lao Peng You",
  category: "Sauce",
  subcategory: "Coloring Agent",
  station: "Prep",
  recipe_version: "1.0",
  status: "active",
  author: "Chops",
  yield_qty: 5500,
  yield_unit: "g",
  portion_size: null,
  portion_unit: null,
  batch_multiplier: 1,
  prep_time: 5,
  cook_time: 20,
  total_time: 25,
  shelf_life: "Shelf stable; store covered at room temperature or refrigerated",
  storage_method: "Cool completely before transferring. Store in covered food-grade bottles or cambros. Label date and batch code.",
  ingredients,
  steps,
  final_appearance: "Very dark brown, like strong black tea or cola. Fully fluid with no crystals or sludge at the bottom.",
  final_texture: "Smooth, fully fluid syrup — no graininess.",
  final_flavor: "Bittersweet with clear sugar backbone. If aggressively burnt, discard the batch.",
  final_temp: "Room temperature for storage.",
  plating_notes: null,
  allergens: JSON.stringify([]),
  dietary_flags: JSON.stringify(["Vegan", "Gluten-Free"]),
  food_cost_target: null,
  photo_url: null,
  chef_notes: "Scale linearly for larger batches. Use visual color as the primary indicator — thermometer is secondary reference (~180–190°C). The color window is tight: brick red is the target, not black. Aroma should be sweet-bitter and slightly smoky — if it smells harsh, chemical, or acrid, the batch is lost. Document every batch with sugar weight, water weight, visual endpoint, and aroma notes for consistency across cooks.",
  common_mistakes: "Adding cold water for the quench (dangerous splatter, uneven dissolution). Overshooting the color — even 30 extra seconds on high heat can burn it. Walking away during the residual carry phase. Leaving dry sugar crystals during melt phase (causes grainy syrup). Adding all the water at once instead of in portions.",
  critical_points: "Boiling water only for quench — never cold. Add water in 3–4 portions. Stop at brick red — not black. 20–40 second residual carry max. Full dissolution before storing — no graininess.",
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
