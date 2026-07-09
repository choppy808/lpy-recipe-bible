const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const ingredients = JSON.stringify([
  {
    id: "i1", name: "Sugar, White or Rock", quantity: 500, unit: "g",
    category: "Other", isOptional: false,
    notes: "Rock sugar gives a cleaner red shine; white sugar is acceptable for daily production."
  },
  {
    id: "i2", name: "Neutral Oil", quantity: 25, unit: "g",
    category: "Other", isOptional: false,
    notes: "Soybean, canola, or peanut oil. 5% of sugar weight."
  },
  {
    id: "i3", name: "Boiling Water", quantity: 600, unit: "g",
    category: "Liquid", isOptional: false,
    notes: "Add in 3–4 portions. Adjust 500–700g for final concentration. Must be boiling — never cold."
  },
]);

const steps = JSON.stringify([
  {
    id: "s1",
    instruction: "SET UP. Check that the wok or pot is heavy-bottomed, not warped, and large enough to handle aggressive foaming (minimum 3L, high sides). Weigh sugar and oil. Bring the finish water to a boil in a separate pot and hold hot. CCP: Pot volume must be at least 3× the expected liquid volume to prevent boil-over. Boiling water must be ready before caramel reaches target color."
  },
  {
    id: "s2",
    instruction: "WARM OIL AND MELT SUGAR. Add neutral oil to the wok or pot. Heat on low–medium until the oil is warm and fluid, but not smoking. Add sugar. Cook on medium heat, stirring constantly, until all sugar melts into a clear or pale yellow syrup. Continue until there are no dry crystals on the bottom or sides. Visual cue: Syrup is clear to pale yellow and runs smoothly off the spatula. CCP: If edges start browning while crystals remain, lower heat immediately and continue stirring until fully melted."
  },
  {
    id: "s3",
    instruction: "CARAMELIZE TO DEEP RED-BROWN. Once fully melted, reduce heat to low–medium or low. Stir gently and regularly, or swirl the pan, to keep heat even. Watch color carefully: pale yellow → light amber → deep amber → deep reddish-brown. When the syrup looks like strong tea with a red tint and smells deeply caramelized and slightly bitter, turn off the heat. Visual cue: Similar to jujube skin or a well-developed red-braise sauce; bubbles become smaller and slower. CCP: Stop at reddish-brown, not black. If aroma becomes acrid or harsh, the batch is overcooked and must not be used."
  },
  {
    id: "s4",
    instruction: "QUENCH WITH BOILING WATER. With heat off, add boiling water slowly in 3–4 portions along the side of the pot. Stir continuously after each addition. Let foaming settle between additions. Continue stirring until the liquid is fully smooth and all hardened syrup is dissolved. Visual cue: Finished caramel color should look like dark tea or cola with a red tone, and pour like thin soy sauce. CCP: Use boiling or very hot water only — never cold. Add slowly to control splatter, steam, and boil-over."
  },
  {
    id: "s5",
    instruction: "COOL AND STORE. Cool until warm but no longer heavily steaming. Transfer to clean, food-safe containers. Label with: date, batch size (e.g. 500g sugar / 600g water), and cook's initials. Store according to house standard. CCP: Do not transfer while dangerously hot. Product must be smooth, lump-free, and free from burnt aroma before storage."
  },
]);

async function main() {
  try {
    const result = await pool.query(
      `UPDATE recipes SET
        recipe_name    = $1,
        name_zh        = $2,
        yield_qty      = $3,
        yield_unit     = $4,
        shelf_life     = $5,
        storage_method = $6,
        ingredients    = $7,
        steps          = $8,
        final_appearance = $9,
        final_texture  = $10,
        final_flavor   = $11,
        final_temp     = $12,
        plating_notes  = $13,
        chef_notes     = $14,
        common_mistakes = $15,
        critical_points = $16,
        updated_at     = $17
      WHERE id = 20
      RETURNING id, recipe_name`,
      [
        "Caramel Color — SOP Oil Method (糖色)",
        "糖色（油法）",
        1125,
        "g",
        "2–4 weeks",
        "Cool below 80–90°C before transferring. Store in clean, covered food-safe containers or bottles. Label: date, batch size (500g sugar / 600g water), cook initials. Store per house standard.",
        ingredients,
        steps,
        "Dark brown with a distinct red tone. Smooth, glossy, no crystals or sludge. When poured on a spoon: dark tea / cola with a red tone and shine.",
        "Pourable with slight body, similar to thin soy sauce. Fully fluid, no graininess.",
        "Bittersweet, lightly smoky. Not burnt. Tiny dab: clear bittersweet with sugar backbone.",
        "Room temperature or refrigerated for storage.",
        "Line use — color check: when poured on a spoon, should look like dark tea/cola with a red tone and shine. Taste check (tiny dab): bittersweet, lightly smoky, no burnt or chemical taste. Usage: starting point 1–2 tbsp per 1–1.5kg meat for a small braise. Adjust per dish and record final usage on each dish's recipe card. This is a base coloring syrup, not a finished sauce.",
        "Rock sugar produces a more classic Chinese-style red shine. White sugar is faster and acceptable for line production. Keep final water at 600g as the house standard unless a specific dish requires a tighter or looser concentration. Scale linearly for larger batches — oil stays at 5% of sugar weight.",
        "Too light / too sweet: cook slightly longer next batch; current batch may still be used for lighter applications. Too dark / burnt: discard and log; next batch reduce heat and stop earlier. Do not use burnt batches for service. Grainy / lumps: reheat gently with a small amount of hot water and stir smooth; strain if needed and note the defect on the batch log.",
        "Pot minimum 3L with high sides. Boiling water ready before caramel hits color. No dry sugar crystals remaining after melt step. Stop at reddish-brown — not black. If acrid aroma: discard. Heat off before adding water. Boiling water only for quench. Add in 3–4 portions. Full dissolution before storing. Do not transfer while dangerously hot.",
        now,
      ]
    );
    console.log('Updated:', result.rows[0]);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
