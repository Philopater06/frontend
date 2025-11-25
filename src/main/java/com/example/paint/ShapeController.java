package com.example.paint;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;
import java.util.UUID;

class Action {
    enum ActionType { CREATE, DELETE, EDIT, COPY }

    public String shapeId;
    public ActionType type;
    public Shape previousState; // For EDIT or DELETE
    public Shape newState;      // For CREATE, EDIT, COPY

    public Action(String shapeId, ActionType type, Shape previousState, Shape newState) {
        this.shapeId = shapeId;
        this.type = type;
        this.previousState = previousState;
        this.newState = newState;
    }
}

@RestController
@RequestMapping("/api/shapes")
public class ShapeController {
    private final ShapeFactory shapeFactory = new ShapeFactory();
    private final Map<String, Shape> shapeMap = new HashMap<>();
    private final Stack<Action> undoStack = new Stack<>();
    private final Stack<Action> redoStack = new Stack<>();

    @PostMapping("/create/{type}")
    public ResponseEntity<String> createShape(@PathVariable String type, @RequestBody ShapeParams params) {
        String id = UUID.randomUUID().toString();
        Shape shape = shapeFactory.getShape(type, params);
        if (shape == null) {
            return ResponseEntity.badRequest().body("Invalid shape type or parameters.");
        }
        shapeMap.put(id, shape);
        undoStack.push(new Action(id, Action.ActionType.CREATE, null, shape.clone()));
        redoStack.clear();
        shape.draw();
        return ResponseEntity.ok("Shape created with id: " + id);
    }

    @PostMapping("/delete/{id}")
    public ResponseEntity<String> deleteShape(@PathVariable String id) {
        Shape removed = shapeMap.remove(id);
        if (removed == null) {
            return ResponseEntity.badRequest().body("Shape not found.");
        }
        undoStack.push(new Action(id, Action.ActionType.DELETE, removed.clone(), null));
        redoStack.clear();
        return ResponseEntity.ok("Shape deleted" + id);
    }

    @PostMapping("/edit/{id}")
    public ResponseEntity<String> editShape(@PathVariable String id, @RequestBody ShapeParams params) {
        Shape existing = shapeMap.get(id);
        if (existing == null) {
            return ResponseEntity.badRequest().body("Shape not found.");
        }
        Shape newShape = shapeFactory.getShape(existing.getClass().getSimpleName(), params);
        shapeMap.put(id, newShape);
        newShape.draw();
        undoStack.push(new Action(id, Action.ActionType.EDIT, existing.clone(), newShape.clone()));
        redoStack.clear();
        return ResponseEntity.ok("Shape edited" + id);
    }

    @PostMapping("/copy/{id}")
    public ResponseEntity<String> copyShape(@PathVariable String id){
        Shape existing = shapeMap.get(id);
        if (id == null) {
            return ResponseEntity.badRequest().body("Invalid shape id.");
        }
        String newId = UUID.randomUUID().toString();
        Shape newShape = existing.clone();
        shapeMap.put(newId, newShape);
        undoStack.push(new Action(newId, Action.ActionType.COPY, null, newShape.clone()));
        redoStack.clear();
        newShape.draw();
        return ResponseEntity.ok("Shape copied with id: " + id);
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undo() {
        if (undoStack.isEmpty()) return ResponseEntity.badRequest().body("Can't undo");
        Action action = undoStack.pop();
        switch (action.type) {
            case CREATE -> shapeMap.remove(action.shapeId);
            case DELETE -> shapeMap.put(action.shapeId, action.previousState);
            case EDIT -> shapeMap.put(action.shapeId, action.previousState);
            case COPY -> shapeMap.remove(action.shapeId);
        }
        redoStack.push(action);
        return ResponseEntity.ok("Undo Successful");
    }

    @PostMapping("/redo")
    public ResponseEntity<String> redo() {
        if (redoStack.isEmpty()) return ResponseEntity.badRequest().body("Can't redo");
        Action action = redoStack.pop();
        switch (action.type) {
            case CREATE -> shapeMap.put(action.shapeId, action.newState);
            case DELETE -> shapeMap.remove(action.shapeId);
            case EDIT -> shapeMap.put(action.shapeId, action.newState);
            case COPY -> shapeMap.put(action.shapeId, action.newState);
        }
        undoStack.push(action);
        return ResponseEntity.ok("Redo Successful");
    }

    @PostMapping("/save/json")
    public ResponseEntity<String> saveJson() {
        ObjectMapper mapper = new ObjectMapper();
        try {
            File file = new File("shapes.json");
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, shapeMap);
            return ResponseEntity.ok("JSON file saved successfully.");
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving JSON: " + e.getMessage());
        }
    }

    @PostMapping("/save/xml")
    public ResponseEntity<String> saveXml() {
        XmlMapper xmlMapper = new XmlMapper();

        try (Writer writer = new OutputStreamWriter(new FileOutputStream("shapes.xml"), "ISO-8859-1")) {
            xmlMapper.writerWithDefaultPrettyPrinter().writeValue(writer, shapeMap);
            return ResponseEntity.ok("XML file saved successfully.");
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving XML: " + e.getMessage());
        }
    }

    @PostMapping("/load/json")
    public ResponseEntity<?> loadJSON() {
        File file = new File("shapes.json");
        if (!file.exists()) {
            return ResponseEntity.badRequest().body("JSON file not found.");
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Shape> loaded = mapper.readValue(file, new TypeReference<Map<String, Shape>>() {});

            shapeMap.clear();
            undoStack.clear();
            redoStack.clear();
            shapeMap.putAll(loaded);

            return ResponseEntity.ok(loaded);
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body("Error loading JSON: " + e.getMessage());
        }
    }

    @PostMapping("/load/xml")
    public ResponseEntity<?> loadXML() {
        File file = new File("shapes.xml");

        if (!file.exists()) {
            return ResponseEntity.badRequest().body("XML file not found.");
        }

        try {
            XmlMapper xmlMapper = new XmlMapper();
            Map<String, Shape> loaded = xmlMapper.readValue(file, new TypeReference<Map<String, Shape>>() {});

            shapeMap.clear();
            shapeMap.putAll(loaded);
            undoStack.clear();
            redoStack.clear();

            return ResponseEntity.ok(loaded);
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body("Error loading XML: " + e.getMessage());
        }
    }
}
