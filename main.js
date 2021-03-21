import { Turtle } from "./turtle.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 480;
canvas.height = 360;

const t = new Turtle(ctx, 300);

const sierpinskiGasket = (size, num) => {
  for (const _ of Array(3)) {
    t.forward(size);
    t.left(120);
    if (num > 0) {
      sierpinskiGasket(size / 2, num - 1);
    }
  }
};

t.goto(40, 360);
t.pen_isdown = true;
sierpinskiGasket(400, 4);
