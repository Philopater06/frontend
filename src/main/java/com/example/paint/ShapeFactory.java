package com.example.paint;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import java.util.ArrayList;

interface Clonable<T> {
    T clone();
}

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = Line.class, name = "LINE"),
        @JsonSubTypes.Type(value = Circle.class, name = "CIRCLE"),
        @JsonSubTypes.Type(value = Rectangle.class, name = "RECTANGLE"),
        @JsonSubTypes.Type(value = Square.class, name = "SQUARE"),
        @JsonSubTypes.Type(value = Elipse.class, name = "ELIPSE"),
        @JsonSubTypes.Type(value = Triangle.class, name = "TRIANGLE")
})

interface Shape extends Clonable<Shape> {
    void draw();
}

class Point {
    public Double x;
    public Double y;

    public Point() {}

    public Point(Double x, Double y) {
        this.x = x;
        this.y = y;
    }
}

class Line implements Shape {
    public String color;
    public Double length;

    public Line() {} // Required for Jackson

    public Line(String c, Double l) {
        this.color = c;
        this.length = l;
    }

    @Override
    public void draw() { System.out.println("line"); }

    @Override
    public Line clone() { return new Line(this.color, this.length); }
}

class Circle implements Shape {
    public String color;
    public Point center;
    public Double radius;

    public Circle() {} // Jackson constructor

    public Circle(String color, Point center, Double radius) {
        this.color = color;
        this.center = center;
        this.radius = radius;
    }

    @Override
    public void draw() { System.out.println("circle"); }

    @Override
    public Circle clone() {
        return new Circle(this.color, new Point(center.x, center.y), this.radius);
    }
}

class Rectangle implements Shape {
    public String color;
    public Point center;
    public Double length;
    public Double width;

    public Rectangle() {}

    public Rectangle(String color, Point center, Double length, Double width) {
        this.color = color;
        this.center = center;
        this.length = length;
        this.width = width;
    }

    @Override
    public void draw() { System.out.println("rectangle"); }

    @Override
    public Rectangle clone() {
        return new Rectangle(this.color, new Point(center.x, center.y), this.length, this.width);
    }
}

class Square implements Shape {
    public String color;
    public Point center;
    public Double length;

    public Square() {}

    public Square(String color, Point center, Double length) {
        this.color = color;
        this.center = center;
        this.length = length;
    }

    @Override
    public void draw() { System.out.println("square"); }

    @Override
    public Square clone() {
        return new Square(this.color, new Point(center.x, center.y), this.length);
    }
}

class Elipse implements Shape {
    public String color;
    public Point center;
    public Double radiusx;
    public Double radiusy;

    public Elipse() {}

    public Elipse(String color, Point center, Double radiusx, Double radiusy) {
        this.color = color;
        this.center = center;
        this.radiusx = radiusx;
        this.radiusy = radiusy;
    }

    @Override
    public void draw() { System.out.println("elipse"); }

    @Override
    public Elipse clone() {
        return new Elipse(this.color, new Point(center.x, center.y), this.radiusx, this.radiusy);
    }
}

class Triangle implements Shape {
    public String color;
    public Point center;
    public Double length;
    public Double height;

    public Triangle() {}

    public Triangle(String color, Point center, Double length, Double height) {
        this.color = color;
        this.center = center;
        this.length = length;
        this.height = height;
    }

    @Override
    public void draw() { System.out.println("triangle"); }

    @Override
    public Triangle clone() {
        return new Triangle(this.color, new Point(center.x, center.y), this.length, this.height);
    }
}

class ShapeParams {
    public String color;
    public Double length;
    public Double width;
    public Double height;
    public Double radius;
    public Double radiusx;
    public Double radiusy;
    public Point center;
}

public class ShapeFactory {

    public ArrayList<Shape> ShapeArray = new ArrayList<>();
    public Shape getShape(String shape, ShapeParams params) {
        if (shape == null) return null;
        switch (shape.toUpperCase()) {
            case "LINE":
                return new Line(params.color, params.length);
            case "CIRCLE":
                return new Circle(params.color, params.center, params.radius);
            case "RECTANGLE":
                return new Rectangle(params.color, params.center, params.length, params.width);
            case "SQUARE":
                return new Square(params.color, params.center, params.length);
            case "ELIPSE":
                return new Elipse(params.color, params.center, params.radiusx, params.radiusy);
            case "TRIANGLE":
                return new Triangle(params.color, params.center, params.length, params.height);
            default:
                return null;
        }
    }
}
