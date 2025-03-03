import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './Canvas.css';

const Canvas = ({ tool, color, strokeWidth, isEraser }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const { socket, roomId } = useSocket();

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    contextRef.current = context;

    // Handle window resize
    const handleResize = () => {
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      
      // Save current drawing
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempContext.drawImage(canvas, 0, 0);
      
      // Resize canvas
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      // Restore drawing
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = strokeWidth;
      context.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);

    // Socket event listeners for collaborative drawing
    if (socket) {
      socket.on('drawing', (data) => {
        const { x0, y0, x1, y1, color, width, tool } = data;
        drawFromSocket(x0, y0, x1, y1, color, width, tool);
      });
      
      socket.on('clear-canvas', () => {
        clearCanvas();
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket) {
        socket.off('drawing');
        socket.off('clear-canvas');
      }
    };
  }, [color, strokeWidth, socket]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    
    // Save the starting point and properties
    const element = {
      type: tool,
      offsetX,
      offsetY,
      path: [[offsetX, offsetY]],
      color: isEraser ? '#FFFFFF' : color,
      width: strokeWidth,
    };
    
    setElements((prevElements) => [...prevElements, element]);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = nativeEvent;
    
    if (tool === 'pencil') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      
      // Update the path of the current element
      setElements((prevElements) => {
        const lastIndex = prevElements.length - 1;
        const lastElement = prevElements[lastIndex];
        const newElement = {
          ...lastElement,
          path: [...lastElement.path, [offsetX, offsetY]],
        };
        
        return [...prevElements.slice(0, lastIndex), newElement];
      });
      
      // Emit drawing event for collaboration
      if (socket && roomId) {
        socket.emit('drawing', {
          x0: contextRef.current.moveTo,
          y0: contextRef.current.moveTo,
          x1: offsetX,
          y1: offsetY,
          color: isEraser ? '#FFFFFF' : color,
          width: strokeWidth,
          tool,
          roomId,
        });
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      // For shapes, we'll redraw on mouse move to show preview
      const lastIndex = elements.length - 1;
      const updatedElements = [...elements];
      updatedElements[lastIndex] = {
        ...elements[lastIndex],
        width: offsetX - elements[lastIndex].offsetX,
        height: offsetY - elements[lastIndex].offsetY,
      };
      
      redrawCanvas(updatedElements);
    }
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Save the current state to history for undo
    setHistory([]);
    
    // Emit the final element for collaboration
    if (socket && roomId && elements.length > 0) {
      const lastElement = elements[elements.length - 1];
      socket.emit('element-complete', {
        element: lastElement,
        roomId,
      });
    }
  };

  const drawFromSocket = (x0, y0, x1, y1, color, width, tool) => {
    const context = contextRef.current;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
    context.closePath();
  };

  const redrawCanvas = (elementsToRedraw) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all elements
    elementsToRedraw.forEach((element) => {
      context.beginPath();
      context.strokeStyle = element.color;
      context.lineWidth = element.width;
      
      if (element.type === 'pencil') {
        element.path.forEach((point, i) => {
          const [x, y] = point;
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        });
      } else if (element.type === 'line') {
        context.moveTo(element.offsetX, element.offsetY);
        context.lineTo(element.offsetX + element.width, element.offsetY + element.height);
      } else if (element.type === 'rectangle') {
        context.rect(element.offsetX, element.offsetY, element.width, element.height);
      } else if (element.type === 'circle') {
        const radius = Math.sqrt(element.width ** 2 + element.height ** 2);
        context.arc(element.offsetX, element.offsetY, radius, 0, 2 * Math.PI);
      }
      
      context.stroke();
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setElements([]);
    setHistory([]);
    
    if (socket && roomId) {
      socket.emit('clear-canvas', { roomId });
    }
  };

  const undo = () => {
    if (elements.length === 0) return;
    
    const lastElement = elements[elements.length - 1];
    setHistory((prevHistory) => [...prevHistory, lastElement]);
    setElements((prevElements) => prevElements.slice(0, -1));
    
    redrawCanvas(elements.slice(0, -1));
    
    if (socket && roomId) {
      socket.emit('undo', { roomId });
    }
  };

  const redo = () => {
    if (history.length === 0) return;
    
    const lastHistory = history[history.length - 1];
    setElements((prevElements) => [...prevElements, lastHistory]);
    setHistory((prevHistory) => prevHistory.slice(0, -1));
    
    redrawCanvas([...elements, lastHistory]);
    
    if (socket && roomId) {
      socket.emit('redo', { roomId });
    }
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      />
    </div>
  );
};

export default Canvas;