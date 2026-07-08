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
  app.get("/api/recipes", async (req, res) => {
    try {
      const { search, category, concept } = req.query as Record<string, string>;
      let recipes;
      if (search) {
        recipes = await storage.searchRecipes(search);
      } else if (category) {
        recipes = await storage.getRecipesByCategory(category);
      } else if (concept) {
        recipes = await storage.getRecipesByConcept(concept);
      } else {
        recipes = await storage.getAllRecipes();
      }
      res.json(recipes);
    } catch (e) {
      console.error("GET /api/recipes error:", e);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // GET single recipe
  app.get("/api/recipes/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    try {
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      res.json(recipe);
    } catch (e) {
      console.error("GET /api/recipes/:id error:", e);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // POST create recipe
  app.post("/api/recipes", async (req, res) => {
    try {
      const body = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(body);
      res.status(201).json(recipe);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      console.error("POST /api/recipes error:", e);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // PATCH update recipe
  app.patch("/api/recipes/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    try {
      const body = insertRecipeSchema.partial().parse(req.body);
      const recipe = await storage.updateRecipe(id, body);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      res.json(recipe);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      console.error("PATCH /api/recipes/:id error:", e);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // POST upload photo for a recipe
  app.post("/api/recipes/:id/photo", upload.single("photo"), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Rename to a stable filename with extension
    const ext = req.file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const newName = `recipe_${id}_${Date.now()}.${ext}`;
    const newPath = path.join(UPLOAD_DIR, newName);
    fs.renameSync(req.file.path, newPath);

    const photoUrl = `/uploads/${newName}`;
    try {
      const recipe = await storage.updateRecipe(id, { photoUrl });
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      res.json({ photoUrl });
    } catch (e) {
      console.error("POST /api/recipes/:id/photo error:", e);
      res.status(500).json({ error: "Failed to update photo" });
    }
  });

  // DELETE photo from a recipe
  app.delete("/api/recipes/:id/photo", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    try {
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      // Delete file if it exists
      if (recipe.photoUrl) {
        const filePath = path.join(process.cwd(), recipe.photoUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await storage.updateRecipe(id, { photoUrl: null });
      res.json({ success: true });
    } catch (e) {
      console.error("DELETE /api/recipes/:id/photo error:", e);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // DELETE recipe
  app.delete("/api/recipes/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    try {
      const deleted = await storage.deleteRecipe(id);
      if (!deleted) return res.status(404).json({ error: "Recipe not found" });
      res.json({ success: true });
    } catch (e) {
      console.error("DELETE /api/recipes/:id error:", e);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  return httpServer;
}
