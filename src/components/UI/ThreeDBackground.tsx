import React, { useEffect, useRef } from 'react';

export const ThreeDBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for 3D perspective shift
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3D Nodes definition
    interface Node3D {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      size: number;
      color: string;
      speed: number;
    }

    const numNodes = 70;
    const nodes: Node3D[] = [];
    const colors = ['#0ea5e9', '#6366f1', '#a855f7', '#3b82f6', '#06b6d4'];

    for (let i = 0; i < numNodes; i++) {
      const x = (Math.random() - 0.5) * width * 1.8;
      const y = (Math.random() - 0.5) * height * 1.8;
      const z = Math.random() * 800 + 100;
      nodes.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.5 + 0.2
      });
    }

    // 3D Geometry Cubes
    interface Cube3D {
      x: number;
      y: number;
      z: number;
      size: number;
      rx: number;
      ry: number;
      rz: number;
      rotSpeedX: number;
      rotSpeedY: number;
      color: string;
    }

    const cubes: Cube3D[] = [
      { x: -width * 0.35, y: -height * 0.2, z: 400, size: 90, rx: 0.4, ry: 0.6, rz: 0.2, rotSpeedX: 0.008, rotSpeedY: 0.012, color: '#38bdf8' },
      { x: width * 0.35, y: height * 0.25, z: 500, size: 120, rx: 0.2, ry: 0.8, rz: 0.5, rotSpeedX: -0.006, rotSpeedY: 0.01, color: '#818cf8' },
      { x: width * 0.2, y: -height * 0.3, z: 300, size: 70, rx: 0.9, ry: 0.1, rz: 0.3, rotSpeedX: 0.01, rotSpeedY: -0.008, color: '#c084fc' }
    ];

    let angle = 0;

    const render = () => {
      // Smooth interpolation for mouse
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const fov = 400; // Field of view
      const centerX = width / 2;
      const centerY = height / 2;
      const mouseOffsetX = (mouseX - centerX) * 0.3;
      const mouseYOffsetY = (mouseY - centerY) * 0.3;

      ctx.clearRect(0, 0, width, height);

      // Ambient radial glow gradient in center
      const gradient = ctx.createRadialGradient(
        centerX + mouseOffsetX * 0.5,
        centerY + mouseYOffsetY * 0.5,
        10,
        centerX,
        centerY,
        Math.max(width, height) * 0.7
      );
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
      gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.06)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      angle += 0.005;

      // Draw & update 3D nodes
      nodes.forEach((node, idx) => {
        // Move nodes slightly along z
        node.z -= node.speed;
        if (node.z < 10) {
          node.z = 800;
        }

        // Apply 3D perspective projection
        const scale = fov / (fov + node.z);
        const projX = (node.x - mouseOffsetX) * scale + centerX;
        const projY = (node.y - mouseYOffsetY) * scale + centerY;
        const radius = node.size * scale * 1.8;

        if (projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.5, radius), 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, scale * 1.2));
          ctx.fill();

          // Connect nearby nodes with 3D energy lines
          for (let j = idx + 1; j < nodes.length; j++) {
            const other = nodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dz = node.z - other.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 180) {
              const otherScale = fov / (fov + other.z);
              const otherProjX = (other.x - mouseOffsetX) * otherScale + centerX;
              const otherProjY = (other.y - mouseYOffsetY) * otherScale + centerY;

              ctx.beginPath();
              ctx.moveTo(projX, projY);
              ctx.lineTo(otherProjX, otherProjY);
              ctx.strokeStyle = node.color;
              ctx.globalAlpha = (1 - dist / 180) * 0.25 * scale;
              ctx.lineWidth = 0.8 * scale;
              ctx.stroke();
            }
          }
        }
      });

      // Render wireframe 3D cubes
      cubes.forEach((cube) => {
        cube.rx += cube.rotSpeedX;
        cube.ry += cube.rotSpeedY;

        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ];

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        const projectedVerts: { x: number; y: number; scale: number }[] = [];

        vertices.forEach(([vx, vy, vz]) => {
          // Rotate vertex in 3D
          let x = vx * (cube.size / 2);
          let y = vy * (cube.size / 2);
          let z = vz * (cube.size / 2);

          // Rotate X
          let cos = Math.cos(cube.rx);
          let sin = Math.sin(cube.rx);
          let y1 = y * cos - z * sin;
          let z1 = y * sin + z * cos;

          // Rotate Y
          cos = Math.cos(cube.ry);
          sin = Math.sin(cube.ry);
          let x2 = x * cos + z1 * sin;
          let z2 = -x * sin + z1 * cos;

          // Translate cube center
          const worldX = cube.x + x2 - mouseOffsetX * 0.8;
          const worldY = cube.y + y1 - mouseYOffsetY * 0.8;
          const worldZ = cube.z + z2;

          const scale = fov / (fov + worldZ);
          const px = worldX * scale + centerX;
          const py = worldY * scale + centerY;

          projectedVerts.push({ x: px, y: py, scale });
        });

        // Draw 3D edges
        ctx.strokeStyle = cube.color;
        edges.forEach(([v1, v2]) => {
          const p1 = projectedVerts[v1];
          const p2 = projectedVerts[v2];

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.globalAlpha = Math.min(0.6, p1.scale * 0.7);
          ctx.lineWidth = 1.5 * p1.scale;
          ctx.stroke();
        });
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80 dark:opacity-90"
    />
  );
};
