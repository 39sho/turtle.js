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
      throw new Error(`In rAF, ${error}`);
    }

    then = now;
  };
  let id = requestAnimationFrame(_loop);

  return () => cancelAnimationFrame(id);
};

const animateLiner = (drawFunc, velocity) => (start, end) =>
  new Promise((resolve, reject) => {
    const distance = {
      x: end.x - start.x,
      y: end.y - start.y
    };

    const line_length = Math.sqrt(distance.x ** 2 + distance.y ** 2);

    const angle = Math.atan2(distance.y, distance.x);

    let now_length = 0;
    const stop = loop((delta) => {
      now_length = Math.min(line_length, now_length + velocity * delta);

      const now = {
        x: start.x + now_length * Math.cos(angle),
        y: start.y + now_length * Math.sin(angle)
      };

      drawFunc(start, now);

      if (now_length === line_length) {
        stop();
        resolve();
      }
    });
  });

const inanimateLiner = (ctx, vertices) => {
  ctx.beginPath();
  ctx.moveTo(vertices[0].start.x, vertices[0].start.y);

  for (const v of vertices) {
    ctx.lineTo(v.end.x, v.end.y);
  }

  ctx.stroke();
};

class AnimateDrawer {
  constructor(ctx) {
    this.canvas = ctx.canvas;
    this.ctx = ctx;

    this.vertices = [];
    this.isDraw = false;

    this.start = {
      x: 0,
      y: 0
    };

    this.animated = [];

    this.line = animateLiner((start, now) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      inanimateLiner(this.ctx, [...this.animated, { start, end: now }]);
    }, 400);
  }
  async _draw() {
    this.isDraw = true;

    let vertex;
    while (!(this.vertices.length === 0)) {
      vertex = this.vertices.shift();

      await this.line(vertex.start, vertex.end);

      this.animated.push(vertex);
    }

    this.isDraw = false;
  }
  push(point) {
    if (point.isDown) {
      this.vertices.push({
        start: this.start,
        end: point.pos
      });
    }

    this.start = point.pos;

    if (!this.isDraw) {
      this._draw();
    }
  }
}

class InanimateDrawer {
  constructor(ctx) {
    this.ctx = ctx;

    this.then = { x: 0, y: 0 };
  }
  push(point) {
    if (point.isDown) {
      inanimateLiner(this.ctx, [{ start: this.then, end: point.pos }]);
    }

    this.then = point.pos;
  }
}

class Turtle {
  constructor(drawer) {
    this.pos = { x: 0, y: 0 };
    this.angle = 0;
    this.isdown = false;

    this.drawer = drawer;
  }
  penDown() {
    this.isDown = true;
  }
  penUp() {
    this.isDown = false;
  }
  setPosition(x, y) {
    this.pos = { x, y };

    this.drawer.push({
      isDown: false,
      pos: this.pos
    });
  }
  move(distance) {
    this.pos = {
      x: this.pos.x + distance * Math.cos(this.angle * (Math.PI / 180)),
      y: this.pos.y + distance * Math.sin(this.angle * (Math.PI / 180))
    };

    this.drawer.push({
      isDown: this.isDown,
      pos: this.pos
    });
  }
  forward(distance) {
    this.move(distance);
  }
  backward(distance) {
    this.move(-distance);
  }
  turn(degree) {
    this.angle += degree;
    if (this.angle > 360) {
      this.angle -= 360;
    }
    if (this.angle < 0) {
      this.angle += 360;
    }
  }
  right(degree) {
    this.turn(degree);
  }
  left(degree) {
    this.turn(-degree);
  }
}

export {Turtle, AnimateDrawer, InanimateDrawer};
