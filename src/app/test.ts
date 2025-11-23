// import { CommonModule } from '@angular/common';
// import { Component, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
// import Konva from 'konva';

// interface ShapeData {
//   id?: string; // ADDED: unique id for each shape
//   type: string;
//   x: number;
//   y: number;
//   width?: number;
//   height?: number;
//   radius?: number;
//   radiusX?: number;
//   radiusY?: number;
//   sides?: number;
//   points?: number[];
//   fill: string;
//   stroke: string;
//   strokeWidth: number;
// }

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './app.html',
//   styleUrls: []
// })
// export class App implements AfterViewInit {

//   // ------------------------------
//   // UI STATE
//   // ------------------------------
//   colors = [
//     'bg-[#000000]', 'bg-[#6b7280]', 'bg-[#b91c1c]', 'bg-[#f97316]', 'bg-[#eab308]', 'bg-[#84cc16]', 'bg-[#22c55e]', 'bg-[#06b6d4]', 'bg-[#2563eb]', 'bg-[#9333ea]',
//     'bg-[#ffffff]', 'bg-[#d1d5db]', 'bg-[#d97706]', 'bg-[#f472b6]', 'bg-[#fde047]', 'bg-[#d9f99d]', 'bg-[#5eead4]', 'bg-[#7dd3fc]', 'bg-[#818cf8]', 'bg-[#c4b5fd]'
//   ];

//   selectedShape = signal('');
//   selectedColor = signal('bg-[#000000]');

//   selectShape(shape: string) {
//     this.selectedShape.set(this.selectedShape() === shape ? '' : shape);
//   }

//   selectColor(color: string) {
//     this.selectedColor.set(color);
//   }

//   // ------------------------------
//   // KONVA STATE
//   // ------------------------------
//   private stage!: Konva.Stage;
//   private layer!: Konva.Layer;
//   private previewLayer!: Konva.Layer;

//   // ADDED: layer used to draw selection rectangle
//   private selectionLayer!: Konva.Layer; // ADDED
//   private selectionRect!: Konva.Rect; // ADDED

//   private startX = 0; private startY = 0;
//   private endX = 0; private endY = 0;
//   private isDrawing = false;

//   private shapes: ShapeData[] = [];

//   // ------------------------------
//   // UNDO / REDO
//   // ------------------------------
//   // ADDED: unified history for draw/delete
//   private historyStack: { type: 'draw' | 'delete'; shape: ShapeData }[] = []; // ADDED
//   private redoStack: { type: 'draw' | 'delete'; shape: ShapeData }[] = []; // ADDED

//   // ADDED: track selected shape id
//   private selectedShapeId: string | null = null; // ADDED

//   @ViewChild('canvasContainer') container!: ElementRef;

//   ngAfterViewInit() { this.initializeKonva(); }

//   private initializeKonva() {
//     const width = this.container.nativeElement.offsetWidth;
//     const height = this.container.nativeElement.offsetHeight;

//     if (!this.stage) {
//       this.stage = new Konva.Stage({ container: this.container.nativeElement, width, height });
//       this.layer = new Konva.Layer();
//       this.previewLayer = new Konva.Layer();
//       this.selectionLayer = new Konva.Layer(); // ADDED

//       this.stage.add(this.layer);
//       this.stage.add(this.previewLayer);
//       this.stage.add(this.selectionLayer); // ADDED

//       // ------------------------------
//       // Mouse events for drawing
//       // ------------------------------
//       this.stage.on('mousedown', e => this.onMouseDown(e));
//       this.stage.on('mouseup', e => this.onMouseUp(e));
//       this.stage.on('mousemove', e => this.onMouseMove(e));

//       // ADDED: click handler to select shapes
//       this.stage.on('click', e => this.onStageClick(e)); // ADDED
//     } else {
//       this.stage.width(width);
//       this.stage.height(height);
//       this.redrawAll();
//     }
//   }

//   // ------------------------------
//   // MOUSE EVENTS
//   // ------------------------------
//   private onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
//     if (!this.selectedShape()) return;
//     const pos = this.stage.getPointerPosition()!;
//     this.startX = this.endX = pos.x;
//     this.startY = this.endY = pos.y;
//     this.isDrawing = true;
//   }

//   private onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
//     if (!this.isDrawing) return;
//     const pos = this.stage.getPointerPosition()!;
//     this.endX = pos.x;
//     this.endY = pos.y;

//     this.previewLayer.destroyChildren();
//     this.drawShape(this.previewLayer, true);
//   }

//   private onMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
//     if (!this.isDrawing) return;
//     this.isDrawing = false;

//     const pos = this.stage.getPointerPosition()!;
//     this.endX = pos.x; this.endY = pos.y;

//     const shapeData = this.createShapeData();
//     this.shapes.push(shapeData);

//     // ADDED: record draw action for undo/redo
//     this.historyStack.push({ type: 'draw', shape: shapeData });
//     this.redoStack = []; // clear redo on new action

//     this.drawShape(this.layer, false, shapeData);
//     this.previewLayer.destroyChildren();
//   }

//   // ------------------------------
//   // DRAWING LOGIC
//   // ------------------------------
//   private createShapeData(): ShapeData {
//     const x = Math.min(this.startX, this.endX);
//     const y = Math.min(this.startY, this.endY);
//     const width = Math.abs(this.endX - this.startX);
//     const height = Math.abs(this.endY - this.startY);

//     const fill = this.selectedColor().replace('bg-[', '').replace(']', '');
//     const stroke = "#000000";
//     const strokeWidth = 3;
//     const type = this.selectedShape();
//     const id = `shape_${Date.now()}_${Math.floor(Math.random() * 10000)}`; // ADDED

//     if (type === 'line') {
//       return { id, type, points: [this.startX, this.startY, this.endX, this.endY], fill, stroke, strokeWidth, x: 0, y: 0 };
//     }

//     return { id, type, x, y, width, height, fill, stroke, strokeWidth };
//   }

//   private drawShape(layer: Konva.Layer, isPreview = false, shapeData?: ShapeData) {
//     const shape = shapeData || this.createShapeData();

//     switch (shape.type) {
//       case 'rectangle':
//       case 'square': {
//         const side = Math.min(shape.width!, shape.height!);
//         const rect = new Konva.Rect({
//           x: shape.x, y: shape.y,
//           width: shape.type === 'square' ? side : shape.width,
//           height: shape.type === 'square' ? side : shape.height,
//           fill: shape.fill,
//           stroke: shape.stroke,
//           strokeWidth: shape.strokeWidth,
//         });
//         (rect as any).isDrawable = true;
//         rect.setAttr('shapeId', shape.id);
//         layer.add(rect);
//         break;
//       }
//       case 'circle': {
//         const cx = shape.x + shape.width! / 2;
//         const cy = shape.y + shape.height! / 2;
//         const circ = new Konva.Circle({ x: cx, y: cy, radius: Math.min(shape.width!, shape.height!) / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth });
//         (circ as any).isDrawable = true;
//         circ.setAttr('shapeId', shape.id);
//         layer.add(circ);
//         break;
//       }
//       case 'ellipse': {
//         const cx = shape.x + shape.width! / 2;
//         const cy = shape.y + shape.height! / 2;
//         const el = new Konva.Ellipse({ x: cx, y: cy, radiusX: shape.width! / 2, radiusY: shape.height! / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth });
//         (el as any).isDrawable = true;
//         el.setAttr('shapeId', shape.id);
//         layer.add(el);
//         break;
//       }
//       case 'triangle':
//       case 'pentagon':
//       case 'hexagon': {
//         const sides = shape.type === 'triangle' ? 3 : shape.type === 'pentagon' ? 5 : 6;
//         const cx = shape.x + shape.width! / 2;
//         const cy = shape.y + shape.height! / 2;
//         const poly = new Konva.RegularPolygon({ x: cx, y: cy, sides, radius: Math.min(shape.width!, shape.height!) / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth });
//         (poly as any).isDrawable = true;
//         poly.setAttr('shapeId', shape.id);
//         layer.add(poly);
//         break;
//       }
//       case 'diamond': {
//         const midX = shape.x + shape.width! / 2;
//         const midY = shape.y + shape.height! / 2;
//         const diamond = new Konva.Line({
//           points: [midX, shape.y, shape.x + shape.width!, midY, midX, shape.y + shape.height!, shape.x, midY],
//           fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, closed: true
//         });
//         (diamond as any).isDrawable = true;
//         diamond.setAttr('shapeId', shape.id);
//         layer.add(diamond);
//         break;
//       }
//       case 'line': {
//         const ln = new Konva.Line({
//           points: shape.points!,
//           stroke: shape.fill,
//           strokeWidth: 5,
//           lineCap: 'round',
//           lineJoin: 'round'
//         });
//         (ln as any).isDrawable = true;
//         ln.setAttr('shapeId', shape.id);
//         layer.add(ln);
//         break;
//       }
//     }
//     layer.draw();
//   }

//   // ------------------------------
//   // SELECTION LOGIC
//   // ------------------------------
//   private onStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
//     const target = e.target;
//     if (target === this.stage) {
//       this.clearSelection();
//       return;
//     }
//     const shapeId = (target as any).getAttr?.('shapeId');
//     if (shapeId) this.selectShapeById(shapeId);
//     else this.clearSelection();
//   }

//   private selectShapeById(id: string) {
//     this.selectedShapeId = id;
//     const node = this.layer.findOne((n: any) => n.getAttr && n.getAttr('shapeId') === id);
//     if (!node) return;
//     this.drawSelectionBox(node);
//   }

//   private clearSelection() {
//     this.selectedShapeId = null;
//     this.selectionLayer.destroyChildren();
//     this.selectionLayer.draw();
//   }

//   private drawSelectionBox(node: Konva.Node) {
//     this.selectionLayer.destroyChildren();
//     const rect = node.getClientRect({ relativeTo: this.layer });
//     this.selectionRect = new Konva.Rect({
//       x: rect.x - 6,
//       y: rect.y - 6,
//       width: rect.width + 12,
//       height: rect.height + 12,
//       stroke: 'orange',
//       dash: [6, 4],
//       strokeWidth: 2,
//       listening: false
//     });
//     this.selectionLayer.add(this.selectionRect);
//     this.selectionLayer.draw();
//   }

//   // ------------------------------
//   // UNDO / REDO
//   // ------------------------------
//   undo() {
//     if (!this.historyStack.length) return;
//     console.log('Undo action triggered');

//     const lastAction = this.historyStack.pop()!;
//     switch (lastAction.type) {
//       case 'draw':
//         this.shapes = this.shapes.filter(s => s.id !== lastAction.shape.id);
//         break;
//       case 'delete':
//         this.shapes.push(lastAction.shape);
//         break;
//     }
//     this.redoStack.push(lastAction);
//     this.redrawAll();
//   }

//   redo() {
//     if (!this.redoStack.length) return;
//     console.log('Redo action triggered');

//     const action = this.redoStack.pop()!;
//     switch (action.type) {
//       case 'draw':
//         this.shapes.push(action.shape);
//         break;
//       case 'delete':
//         this.shapes = this.shapes.filter(s => s.id !== action.shape.id);
//         break;
//     }
//     this.historyStack.push(action);
//     this.redrawAll();
//   }

//   private redrawAll() {
//     this.layer.destroyChildren();
//     this.shapes.forEach(s => this.drawShape(this.layer, false, s));

//     if (this.selectedShapeId) {
//       const node = this.layer.findOne((n: any) => n.getAttr && n.getAttr('shapeId') === this.selectedShapeId);
//       if (node) this.drawSelectionBox(node);
//       else this.clearSelection();
//     } else {
//       this.selectionLayer.destroyChildren();
//       this.selectionLayer.draw();
//     }
//   }

//   // ------------------------------
//   // DELETE SELECTED SHAPE
//   // ------------------------------
//   deleteSelected() {
//     if (!this.selectedShapeId) return;
//     const idx = this.shapes.findIndex(s => s.id === this.selectedShapeId);
//     if (idx === -1) return;

//     const removed = this.shapes.splice(idx, 1)[0];

//     // ADDED: record delete action for undo/redo
//     this.historyStack.push({ type: 'delete', shape: removed });
//     this.redoStack = []; // clear redo on new action

//     this.selectedShapeId = null;
//     this.redrawAll();
//   }

// }