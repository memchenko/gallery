const SETUP_URL = "";

const state = {
  /*
  Room
  {
    // x and y are relative to world center
    points: { x: number; y: number; }[];
    isMain: boolean;
  }
  */
  rooms: [
    {
      points: [
        { x: -50, y: -50 },
        { x: -50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: -50 },
      ],
      isMain: true,
    },
  ],
  activeRoom: null,
  // { points, room }
  // room is needed here to check
  // whether points are from the same room
  selectedPoints: null,
};
const points = state.rooms.reduce((acc, room) => {
  acc.push(...room.points);
  return acc;
}, []);

const UNIT_SIZE_PX = 10;
const POINT_SIZE = 5;
const POINT_CLICK_AREA = 15;

const theme = {
  vertex: "#b7b2c2",
  selectedVertex: "#a391c9",
  room: "#ebf5d5",
  selectedRoom: "#cde892",
  aim: "#888888",
};

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();
  drawGrid();
  drawAim();
  translate(width / 2, height / 2);
  drawRooms();
}

window.doubleClicked = function () {
  const rooms = getRoomsInMousePoint();

  if (!rooms) {
    return;
  } else if (!state.activeRoom) {
    state.activeRoom = rooms[0];
  } else {
    const currIdx = rooms.indexOf(state.activeRoom);

    if (currIdx !== -1) {
      const nextIdx = (currIdx + 1) % rooms.length;

      state.activeRoom = rooms[nextIdx];
    } else {
      state.activeRoom = rooms[0];
    }
  }
};

function getRoomsInMousePoint() {
  const { x, y } = getRelativeMousePoint();

  return state.rooms.filter(({ points }) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let point;

    for (let i = points.length - 1; i >= 0; i--) {
      point = points[i];

      minX = point.x < minX ? point.x : minX;
      maxX = point.x > maxX ? point.x : maxX;
      minY = point.y < minY ? point.y : minY;
      maxY = point.y > maxY ? point.y : maxY;
    }

    return minX < x && maxX > x && minY < y && maxY > y;
  });
}

function getRelativeMousePoint() {
  return {
    x: mouseX - width / 2,
    y: mouseY - height / 2,
  };
}

function drawAim() {
  const { x, y } = getSnap();

  noFill();
  stroke(theme.aim);
  strokeWeight(0.5);
  ellipseMode(CENTER);
  ellipse(x, y, UNIT_SIZE_PX, UNIT_SIZE_PX);
}

function getSnap() {
  const halfW = width / 2;
  const halfH = height / 2;
  const diffX = halfW - mouseX;
  const diffY = halfH - mouseY;
  const x = Math.ceil(Math.abs(diffX) / UNIT_SIZE_PX) * UNIT_SIZE_PX;
  const y = Math.ceil(Math.abs(diffY) / UNIT_SIZE_PX) * UNIT_SIZE_PX;

  return {
    x: halfW - Math.sign(diffX) * x,
    y: halfH - Math.sign(diffY) * y,
  };
}

function drawGrid() {
  // grid
  strokeWeight(0.5);
  stroke(230);

  for (let w = width / 2; w > 0; w -= UNIT_SIZE_PX) {
    line(w, 0, w, height);
  }

  for (let w = width / 2; w < width; w += UNIT_SIZE_PX) {
    line(w, 0, w, height);
  }

  for (let h = height / 2; h > 0; h -= UNIT_SIZE_PX) {
    line(0, h, width, h);
  }

  for (let h = height / 2; h < height; h += UNIT_SIZE_PX) {
    line(0, h, width, h);
  }

  // central lines
  strokeWeight(1);
  stroke(150);
  line(width / 2, 0, width / 2, height);
  line(0, height / 2, width, height / 2);
}

function drawRooms() {
  const rooms = state.rooms;
  let room;

  for (let i = rooms.length - 1; i >= 0; i--) {
    room = rooms[i];

    drawRoom(room);
  }
}

function drawRoom(room) {
  const { points, isMain } = room;
  const { activeRoom, selectedPoint } = state;
  let point;

  strokeWeight(1.5);
  stroke(theme.vertex);
  fill(activeRoom === room ? theme.selectedRoom : theme.room);

  beginShape();
  for (let i = points.length - 1; i >= 0; i--) {
    point = points[i];
    vertex(point.x, point.y);
  }
  endShape(CLOSE);

  const drawPoint = isMain ? rect : ellipse;

  noStroke();
  ellipseMode(CENTER);
  rectMode(CENTER);
  for (let i = points.length - 1; i >= 0; i--) {
    point = points[i];

    fill(selectedPoint === point ? theme.selectedVertex : theme.vertex);
    drawPoint(point.x, point.y, POINT_SIZE, POINT_SIZE);
  }
}

function selectPoint() {}

function selectRoom() {}
