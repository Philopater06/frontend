// import { CommonModule } from '@angular/common';
// import { Component, signal, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import Konva from 'konva';
// import { Shape } from 'konva/lib/Shape';

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

//   //totos:drag boolean: to detect weather the user is drawing or dragging and resizing an object
//   drag=signal(false);

//   selectShape(shape: string) {
//     this.drag.set(false);
//     this.selectedShape.set(shape);
//   }

//   selectColor(color: string) {
//     this.selectedColor.set(color);
//   }
  
//   //totos:dragMode
//   toggleDragMode(){
//     this.drag.set(!this.drag())
//     this.layer.getChildren().forEach((node) => {
//       if (node.className !== 'Transformer') {
//         node.draggable(this.drag());
//       }
//     });
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
//   private historyStack: { type: 'draw' | 'delete' | 'edit'; shape: ShapeData }[] = []; // ADDED
//   private redoStack: { type: 'draw' | 'delete' | 'edit'; shape: ShapeData }[] = []; // ADDED

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
//     console.log('Mouse down - start drawing');
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
//     console.log('Mouse up - finalize shape');
//     this.isDrawing = false;

//     const pos = this.stage.getPointerPosition()!;
//     this.endX = pos.x; this.endY = pos.y;

//     if (this.startX === this.endX && this.startY === this.endY) {
//       this.previewLayer.destroyChildren();
//       return; // no shape drawn
//     }
//     const shapeData = this.createShapeData();
//     this.shapes.push(this.CopyForEdit(shapeData));

//     // ADDED: record draw action for undo/redo
//     this.historyStack.push({ type: 'draw', shape: this.CopyForEdit(shapeData) });
//     this.redoStack = []; // clear redo on new action

//     this.drawShape(this.layer, false, shapeData);
//     this.previewLayer.destroyChildren();
//   }

//   // ------------------------------
//   // DRAWING LOGIC
//   // ------------------------------
//   private createShapeData(): ShapeData {
//     const dx = this.endX - this.startX;
//     const dy = this.endY - this.startY;
//     const absDx = Math.abs(dx);
//     const absDy = Math.abs(dy);

//     // Default bounding box anchored so one corner is the initial mouse-down
//     let x = Math.min(this.startX, this.endX);
//     let y = Math.min(this.startY, this.endY);
//     let width = absDx;
//     let height = absDy;

//     const fill = this.selectedColor().replace('bg-[', '').replace(']', '');
//     const stroke = "#000000";
//     const strokeWidth = 3;
//     const type = this.selectedShape();
//     const id = `shape_${Date.now()}_${Math.floor(Math.random() * 10000)}`; // ADDED

//     if (type === 'line') {
//       return { id, type, points: [this.startX, this.startY, this.endX, this.endY], fill, stroke, strokeWidth, x: 0, y: 0 };
//     }


//     // For shapes that must maintain the initial mouse-down point as a fixed corner
//     if (type === 'square' || type === 'circle' || type === 'triangle' || type === 'pentagon' || type === 'hexagon') {
//       // use the smaller side so the shape stays within the user's drag box
//       const side = Math.min(absDx, absDy);
//       width = height = side;
//       // position x/y so that the corner at (startX,startY) remains fixed
//       x = this.startX + (dx < 0 ? -side : 0);
//       y = this.startY + (dy < 0 ? -side : 0);
//       return { id, type, x, y, width, height, fill, stroke, strokeWidth };
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
//           draggable:false
//         });
//         (rect as any).isDrawable = true;
//         rect.setAttr('shapeId', shape.id);
//         layer.add(rect);
//         break;
//       }
//       case 'circle': {
//         const cx = shape.x + shape.width! / 2;
//         const cy = shape.y + shape.height! / 2;
//         const circ = new Konva.Circle({ x: cx, y: cy, radius: Math.min(shape.width!, shape.height!) / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, draggable:false });
//         (circ as any).isDrawable = true;
//         circ.setAttr('shapeId', shape.id);
//         layer.add(circ);
//         break;
//       }
//       case 'ellipse': {
//         const cx = shape.x + shape.width! / 2;
//         const cy = shape.y + shape.height! / 2;
//         const el = new Konva.Ellipse({ x: cx, y: cy, radiusX: shape.width! / 2, radiusY: shape.height! / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, draggable:false });
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
//         const poly = new Konva.RegularPolygon({ x: cx, y: cy, sides, radius: Math.min(shape.width!, shape.height!) / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, draggable:false });
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
//           fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, closed: true, draggable:false
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
//           lineJoin: 'round',
//           draggable:false
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
    

//     // totos1: dragging functionality
//     if(this.drag()){
      
//     }
//     // totos1: end of edit

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

//         // // totos: get the last occurance of the shape with the same id and remove it
//         // for(let i=this.shapes.length-1;i>=0;i--){
//         //   if(this.shapes[i].id===lastAction.shape.id){
//         //     this.shapes.splice(i,1);
//         //     break;
//         //   }
//         // }
//         this.shapes = this.shapes.filter(s => s.id !== lastAction.shape.id);
//         break;
//       case 'delete':
//         let shallowCopy=this.CopyForEdit(lastAction.shape);
//         this.shapes.push(shallowCopy);
//         break;

//       case 'edit':
//         // this.deleteAfterEdit(lastAction.shape.id!)
//         // totos: get the last occurance of the shape with the same id and remove it
//         for(let i=this.historyStack.length-1;i>=0;i--){
//           if(this.historyStack[i].shape.id===lastAction.shape.id){
//             this.shapes.find(s=>{
//               if(s.id===lastAction.shape.id)
//                 s.fill=this.historyStack[i].shape.fill;
//               return;
//             })
//             break;
//           }
//         }

//     }
//     console.log("history stack: after undo: " ,this.historyStack);
//     console.log("redo stack: after redo: ",this.redoStack);
//     this.redoStack.push(lastAction);
//     this.redrawAll();
//   }

//   redo() {
//     if (!this.redoStack.length) return;
//     console.log('Redo action triggered');

//     const action = this.redoStack.pop()!;
//     switch (action.type) {
//       case 'draw':
//         let shallowCopy=this.CopyForEdit(action.shape);
//         this.shapes.push(shallowCopy);
//         break;
//       case 'delete':

//       // // totos: get the last occurance of the shape with the same id and remove it
//       //   for(let i=this.shapes.length-1;i>=0;i--){
//       //     if(this.shapes[i].id===action.shape.id){
//       //       this.shapes.splice(i,1);
//       //       break;
//       //     }
//       //   }
//         this.shapes = this.shapes.filter(s => s.id !== action.shape.id);
//         break;
//       case 'edit':
//         // this.deleteAfterEdit(lastAction.shape.id!)
//         // totos: get the last occurance of the shape with the same id and remove it
//         // for(let i=this.shapes.length-1;i>=0;i--){
//         //   if(this.historyStack[i].shape.id===action.shape.id){
//         //     this.shapes.find(s=>{
//         //       if(s.id===action.shape.id)
//         //         s=this.historyStack[i].shape;
//         //       return;
//         //     })
//         //     break;
//         //   }
//         // }
//         this.shapes.find(s=>{
//           if(s.id===action.shape.id)
//             s.fill=action.shape.fill;
//           return;
//         })
//         break;
//     }
    
//     this.historyStack.push(action);
//     console.log("history stack: after redo: ",this.historyStack);
//     console.log("redo stack: after redo: ",this.redoStack);
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
//     console.log("history stack: after delete:  " ,this.historyStack);
//     this.selectedShapeId = null;
//     this.redrawAll();
//   }
//   // totos : delete after edit without pushing the deleted object in history stack
//   deleteAfterEdit(id:String) {
//     // if (!this.selectedShapeId) return;
//     const idx = this.shapes.findIndex(s => s.id === id);
//     if (idx === -1) return;

//     const removed = this.shapes.splice(idx, 1)[0];

//     // // ADDED: record delete action for undo/redo
//     // this.historyStack.push({ type: 'edit', shape: removed });
//     // this.redoStack = []; // clear redo on new action
//     console.log("history stack: after delete for edit: " ,this.historyStack);
//     this.selectedShapeId = null;
//     this.redrawAll();
//   }

//   // ------------------------------
//   // CHANGE COLOR SELECTED SHAPE
//   // ------------------------------

//   changeColor() {
//     if (!this.selectedShapeId) return;
//     const shape = this.shapes.find(s => s.id === this.selectedShapeId);
//     if (!shape) return;

//     let shallowCopy=this.CopyForEdit(shape);
//     shallowCopy.fill = this.selectedColor().replace('bg-[', '').replace(']', '');
//     // this.deleteAfterEdit(shape.id!);
//     this.historyStack.push({ type: 'edit', shape: shallowCopy });
    
//     this.shapes.find(s=>{
//       if(s.id===shallowCopy.id)
//         s.fill=shallowCopy.fill;
//       return;
//     })
//     console.log("shapes array after changing color:",this.shapes)
//     // this.shapes.push(shallowCopy);
//     console.log("history stack:after changing color: " ,this.historyStack);

//     this.layer.destroyChildren();
//     this.redrawAll();
//   }

//   // ------------------------------
//   // tots: COPY SELECTED SHAPE 
//   // copyforEdit make a copy with the same id
//   // deep copy changes the id with a new one (a completely new object)
//   // ------------------------------

//   deepCopy(shape: ShapeData): ShapeData {
//     return {
//        ...shape,x:shape.x+20,y:shape.y+20, id: `copy_${Date.now()}_${Math.floor(Math.random() * 10000)}`
//     };
//   }

//   CopyForEdit(shape: ShapeData): ShapeData {
//     return JSON.parse(JSON.stringify(shape)); 
//   }

//   // ------------------------------
//   // tots: copy functionality 
//   // ------------------------------
//   copy(){
//     if (!this.selectedShapeId) return;
//     const shape = this.shapes.find(s => s.id === this.selectedShapeId);
//     if (!shape) return;
//     let copy=this.deepCopy(shape);
//     const shallowCopy=this.CopyForEdit(copy);
//     this.shapes.push(shallowCopy);
//     this.historyStack.push({ type: 'draw', shape: shallowCopy });
//     this.selectedShapeId=shallowCopy.id!
//     console.log(this.shapes);
//     this.redoStack=[];
//     this.redrawAll();
//   }


//   dragging(){
//     this.toggleDragMode();
//     this.selectedShape.set('');
//   }

//   //keyboard listeners integration
//   @HostListener('window:keydown', ['$event'])
//   handleKeyboardEvent(event: KeyboardEvent) {
//     if (event.ctrlKey && event.key.toLowerCase() === 'z') {
//       this.undo();
//     }
//     if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
//       this.redo();
//     }
//     if (event.key=='Backspace') {
//       this.deleteSelected();
//     }
//   }


// }