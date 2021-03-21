class Loop extends EventTarget {
  constructor() {
    super();

    const _loop = (timeStamp) => {
      this.id = requestAnimationFrame(_loop);

      const now = timeStamp * 0.001;
      if (past === undefined) {
        past = now;
        return;
      }

      const delta = now - past;

      const event = new CustomEvent("tick", {
        detail: {
          delta
        }
      });
      this.dispatchEvent(event);

      past = now;
    };

    let past;
    this.id = requestAnimationFrame(_loop);
  }
  stop() {
    cancelAnimationFrame(this.id);
  }
}

const loop = new Loop();

const rotate = (angle) => ([x, y]) => {
  const r = Math.sqrt(x ** 2 + y ** 2);
  const theta = Math.atan2(y, x);

  return [r * Math.cos(theta + angle), r * Math.sin(theta + angle)];
};

const pointer = (x, y, angle) => {
  const shape = [
    [15, 0],
    [0, 5],
    [0, -5]
  ]
    .map(rotate(angle))
    .map(([_x, _y]) => [_x + x, _y + y]);

  const path = new Path2D();

  const [first, ...vertex] = shape;

  path.moveTo(first[0], first[1]);

  for (const [_x, _y] of vertex) {
    path.lineTo(_x, _y);
  }

  path.closePath();

  return path;
};

const move = (x, y, angle, steps) => [
  x + steps * Math.cos(angle),
  y + steps * Math.sin(angle)
];

// degree to radian
const deg2rad = (degree) => degree * (Math.PI / 180);

// radian to degree
const rad2deg = (radian) => radian * (180 / Math.PI);

class Turtle {
  constructor(ctx, speed) {
    this.pen_isdown = false;
    this.cmds = [];

    this.draw(ctx, speed);
  }
  update(cmds, speed, time) {
    const end_length = speed * time;

    let [x, y] = [0, 0];
    let angle = 0;
    let path = new Path2D();
    path.moveTo(0, 0);

    let now_length = 0;
    let isdone = true;

    for (const { type, value } of cmds) {
      if (type === "clear") {
        path = new Path2D();
        path.moveTo(x, y);
      } else if (type === "goto") {
        [x, y] = value;

        path.moveTo(x, y);
      } else if (type === "move") {
        const assume_length = now_length + Math.abs(value.steps);

        if (assume_length - end_length >= 0) {
          [x, y] = move(
            x,
            y,
            angle,
            Math.sign(value.steps) * (end_length - now_length)
          );
          now_length = end_length;

          path[value.isdraw ? "lineTo" : "moveTo"](x, y);
          isdone = false;
          break;
        } else {
          [x, y] = move(x, y, angle, value.steps);
          now_length += Math.abs(value.steps);

          path[value.isdraw ? "lineTo" : "moveTo"](x, y);
        }
      } else if (type === "turn") {
        angle += value;
      }
    }

    return [path, x, y, angle, isdone];
  }
  draw(ctx, speed) {
    let time = 0;

    loop.addEventListener("tick", ({ detail: { delta } }) => {
      const [path, x, y, angle, isdone] = this.update(this.cmds, speed, time);
      ctx.clearRect(0, 0, $canvas.width, $canvas.height);

      ctx.stroke(path);

      const pointer_path = pointer(x, y, angle);
      ctx.fill(pointer_path);

      if (!isdone) {
        time += delta;
      }
    });
  }
  clear() {
    this.cmds.push({
      type: "clear",
      value: null
    });
  }
  goto(x, y) {
    this.cmds.push({
      type: "goto",
      value: [x, y]
    });
  }
  move(steps) {
    this.cmds.push({
      type: "move",
      value: {
        steps,
        isdraw: this.pen_isdown
      }
    });
  }
  turn(angle) {
    this.cmds.push({
      type: "turn",
      value: deg2rad(angle)
    });
  }

  forward(steps) {
    this.move(steps);
  }
  backward(steps) {
    this.move(-steps);
  }
  right(angle) {
    this.turn(angle);
  }
  left(angle) {
    this.turn(-angle);
  }
}

export { Turtle };
