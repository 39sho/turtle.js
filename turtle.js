const loop = (func) => {
  let then = 0;

  const _loop = (timeStamp) => {
    id = requestAnimationFrame(_loop);
    const now = timeStamp * 0.001;
    if (then === 0) {
      then = now;
      return;
    }
    const delta = now - then;

    try {
      func(delta);
    } catch (error) {
      cancelAnimationFrame(id);
      console.error(`In rAF, ${error}`);
    }

    then = now;
  };
  let id = requestAnimationFrame(_loop);

  return () => cancelAnimationFrame(id);
};

class Loop {
  constructor(func) {
    this.time = 0;
    this.action = "nothing";

    loop((delta) => {
      func(this.time);

      if (this.action === "add") {
        this.time += delta;
      }
    });
  }
  start() {
    this.action = "add";
  }
  stop() {
    this.action = "nothing";
  }
  reset() {
    this.time = 0;
  }
}

const update = (vertices, velocity, time) => {
  let length = time * velocity;

  const path = new Path2D();
  let angle = 0;
  let [x, y] = [0, 0];

  loop: for (const [first, ...vertex] of vertices) {
    let start = first;

    ({ x, y } = start);
    path.moveTo(x, y);

    for (const end of vertex) {
      const distance = {
        x: end.x - start.x,
        y: end.y - start.y
      };

      angle = Math.atan2(distance.y, distance.x); // radian

      if (0 >= length - Math.sqrt(distance.x ** 2 + distance.y ** 2)) {
        ({ x, y } = {
          x: start.x + length * Math.cos(angle),
          y: start.y + length * Math.sin(angle)
        });
        path.lineTo(x, y);

        break loop;
      } else {
        ({ x, y } = end);
        path.lineTo(x, y);

        length -= Math.sqrt(distance.x ** 2 + distance.y ** 2);
        start = end;
      }
    }
  }

  return [path, { x, y }, rad2deg(angle)];
};

const length = (vertices) => {
  let len = 0;

  for (const [first, ...vertex] of vertices) {
    let start = first;

    for (const end of vertex) {
      len += Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);

      start = end;
    }
  }

  return len;
};

const conv = ({ x, y }, angle) => (point) => {
  const r = Math.sqrt(point.x ** 2 + point.y ** 2);
  const theta = Math.atan2(point.y, point.x);

  return {
    x: r * Math.cos(theta + deg2rad(angle)) + x,
    y: r * Math.sin(theta + deg2rad(angle)) + y
  };
};

const pointer = ({ x, y }, angle) => {
  const shape = [
    { x: 15, y: 0 },
    { x: 0, y: 5 },
    { x: 0, y: -5 }
  ].map(conv({ x, y }, angle));

  const path = new Path2D();

  const [first, ...vertex] = shape;

  path.moveTo(first.x, first.y);

  for (const point of vertex) {
    path.lineTo(point.x, point.y);
  }

  path.closePath();

  return path;
};

// degree to radian
const deg2rad = (degree) => degree * (Math.PI / 180);

// radian to degree
const rad2deg = (radian) => radian * (180 / Math.PI);

const move = ({ x, y }, angle, distance) => ({
  x: x + distance * Math.cos(deg2rad(angle)),
  y: y + distance * Math.sin(deg2rad(angle))
});

// -360 < result < 360
const turn = (angle, angle2add) => (angle + angle2add) % 360;

class Turtle {
  constructor(ctx, velocity = Infinity) {
    this._x = 0;
    this._y = 0;
    this._angle = 0; // degree
    this.pen_is_down = false;

    this.velocity = velocity;
    this.vertices = [];

    this.x = 0;
    this.y = 0;
    this.angle = 0;

    this.l = new Loop((time) => {
      if (length(this.vertices) <= this.velocity * time) {
        this.l.stop();
      } else {
        this.l.start();
      }

      const [path, { x, y }, angle] = update(
        this.vertices,
        this.velocity,
        time
      );

      [this.x, this.y] = [x, y];
      this.angle = angle;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.stroke(path);
      ctx.fill(pointer({ x, y }, angle));
    });
  }
  erase() {
    [this._x, this._y] = [this.x, this.y];
    this._angle = this.angle;

    const dummy = move({ x: this.x, y: this.y }, this.angle, 1);

    this.vertices = [];
    this.vertices.push([{ x: this._x, y: this._y }, dummy]);

    this.l.reset();
  }
  penDown() {
    this.pen_is_down = true;
  }
  penUp() {
    this.pen_is_down = false;
  }
  setPosition(x, y) {
    [this._x, this._y] = [x, y];

    this.vertices.push([{ x: this._x, y: this._y }]);
  }
  forward(distance) {
    ({ x: this._x, y: this._y } = move(
      { x: this._x, y: this._y },
      this._angle,
      distance
    ));

    if (!this.pen_is_down) {
      this.vertices.push([{ x: this._x, y: this._y }]);
    } else {
      if (this.vertices.length === 0) {
        this.vertices.push([]);
      }
      this.vertices[this.vertices.length - 1].push({ x: this._x, y: this._y });
    }
  }
  backward(distance) {
    ({ x: this._x, y: this._y } = move(
      { x: this._x, y: this._y },
      this._angle,
      -distance
    ));

    if (!this.pen_is_down) {
      this.vertices.push([{ x: this._x, y: this._y }]);
    } else {
      if (this.vertices.length === 0) {
        this.vertices.push([]);
      }
      this.vertices[this.vertices.length - 1].push({ x: this._x, y: this._y });
    }
  }
  right(degree) {
    this._angle = turn(this._angle, degree);

    if (!this.pen_is_down) {
      this.vertices.push([{ x: this._x, y: this._y }]);
    } else {
      if (this.vertices.length === 0) {
        this.vertices.push([]);
      }
      this.vertices[this.vertices.length - 1].push({ x: this._x, y: this._y });
    }
  }
  left(degree) {
    this._angle = turn(this._angle, -degree);

    if (!this.pen_is_down) {
      this.vertices.push([{ x: this._x, y: this._y }]);
    } else {
      if (this.vertices.length === 0) {
        this.vertices.push([]);
      }
      this.vertices[this.vertices.length - 1].push({ x: this._x, y: this._y });
    }
  }
}

export { Turtle };