const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const ingredients = JSON.stringify([
  { id: "i1", name: "White Sugar or Rock Sugar", quantity: 500, unit: "g",   category: "Other",  isOptional: false },
  { id: "i2", name: "Neutral Oil (soybean, canola, or peanut)", quantity: 25, unit: "g", category: "Other", isOptional: false, notes: "5% of sugar weight. Helps conduct heat and prevent sticking. Must stay clear — do not smoke." },
  { id: "i3", name: "Boiling Water", quantity: 600, unit: "g", category: "Liquid", isOptional: false, notes: "500–700g range. Adjust as needed. Must be boiling — never cold water." },
]);

const steps = JSON.stringify([
  {
    id: "s1",
    instruction: "STEP 1 — WARM OIL. Add 25g neutral oil to a wok or heavy-bottom pot (minimum 3L capacity). Turn heat to low–medium. Warm just until the oil flows easily. CCP: Do not smoke the oil — it is only here to conduct heat and prevent sticking. Keep it clear."
  },
  {
    id: "s2",
    instruction: "STEP 2 — MELT THE SUGAR. Add 500g sugar to the warm oil. Keep heat at medium. Stir continuously until sugar begins to melt. Continue stirring until all sugar turns into a clear or light yellow syrup with no dry crystals remaining. Visual cue: no grains visible on the bottom or sides; syrup flows easily and looks clear or pale yellow. CCP: If parts are browning while crystals remain, lower heat and keep stirring until fully melted. Do not let dry sugar sit on high heat — it will scorch."
  },
  {
    id: "s3",
    instruction: "STEP 3 — CARAMELIZE TO JUJUBE-RED (深红色). Once fully melted, reduce to low–medium or low heat. Switch from constant stirring to gentle regular stirring or wok-swirl to keep heat even. Watch color progression carefully: pale yellow → light amber → deep amber → reddish-brown (jujube-red). At reddish-brown the syrup will look like strong tea with a red tint, smell intensely caramel and slightly bitter but not burnt, and bubble slowly with small bubbles. Turn off the heat at this point. Visual cue: color similar to Chinese jujube skin or dark soy-braised meat. CCP: Do not let it go black or smell acrid — that is burnt and unusable. Heat must be off before adding water."
  },
  {
    id: "s4",
    instruction: "STEP 4 — QUENCH WITH BOILING WATER. Have 600g boiling water ready before starting this step. With heat off, slowly ladle boiling water into the wok in 3–4 portions along the side of the pot. Stir continuously after each addition. Let foaming subside before adding the next portion. After all water is in, stir until all thick syrup has dissolved, liquid is smooth and uniform, and no hard lumps remain. Visual cue: finished caramel color should be a smooth, dark reddish-brown liquid — pourable with some body, like thin soy sauce. CCP: Only use boiling or very hot water — cold water causes dangerous splatter and uneven solidification. Add slowly — fast addition causes heavy foaming and boil-over."
  },
  {
    id: "s5",
    instruction: "STEP 5 — COOL AND STORE. Let caramel color cool until below 80–90°C (warm but not heavily steaming). Pour into clean, food-safe containers or bottles. Label with: '糖色 – Oil Method', date, batch size (e.g. 500g sugar / 600g water), and cook's initials. Store in a cool dry place or refrigerator per house rules. Use within 2–4 weeks for best flavor and color."
  },
]);

const recipe = {
  recipe_name: "Caramel Color — SOP Oil Method (糖色)",
  name_zh: "糖色（油法）",
  concept: "Lao Peng You",
  category: "Sauce",
  subcategory: "Coloring Agent",
  station: "Prep",
  recipe_version: "1.0",
  status: "active",
  author: "Chops",
  yield_qty: 600,
  yield_unit: "g",
  portion_size: null,
  portion_unit: null,
  batch_multiplier: 1,
  prep_time: 5,
  cook_time: 15,
  total_time: 20,
  shelf_life: "2–4 weeks",
  storage_method: "Cool below 80–90°C before transferring. Store in clean, covered food-safe containers or bottles. Label: 糖色 – Oil Method, date, batch size, cook initials. Cool dry place or refrigerator per house rules.",
  ingredients,
  steps,
  final_appearance: "Smooth, dark reddish-brown liquid. When poured on a spoon: dark tea / cola color with a red tone and some shine. No crystals, no lumps, no sludge.",
  final_texture: "Pourable with some body — like thin soy sauce. Fully fluid, no graininess.",
  final_flavor: "Bittersweet, lightly smoky. No strong burnt or chemical taste. Tiny dab test: clear bittersweet with sugar backbone.",
  final_temp: "Room temperature or refrigerated for storage.",
  plating_notes: "Line use: pour on a spoon — should look like dark tea/cola with red tone and shine. For a small braise (1–1.5kg meat): start with 1–2 tablespoons added early in cooking. Adjust per dish recipe card.",
  allergens: JSON.stringify([]),
  dietary_flags: JSON.stringify(["Vegan", "Gluten-Free"]),
  food_cost_target: null,
  photo_url: null,
  chef_notes: "Target: reddish-brown (jujube-red / 枣红色), shiny, bittersweet, no burnt taste. Scale linearly for larger batches — oil stays at 5% of sugar weight, water at roughly 1.2× sugar weight. Usage amount per dish should be documented on each dish's recipe card. This is the standard caramel color for red-braised and soy-braised dishes at LPY.",
  common_mistakes: "Using cold water for the quench (dangerous — always use boiling water). Adding all the water at once instead of in 3–4 portions. Overshooting to black/acrid — must stop at jujube-red. Smoking the oil in step 1. Leaving dry sugar crystals during melt phase (grainy syrup).",
  critical_points: "Oil must not smoke in step 1. No dry sugar crystals remaining after step 2. Stop at jujube-red in step 3 — not black. Heat off before adding water. Boiling water only for quench. Add water in 3–4 portions. Full dissolution before storing.",
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
