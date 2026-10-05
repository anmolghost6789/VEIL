import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { WhiteboardStroke, WhiteboardTool, RemoteCursor } from '../types';
import { getSocket } from '../services/socket';

interface WhiteboardProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  roomId,
  currentUserId,
  currentUserName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTool, setCurrentTool] = useState<WhiteboardTool>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#B6FF00');
  const [currentSize, setCurrentSize] = useState<number>(5);

  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [remoteCursor, setRemoteCursor] = useState<RemoteCursor | null>(null);

  const lastCursorEmitRef = useRef<number>(0);

  // Redraw entire canvas
  const redrawCanvas = useCallback(
    (allStrokes: WhiteboardStroke[], activePoints?: { x: number; y: number }[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber grid background on canvas
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Render committed strokes
      const drawStroke = (s: WhiteboardStroke) => {
        if (s.points.length === 0) return;
        ctx.save();
        ctx.lineWidth = s.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (s.tool === 'marker') {
          ctx.strokeStyle = s.color;
          ctx.globalAlpha = 0.4;
        } else if (s.tool === 'eraser') {
          ctx.strokeStyle = '#090909';
          ctx.lineWidth = s.size * 2;
        } else {
          ctx.strokeStyle = s.color;
          ctx.fillStyle = s.color;
          ctx.globalAlpha = 1.0;
        }

        const start = s.points[0];
        const end = s.points[s.points.length - 1];

        if (s.tool === 'pen' || s.tool === 'marker' || s.tool === 'eraser') {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y);
          }
          ctx.stroke();
        } else if (s.tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else if (s.tool === 'rect') {
          const w = end.x - start.x;
          const h = end.y - start.y;
          ctx.strokeRect(start.x, start.y, w, h);
        } else if (s.tool === 'circle') {
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.tool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headlen = 15;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headlen * Math.cos(angle - Math.PI / 6),
            end.y - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headlen * Math.cos(angle + Math.PI / 6),
            end.y - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        } else if (s.tool === 'text' && s.text) {
          ctx.font = `${Math.max(14, s.size * 3)}px "JetBrains Mono", monospace`;
          ctx.fillText(s.text, start.x, start.y);
        }

        ctx.restore();
      };

      allStrokes.forEach(drawStroke);

      // Render currently active stroke in progress
      if (activePoints && activePoints.length > 0) {
        drawStroke({
          id: 'temp',
          tool: currentTool,
          color: currentColor,
          size: currentSize,
          points: activePoints,
          userId: currentUserId,
          userName: currentUserName
        });
      }
    },
    [currentColor, currentSize, currentTool, currentUserId, currentUserName]
  );

  // Resize canvas to fill container
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas(strokes);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas, strokes]);

  // Socket listener for strokes, cursor, and clear
  useEffect(() => {
    const socket = getSocket();

    const handleRemoteStroke = ({ stroke }: { stroke: WhiteboardStroke }) => {
      setStrokes((prev) => {
        const next = [...prev, stroke];
        redrawCanvas(next);
        return next;
      });
    };

    const handleRemoteCursor = ({ cursor }: { cursor: RemoteCursor }) => {
      setRemoteCursor(cursor);
    };

    const handleRemoteClear = () => {
      setStrokes([]);
      redrawCanvas([]);
    };

    socket.on('whiteboard:draw', handleRemoteStroke);
    socket.on('whiteboard:cursor', handleRemoteCursor);
    socket.on('whiteboard:cleared', handleRemoteClear);

    return () => {
      socket.off('whiteboard:draw', handleRemoteStroke);
      socket.off('whiteboard:cursor', handleRemoteCursor);
      socket.off('whiteboard:cleared', handleRemoteClear);
    };
  }, [redrawCanvas]);

  // Coordinate helper
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  // Broadcast remote cursor throttled
  const emitCursorPosition = (x: number, y: number, action: string) => {
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 40) {
      lastCursorEmitRef.current = now;
      getSocket().emit('whiteboard:cursor', {
        roomId,
        cursor: {
          x,
          y,
          username: currentUserName,
          action
        }
      });
    }
  };

  // Start Drawing
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);

    if (currentTool === 'text') {
      const text = prompt('ENTER TEXT LABELS:');
      if (text) {
        const newStroke: WhiteboardStroke = {
          id: `stroke_${Date.now()}`,
          tool: 'text',
          color: currentColor,
          size: currentSize,
          points: [coords],
          text,
          userId: currentUserId,
          userName: currentUserName
        };
        const next = [...strokes, newStroke];
        setStrokes(next);
        setRedoStack([]);
        redrawCanvas(next);
        getSocket().emit('whiteboard:draw', { roomId, stroke: newStroke });
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([coords]);
    emitCursorPosition(coords.x, coords.y, `drawing_${currentTool}`);
  };

  // Moving
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    emitCursorPosition(coords.x, coords.y, isDrawing ? `drawing_${currentTool}` : 'hover');

    if (!isDrawing) return;
    e.preventDefault();

    const updatedPoints = [...currentPoints, coords];
    setCurrentPoints(updatedPoints);
    redrawCanvas(strokes, updatedPoints);
  };

  // End Drawing
  const handleEnd = () => {
    if (!isDrawing || currentPoints.length === 0) return;
    setIsDrawing(false);

    const newStroke: WhiteboardStroke = {
      id: `stroke_${Date.now()}`,
      tool: currentTool,
      color: currentColor,
      size: currentSize,
      points: currentPoints,
      userId: currentUserId,
      userName: currentUserName
    };

    const next = [...strokes, newStroke];
    setStrokes(next);
    setRedoStack([]);
    setCurrentPoints([]);
    redrawCanvas(next);

    getSocket().emit('whiteboard:draw', { roomId, stroke: newStroke });
  };

  // Undo / Redo / Clear
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setRedoStack((prev) => [...prev, last]);
    redrawCanvas(remaining);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextStroke = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const next = [...strokes, nextStroke];
    setStrokes(next);
    redrawCanvas(next);
    getSocket().emit('whiteboard:draw', { roomId, stroke: nextStroke });
  };

  const handleClear = () => {
    if (window.confirm('WIPE COLLABORATIVE WHITEBOARD?')) {
      setStrokes([]);
      setRedoStack([]);
      redrawCanvas([]);
      getSocket().emit('whiteboard:clear', { roomId });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-ink relative overflow-hidden select-none">
      {/* Whiteboard Toolbar */}
      <WhiteboardToolbar
        currentTool={currentTool}
        currentColor={currentColor}
        currentSize={currentSize}
        onSelectTool={setCurrentTool}
        onSelectColor={setCurrentColor}
        onSelectSize={setCurrentSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        canUndo={strokes.length > 0}
        canRedo={redoStack.length > 0}
      />

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 relative w-full h-full cursor-crosshair bg-ink-950">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 block touch-none"
        />

        {/* Remote Participant Cursor Indicator */}
        {remoteCursor && (
          <div
            className="absolute pointer-events-none transition-all duration-75 flex items-center gap-1 z-30"
            style={{ left: `${remoteCursor.x}px`, top: `${remoteCursor.y}px` }}
          >
            <div className="w-2.5 h-2.5 border-2 border-cyan-400 bg-cyan-400/40 rotate-45 animate-pulse" />
            <span className="font-mono text-[10px] bg-ink border border-cyber text-cyber px-1 py-0.5 whitespace-nowrap shadow-brutal">
              &gt; {remoteCursor.username.toLowerCase()}.{remoteCursor.action}()
            </span>
          </div>
        )}

        {/* Bottom Technical Status */}
        <div className="absolute bottom-2 left-2 pointer-events-none font-mono text-[10px] text-offwhite/40 flex items-center gap-2">
          <span>STROKES: {strokes.length}</span>
          <span>// P2P_CANVAS_SYNC: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
