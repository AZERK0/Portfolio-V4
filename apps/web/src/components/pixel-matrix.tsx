"use client";

import { useEffect, useRef } from "react";

type PixelCell = {
  x: number;
  y: number;
  opacity: number;
  edgeNoise: number;
};

type PointerState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  strength: number;
  targetStrength: number;
};

export type PixelMatrixProps = {
  color?: string;
  cellSpacing?: number;
  influenceRadius?: number;
  minScale?: number;
  maxScale?: number;
  edgeFade?: number;
  className?: string;
};

const randomAt = (column: number, row: number, salt: number) => {
  const value =
    Math.sin(column * 127.1 + row * 311.7 + salt * 74.7) * 43758.5453;

  return value - Math.floor(value);
};

const smoothstep = (value: number) => value * value * (3 - 2 * value);

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function PixelMatrix({
  color = "#f15a24",
  cellSpacing = 22,
  influenceRadius = 230,
  minScale = 0.17,
  maxScale = 0.76,
  edgeFade = 120,
  className,
}: PixelMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const spacing = Math.max(8, cellSpacing);
    const radius = Math.max(1, influenceRadius);
    const baseScale = clamp(minScale, 0.04, 0.9);
    const expandedScale = clamp(maxScale, baseScale, 0.96);
    const fadeDistance = Math.max(0, edgeFade);
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const pointer: PointerState = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      strength: 0,
      targetStrength: 0,
    };

    let width = 0;
    let height = 0;
    let cells: PixelCell[] = [];
    let animationFrame = 0;
    let isVisible = true;
    let prefersReducedMotion = reducedMotionQuery.matches;

    const buildCells = () => {
      const columns = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const startX = (width - (columns - 1) * spacing) / 2;
      const startY = (height - (rows - 1) * spacing) / 2;
      const nextCells: PixelCell[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          nextCells.push({
            x: startX + column * spacing,
            y: startY + row * spacing,
            opacity: 0.56 + randomAt(column, row, 5) * 0.34,
            edgeNoise: randomAt(column, row, 6),
          });
        }
      }

      cells = nextCells;
    };

    const drawCell = (cell: PixelCell, scale: number, alpha: number) => {
      const size = spacing * scale;
      const halfSize = size / 2;
      const cornerRadius = Math.min(2, size * 0.16);

      context.globalAlpha = alpha;
      context.beginPath();
      context.roundRect(
        cell.x - halfSize,
        cell.y - halfSize,
        size,
        size,
        cornerRadius,
      );
      context.fill();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      const responsiveRadius = Math.min(radius, Math.max(170, width * 0.25));

      for (const cell of cells) {
        const distanceFromPointer = Math.hypot(
          cell.x - pointer.x,
          cell.y - pointer.y,
        );
        const proximity = clamp(
          1 - distanceFromPointer / responsiveRadius,
          0,
          1,
        );
        const influence = smoothstep(proximity) * pointer.strength;
        const scale = baseScale + (expandedScale - baseScale) * influence;
        const distanceFromEdge = Math.min(
          cell.x,
          width - cell.x,
          cell.y,
          height - cell.y,
        );
        const irregularEdgeDistance =
          distanceFromEdge + (cell.edgeNoise - 0.5) * fadeDistance * 0.45;
        const edgeOpacity =
          fadeDistance === 0
            ? 1
            : 0.32 +
              smoothstep(clamp(irregularEdgeDistance / fadeDistance, 0, 1)) *
                0.68;

        drawCell(cell, scale, cell.opacity * edgeOpacity);
      }
    };

    const animate = () => {
      animationFrame = 0;

      if (!isVisible || prefersReducedMotion) {
        return;
      }

      const positionEase = 0.19;
      const strengthEase =
        pointer.targetStrength > pointer.strength ? 0.22 : 0.12;

      pointer.x += (pointer.targetX - pointer.x) * positionEase;
      pointer.y += (pointer.targetY - pointer.y) * positionEase;
      pointer.strength +=
        (pointer.targetStrength - pointer.strength) * strengthEase;
      draw();

      const positionDelta =
        Math.abs(pointer.targetX - pointer.x) +
        Math.abs(pointer.targetY - pointer.y);
      const strengthDelta = Math.abs(pointer.targetStrength - pointer.strength);

      if (
        strengthDelta > 0.006 ||
        (pointer.targetStrength > 0 && positionDelta > 0.15)
      ) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const requestDraw = () => {
      if (!animationFrame && isVisible && !prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const deactivatePointer = () => {
      pointer.targetStrength = 0;
      requestDraw();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (prefersReducedMotion) {
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      const isInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (!isInside) {
        deactivatePointer();
        return;
      }

      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;

      if (pointer.strength < 0.01) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }

      pointer.targetStrength = 1;
      requestDraw();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        deactivatePointer();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        deactivatePointer();
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pointerScaleX = width > 0 ? nextWidth / width : 1;
      const pointerScaleY = height > 0 ? nextHeight / height : 1;

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (pointer.strength > 0.01 || pointer.targetStrength > 0) {
        pointer.x *= pointerScaleX;
        pointer.y *= pointerScaleY;
        pointer.targetX *= pointerScaleX;
        pointer.targetY *= pointerScaleY;
      } else {
        pointer.x = width / 2;
        pointer.y = height / 2;
        pointer.targetX = pointer.x;
        pointer.targetY = pointer.y;
      }

      buildCells();
      draw();
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      pointer.strength = 0;
      pointer.targetStrength = 0;

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (!isVisible && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      if (isVisible) {
        draw();
        requestDraw();
      }
    });

    resizeObserver.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    intersectionObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("blur", deactivatePointer);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    resize();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("blur", deactivatePointer);
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange,
      );

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [cellSpacing, color, edgeFade, influenceRadius, maxScale, minScale]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        display: "block",
        height: "100%",
        pointerEvents: "none",
        width: "100%",
      }}
    />
  );
}
