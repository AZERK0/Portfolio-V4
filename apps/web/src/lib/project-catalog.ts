import "server-only";
import { cache } from "react";
import { getDatabase } from "./db";
import { demoProjects } from "./demo-projects";
import { publicUrl, type ProjectCatalog } from "./projects";

export const getProjectCatalog = cache(async (): Promise<ProjectCatalog> => {
  try {
    const database = getDatabase();
    if (!database) return { source: "demo", projects: demoProjects };

    const projects = await database.project.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        category: true,
        role: true,
        year: true,
        technologies: true,
        imageUrl: true,
        imageAlt: true,
        accentColor: true,
        liveUrl: true,
        sourceUrl: true,
      },
    });

    return {
      source: "database",
      projects: projects.map((project) => ({
        ...project,
        imageUrl: publicUrl(project.imageUrl, true),
        liveUrl: publicUrl(project.liveUrl),
        sourceUrl: publicUrl(project.sourceUrl),
        accentColor: /^#[0-9a-f]{6}$/i.test(project.accentColor)
          ? project.accentColor
          : "#f15a24",
      })),
    };
  } catch {
    // Never log the driver error: it may contain the connection string.
    console.error(
      "[projects] Database read failed; serving the explicit demo catalog.",
    );
    return { source: "demo", projects: demoProjects };
  }
});
