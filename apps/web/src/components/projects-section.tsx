import { connection } from "next/server";
import { getProjectCatalog } from "@/lib/project-catalog";
import { ProjectCarousel } from "./project-carousel";

export async function ProjectsSection() {
  await connection();
  const catalog = await getProjectCatalog();
  return <ProjectCarousel catalog={catalog} />;
}

export function ProjectsLoading() {
  return (
    <section
      className="projects-section projects-loading"
      aria-label="Projets"
      aria-busy="true"
    >
      <p className="projects-eyebrow">01 / Projets</p>
      <h2>
        Des idées.
        <br />
        <span>Du concret.</span>
      </h2>
      <p role="status">Les projets prennent place…</p>
      <div className="projects-loading-preview" aria-hidden="true" />
    </section>
  );
}
