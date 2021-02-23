import {Turtle, AnimateDrawer, InanimateDrawer} from "./turtle.js";

/*
window.Turtle = Turtle;
window.AnimateDrawer = AnimateDrawer;
window.InanimateDrawer = InanimateDrawer;
*/

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 480;
canvas.height = 360;

const t = new Turtle(new AnimateDrawer(ctx));

const sierpinskiGasket = (size, num) => {
  for (const _ of Array(3)) {
    t.forward(size);
    t.left(120);
    if (num > 0) {
      sierpinskiGasket(size / 2, num - 1);
    }
  }
};

t.setPosition(40, 360);
t.penDown();
sierpinskiGasket(400, 4);