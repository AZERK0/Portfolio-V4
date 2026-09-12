"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";
import type { Project, ProjectCatalog } from "@/lib/projects";

function recoverArtwork(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallback) return;
  image.dataset.fallback = "true";
  image.src = "/projects/placeholder.svg";
}

export function ProjectCarousel({ catalog }: { catalog: ProjectCatalog }) {
  const { projects, source } = catalog;
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeRef = useRef(0);
  const dragRef = useRef<{ x: number; y: number; horizontal: boolean } | null>(
    null,
  );
  const wheelRef = useRef({ amount: 0, lastEvent: 0, navigated: false });
  const suppressClickRef = useRef(false);
  const project = projects[activeIndex];

  const selectProject = (index: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, index));
    activeRef.current = next;
    setActiveIndex(next);
    stageRef.current?.style.setProperty("--drag", "0px");
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
        return;
      const direction = Math.sign(event.deltaX);
      const next = activeRef.current + direction;
      if (next < 0 || next >= projects.length) return;
      event.preventDefault();
      const now = performance.now();
      const gesture = wheelRef.current;
      if (now - gesture.lastEvent > 180) {
        gesture.amount = 0;
        gesture.navigated = false;
      }
      gesture.lastEvent = now;
      if (gesture.navigated) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientWidth
            : 1;
      gesture.amount += event.deltaX * unit;
      if (Math.abs(gesture.amount) < 55) return;
      gesture.navigated = true;
      activeRef.current = next;
      setActiveIndex(next);
    };
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [projects.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = detailTriggerRef.current;
    if (!detailProject || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
      trigger?.focus({ preventScroll: true });
    };
  }, [detailProject]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next =
      event.key === "ArrowRight"
        ? activeRef.current + 1
        : event.key === "ArrowLeft"
          ? activeRef.current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? projects.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    // A slide becoming inert must not retain keyboard focus.
    event.currentTarget.focus({ preventScroll: true });
    selectProject(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest("button, a"))
    )
      return;
    dragRef.current = { x: event.clientX, y: event.clientY, horizontal: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const distance = event.clientX - drag.x;
    const vertical = event.clientY - drag.y;
    if (!drag.horizontal) {
      if (Math.abs(vertical) > Math.abs(distance) + 10) {
        dragRef.current = null;
        return;
      }
      if (Math.abs(distance) < Math.abs(vertical) + 8) return;
      drag.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const atEdge =
      (activeRef.current === 0 && distance > 0) ||
      (activeRef.current === projects.length - 1 && distance < 0);
    const limit = event.currentTarget.clientWidth * 0.6;
    const offset = Math.max(
      -limit,
      Math.min(limit, distance * (atEdge ? 0.18 : 1)),
    );
    event.currentTarget.dataset.dragging = "true";
    event.currentTarget.style.setProperty("--drag", `${offset}px`);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    event.currentTarget.style.setProperty("--drag", "0px");
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag) return;
    suppressClickRef.current = drag.horizontal;
    const distance = event.clientX - drag.x;
    if (!cancelled && drag.horizontal && Math.abs(distance) > 45)
      selectProject(activeRef.current - Math.sign(distance));
  };

  const tiltCard = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      dragRef.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 2.5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 3.5}deg`);
    event.currentTarget.style.setProperty("--light-x", `${(x + 1) * 50}%`);
    event.currentTarget.style.setProperty("--light-y", `${(y + 1) * 50}%`);
  };

  return (
    <section
      id="projets"
      className="projects-section"
      aria-labelledby="projects-heading"
    >
      <header className="projects-header">
        <p className="projects-eyebrow">
          <span className="projects-marker" />
          01 / Projets
        </p>
        <h2 id="projects-heading">
          Des idées.
          <br />
          <span>Du concret.</span>
        </h2>
      </header>

      {project ? (
        <div
          id="galerie"
          className="project-gallery"
          role="region"
          aria-roledescription="carrousel"
          aria-label="Galerie de projets"
          aria-describedby="gallery-instructions"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <p id="gallery-instructions" className="sr-only">
            Utilisez les flèches gauche et droite, les boutons de navigation ou
            glissez horizontalement pour parcourir les projets. Début et Fin
            atteignent le premier et le dernier projet.
          </p>
          <div className="project-showcase">
            <div
              ref={stageRef}
              className="project-stage"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(event) => endDrag(event)}
              onPointerCancel={(event) => endDrag(event, true)}
              onLostPointerCapture={(event) => {
                if (dragRef.current) endDrag(event, true);
              }}
              onPointerLeave={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId))
                  endDrag(event, true);
              }}
              onClickCapture={(event) => {
                if (suppressClickRef.current) {
                  event.preventDefault();
                  event.stopPropagation();
                  suppressClickRef.current = false;
                }
              }}
            >
              {projects.map((item, index) => {
                const offset = index - activeIndex;
                const selected = offset === 0;
                return (
                  <article
                    key={item.id}
                    className="project-card"
                    data-active={selected}
                    data-distant={Math.abs(offset) > 2}
                    inert={!selected}
                    aria-hidden={!selected}
                    aria-roledescription="diapositive"
                    aria-label={`${index + 1} sur ${projects.length} : ${item.title}`}
                    style={
                      {
                        "--offset": offset,
                        "--distance": Math.abs(offset),
                        "--direction": Math.sign(offset),
                        "--project-accent": item.accentColor,
                        zIndex: projects.length - Math.abs(offset),
                      } as CSSProperties
                    }
                  >
                    <div
                      className="project-card-surface"
                      onPointerMove={selected ? tiltCard : undefined}
                      onPointerLeave={(event) => {
                        event.currentTarget.style.removeProperty("--tilt-x");
                        event.currentTarget.style.removeProperty("--tilt-y");
                      }}
                    >
                      <div className="project-information">
                        <div className="project-caption">
                          <div className="project-title-row">
                            <h3>{item.title}</h3>
                            <span className="project-year">{item.year}</span>
                          </div>
                          <p className="project-summary">{item.summary}</p>
                          <p className="project-category">{item.category}</p>
                          <ul
                            className="project-technologies"
                            aria-label="Technologies"
                          >
                            {item.technologies.map(
                              (technology, technologyIndex) => (
                                <li key={`${technology}-${technologyIndex}`}>
                                  {technology}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <button
                          className="project-discover"
                          onClick={(event) => {
                            detailTriggerRef.current = event.currentTarget;
                            setDetailProject(item);
                          }}
                        >
                          Découvrir le projet{" "}
                          <ArrowUpRight size={18} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="project-artwork">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl ?? "/projects/placeholder.svg"}
                          alt={item.imageAlt ?? `Aperçu de ${item.title}`}
                          width={1280}
                          height={800}
                          loading={index > 1 ? "lazy" : "eager"}
                          decoding="async"
                          draggable={false}
                          onError={recoverArtwork}
                        />
                        {["soft", "medium", "strong"].map((blur) => (
                          <span
                            key={blur}
                            className="project-artwork-blur"
                            data-blur={blur}
                            aria-hidden="true"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl ?? "/projects/placeholder.svg"}
                              alt=""
                              width={1280}
                              height={800}
                              loading={index > 1 ? "lazy" : "eager"}
                              decoding="async"
                              draggable={false}
                              onError={recoverArtwork}
                            />
                          </span>
                        ))}
                      </div>
                      <div className="project-card-sheen" aria-hidden="true" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="project-navigation">
            <button
              className="project-arrow"
              aria-label="Projet précédent"
              disabled={activeIndex === 0}
              onClick={() => selectProject(activeIndex - 1)}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <button
              className="project-arrow"
              aria-label="Projet suivant"
              disabled={activeIndex === projects.length - 1}
              onClick={() => selectProject(activeIndex + 1)}
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Projet {activeIndex + 1} sur {projects.length} : {project.title}.
          </p>
        </div>
      ) : (
        <div className="projects-empty">
          <h3>La suite se construit.</h3>
          <p>Les projets seront présentés ici dès leur publication.</p>
        </div>
      )}

      {detailProject && (
        <dialog
          ref={dialogRef}
          className="project-dialog"
          aria-labelledby="project-dialog-title"
          onClose={() => setDetailProject(null)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              setDetailProject(null);
          }}
        >
          <button
            className="project-dialog-close project-arrow"
            aria-label="Fermer le projet"
            autoFocus
            onClick={() => setDetailProject(null)}
          >
            <X size={21} aria-hidden="true" />
          </button>
          <div className="project-dialog-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detailProject.imageUrl ?? "/projects/placeholder.svg"}
              alt={detailProject.imageAlt ?? `Aperçu de ${detailProject.title}`}
              onError={recoverArtwork}
            />
          </div>
          <div className="project-dialog-content">
            <p className="projects-eyebrow">
              {detailProject.category} / {detailProject.year}
            </p>
            <h2 id="project-dialog-title">{detailProject.title}</h2>
            <p className="project-dialog-description">
              {detailProject.description}
            </p>
            <dl>
              <div>
                <dt>Intervention</dt>
                <dd>{detailProject.role}</dd>
              </div>
              <div>
                <dt>Technologies</dt>
                <dd>
                  {detailProject.technologies.join(" · ") || "Non renseignées"}
                </dd>
              </div>
            </dl>
            <div className="project-dialog-links">
              {detailProject.liveUrl && (
                <a
                  href={detailProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir le site <ArrowUpRight size={16} aria-hidden="true" />
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
              {detailProject.sourceUrl && (
                <a
                  href={detailProject.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Code source <ArrowUpRight size={16} aria-hidden="true" />
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
            </div>
            {source === "demo" && (
              <p className="project-demo-note">
                Projet de démonstration. Ce concept illustre la présentation de
                vos futurs projets ; il ne correspond pas à une réalisation
                client.
              </p>
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}
