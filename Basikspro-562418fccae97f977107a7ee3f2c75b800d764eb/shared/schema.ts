import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  duration: text("duration").notNull(),
  model: text("model").notNull(),
  speakerAName: text("speaker_a_name").notNull().default("Speaker A"),
  speakerBName: text("speaker_b_name").notNull().default("Speaker B"),
  speakerNarratorName: text("speaker_narrator_name").notNull().default("Narrator"),
  speakerAVoice: text("speaker_a_voice").notNull().default("alloy"),
  speakerBVoice: text("speaker_b_voice").notNull().default("echo"),
  speakerNarratorVoice: text("speaker_narrator_voice").notNull().default("shimmer"),
  audioProvider: text("audio_provider").notNull().default("gemini"),
  backgroundImage: text("background_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dialogues = pgTable("dialogues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  sequence: integer("sequence").notNull(),
  speaker: text("speaker").notNull(), // 'A', 'B', or 'N' (narrator)
  text: text("text").notNull(),
  audioUrl: text("audio_url"),
  transcript: text("transcript"), // Gemini-generated transcript from audio
});

export const videoJobs = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").notNull().default(0),
  config: text("config").notNull(), // JSON string of segment configs
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// === RELATIONS ===
export const projectsRelations = relations(projects, ({ many }) => ({
  dialogues: many(dialogues),
  videoJobs: many(videoJobs),
}));
export const dialoguesRelations = relations(dialogues, ({ one }) => ({
  project: one(projects, { fields: [dialogues.projectId], references: [projects.id] }),
}));
export const videoJobsRelations = relations(videoJobs, ({ one }) => ({
  project: one(projects, { fields: [videoJobs.projectId], references: [projects.id] }),
}));

// === SCHEMAS ===
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertDialogueSchema = createInsertSchema(dialogues).omit({ id: true });
export const insertVideoJobSchema = createInsertSchema(videoJobs).omit({ id: true, createdAt: true, completedAt: true });

// === TYPES ===
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Dialogue = typeof dialogues.$inferSelect;
export type InsertDialogue = z.infer<typeof insertDialogueSchema>;
export type VideoJob = typeof videoJobs.$inferSelect;
export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;
export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;
export type UpdateDialogueRequest = Partial<InsertDialogue>;
export type GenerateScriptRequest = { topic: string; duration: string; model: string; };
export type RewriteDialogueRequest = { text: string; instructions: string; model: string; };
export type ProjectResponse = Project & { dialogues: Dialogue[] };
export type ProjectsListResponse = Project[];
export type DialogueResponse = Dialogue;
export type AudioGenerationResponse = { audioUrl: string };
