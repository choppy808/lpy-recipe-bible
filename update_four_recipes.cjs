const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres.sniissetnvxcicgxbtpv:Sl00pJohnB138!@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const now = Date.now();

const recipes = [
  {
    id: 9,
    recipe_name: "Dan Dan Infused Lard",
    category: "Component",
    station: "Prep",
    ingredients: [
      { id: "i1", name: "Manteca", quantity: 1000, unit: "g", category: "Fat", isOptional: false },
      { id: "i2", name: "Green Onion", quantity: 400, unit: "g", category: "Aromatics", isOptional: false },
      { id: "i3", name: "Brown Peppercorn", quantity: 50, unit: "g", category: "Spice", isOptional: false },
      { id: "i4", name: "White Pepper", quantity: 40, unit: "g", category: "Spice", isOptional: false },
    ],
    steps: [
      { id: "s1", order: 1, action: "Fry green onions", instruction: "Heat up manteca and fry green onions until golden brown.", duration: "", temp: "", visualCue: "Onions turn golden brown.", criticalPoint: false },
      { id: "s2", order: 2, action: "Bloom peppercorns", instruction: "After you pull the onions out, turn off the heat and add the ground peppercorns to the lard. Make sure the heat is off.", duration: "", temp: "", visualCue: "", criticalPoint: true },
      { id: "s3", order: 3, action: "Cool", instruction: "Allow it to cool.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s4", order: 4, action: "Stir before use", instruction: "Before using it, please stir everything up to incorporate all the peppercorns that have settled to the bottom.", duration: "", temp: "", visualCue: "", criticalPoint: false },
    ],
  },
  {
    id: 13,
    recipe_name: "Cong Roux",
    category: "Component",
    station: "Prep",
    yield_qty: null,
    yield_unit: "6 pan (shallow)",
    ingredients: [
      { id: "i1", name: "Rapeseed Oil", quantity: 450, unit: "g", category: "Fat", isOptional: false },
      { id: "i2", name: "Sir Galahad Flour", quantity: 450, unit: "g", category: "Dry", isOptional: false },
      { id: "i3", name: "Sesame Oil", quantity: 150, unit: "g", category: "Fat", isOptional: false },
      { id: "i4", name: "Salt", quantity: 90, unit: "g", category: "Seasoning", isOptional: false, notes: "80g experiment — adjust to taste" },
      { id: "i5", name: "MSG", quantity: 30, unit: "g", category: "Seasoning", isOptional: false },
      { id: "i6", name: "13 Spice", quantity: 15, unit: "g", category: "Spice", isOptional: false },
      { id: "i7", name: "Turmeric", quantity: 6, unit: "g", category: "Spice", isOptional: false },
    ],
    steps: [
      { id: "s1", order: 1, action: "Combine dry ingredients", instruction: "Measure out dry ingredients and combine together.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s2", order: 2, action: "Combine oils", instruction: "Measure out the oils and combine together separately from the dry ingredients.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s3", order: 3, action: "Heat oil in wok", instruction: "Heat up a wok and add the oil.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s4", order: 4, action: "Incorporate dry into oil", instruction: "Use a whisk to incorporate the dry ingredients into the oil.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s5", order: 5, action: "Fry on low heat", instruction: "Fry on low heat until the flour no longer smells raw.", duration: "", temp: "Low", visualCue: "Flour loses raw smell.", criticalPoint: true },
      { id: "s6", order: 6, action: "Cool", instruction: "Use a spatula to take out of the wok and cool down before using.", duration: "", temp: "", visualCue: "", criticalPoint: false },
    ],
    chef_notes: "Yields a shallow 6 pan. Salt range: 80–90g — currently experimenting.",
  },
  {
    id: 14,
    recipe_name: "Beef Soup Spice Mix",
    category: "Component",
    station: "Prep",
    ingredients: [
      { id: "i1", name: "Salt", quantity: 6, unit: "pts", category: "Seasoning", isOptional: false },
      { id: "i2", name: "Chicken Crack", quantity: 6, unit: "pts", category: "Seasoning", isOptional: false },
      { id: "i3", name: "Sand Ginger", quantity: 2, unit: "pts", category: "Spice", isOptional: false },
      { id: "i4", name: "White Pepper", quantity: 2, unit: "pts", category: "Spice", isOptional: false },
      { id: "i5", name: "Brown Peppercorn", quantity: 2, unit: "pts", category: "Spice", isOptional: false },
      { id: "i6", name: "Coriander", quantity: 1, unit: "pts", category: "Spice", isOptional: false },
    ],
    steps: [
      { id: "s1", order: 1, action: "Scale recipe", instruction: "This recipe is built off parts. If you decide to do 20g white pepper, do 80g chicken crack, etc.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s2", order: 2, action: "Grind spices separately", instruction: "The first task is to grind the spices. They are all different so grind them separately. First grind the sand ginger, next grind the white peppercorn, and finally grind the brown peppercorn. Do not grind the salt or chicken crack.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s3", order: 3, action: "Sieve brown peppercorn", instruction: "Strain off the brown peppercorn so there are no peppercorn hulls in the mix. Use the double mesh strainer to sieve the ground peppercorn.", duration: "", temp: "", visualCue: "", criticalPoint: false },
      { id: "s4", order: 4, action: "Combine and store", instruction: "Mix everything together and store in delis.", duration: "", temp: "", visualCue: "", criticalPoint: false },
    ],
  },
  {
    id: 15,
    recipe_name: "Lemongrass Oil",
    category: "Component",
    station: "Prep",
    ingredients: [
      { id: "i1", name: "Canola Oil", quantity: 100, unit: "g", category: "Fat", isOptional: false, notes: "Rice bran oil preferred; any neutral oil works" },
      { id: "i2", name: "Lemongrass Oil", quantity: 1.5, unit: "g", category: "Flavoring", isOptional: false },
    ],
    steps: [
      { id: "s1", order: 1, action: "Combine and rest", instruction: "Rice bran oil is preferred but any neutral oil will do. Combine, stir, and let sit to smooth out flavors.", duration: "", temp: "", visualCue: "", criticalPoint: false },
    ],
  },
];

async function main() {
  for (const r of recipes) {
    const fields = {
      ingredients: JSON.stringify(r.ingredients),
      steps: JSON.stringify(r.steps),
      updated_at: now,
    };
    if (r.chef_notes !== undefined) fields.chef_notes = r.chef_notes;
    if (r.yield_unit !== undefined) fields.yield_unit = r.yield_unit;

    const keys = Object.keys(fields);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map(k => fields[k]);
    vals.push(r.id);

    const res = await pool.query(
      `UPDATE recipes SET ${sets} WHERE id = $${keys.length + 1} RETURNING id, recipe_name`,
      vals
    );
    console.log('Updated:', res.rows[0]);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
