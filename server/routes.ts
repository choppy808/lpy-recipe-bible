import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Store uploads in /uploads inside the project root (persists with the server)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

export function registerRoutes(httpServer: ReturnType<typeof createServer>, app: Express) {
  // GET all recipes
  app.get("/api/recipes", (req, res) => {
    try {
      const { search, category, concept } = req.query as Record<string, string>;
      let recipes;
      if (search) {
        recipes = storage.searchRecipes(search);
      } else if (category) {
        recipes = storage.getRecipesByCategory(category);
      } else if (concept) {
        recipes = storage.getRecipesByConcept(concept);
      } else {
        recipes = storage.getAllRecipes();
      }
      res.json(recipes);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // GET single recipe
  app.get("/api/recipes/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const recipe = storage.getRecipe(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  });

  // POST create recipe
  app.post("/api/recipes", (req, res) => {
    try {
      const body = insertRecipeSchema.parse(req.body);
      const recipe = storage.createRecipe(body);
      res.status(201).json(recipe);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // PATCH update recipe
  app.patch("/api/recipes/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    try {
      const body = insertRecipeSchema.partial().parse(req.body);
      const recipe = storage.updateRecipe(id, body);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      res.json(recipe);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // POST upload photo for a recipe
  app.post("/api/recipes/:id/photo", upload.single("photo"), (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Rename to a stable filename with extension
    const ext = req.file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const newName = `recipe_${id}_${Date.now()}.${ext}`;
    const newPath = path.join(UPLOAD_DIR, newName);
    fs.renameSync(req.file.path, newPath);

    const photoUrl = `/uploads/${newName}`;
    const recipe = storage.updateRecipe(id, { photoUrl });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json({ photoUrl });
  });

  // DELETE photo from a recipe
  app.delete("/api/recipes/:id/photo", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const recipe = storage.getRecipe(id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    // Delete file if it exists
    if (recipe.photoUrl) {
      const filePath = path.join(process.cwd(), recipe.photoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    storage.updateRecipe(id, { photoUrl: null });
    res.json({ success: true });
  });

  // DELETE recipe
  app.delete("/api/recipes/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const deleted = storage.deleteRecipe(id);
    if (!deleted) return res.status(404).json({ error: "Recipe not found" });
    res.json({ success: true });
  });

  return httpServer;
}
