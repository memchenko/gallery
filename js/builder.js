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
      title: "Hall",
    },
    {
      points: [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 150, y: 100 },
        { x: 150, y: 0 },
      ],
      isMain: false,
      title: "Kitchen",
    },
  ],
  activeRoom: null,
  // { point, room }
  selectedPoint: null,
};
const points = state.rooms.reduce((acc, room) => {
  acc.push(...room.points.map((point) => ({ room, point })));
  return acc;
}, []);

const UNIT_SIZE_PX = 10;
const POINT_SIZE = 5;
const POINT_CLICK_AREA = 15;
const DEFAULT_ROOM_SIZE = UNIT_SIZE_PX * 10;

const theme = {
  vertex: "#b7b2c2",
  selectedVertex: "#a391c9",
  room: "#ebf5d5",
  selectedRoom: "#cde892",
  mainRoom: "#F8EEC8",
  selectedMainRoom: "#F2D66F",
  aim: "#888888",
};

let gui;
let roomFolder = null;
let pointFolder = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();
  drawGrid();
  translate(width / 2, height / 2);
  drawRooms();
}

window.doubleClicked = function () {
  if (keyIsDown(SHIFT) || state.selectedPoint) {
    return;
  }

  const rooms = getRoomsInMousePoint();
  const isRoomSelected = state.activeRoom !== null;

  if (rooms.length === 0 && !state.activeRoom) {
    addNewRoom();
  } else if (rooms.length === 0) {
    state.activeRoom = null;
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

  if (state.activeRoom) {
    addGuiOnRoomSelected();
  } else if (isRoomSelected) {
    destroyRoomGui();
    destroyGui();
  }
};

window.mouseDragged = function () {
  if (state.activeRoom) {
    for (let i = state.activeRoom.points.length - 1; i >= 0; i--) {
      const point = state.activeRoom.points[i];

      point.x += mouseX - pmouseX;
      point.y += mouseY - pmouseY;
    }
  }
};

window.mouseReleased = function () {
  if (state.activeRoom) {
    for (let i = state.activeRoom.points.length - 1; i >= 0; i--) {
      const point = state.activeRoom.points[i];

      point.x = Math.floor(point.x / UNIT_SIZE_PX) * UNIT_SIZE_PX;
      point.y = Math.floor(point.y / UNIT_SIZE_PX) * UNIT_SIZE_PX;
    }
  }
};

window.mouseClicked = function () {
  const currentSelectedPoint = state.selectedPoint;

  if (keyIsDown(SHIFT) && !state.activeRoom) {
    const nodes = getNodes();
    const isNodeSelected = state.selectedPoint;
    const currIdx = nodes.indexOf(state.selectedPoint);

    if (!isNodeSelected) {
      state.selectedPoint = nodes[0];
    } else if (currIdx !== -1 && nodes.length > 1) {
      const nextIdx = (currIdx + 1) % nodes.length;

      state.selectedPoint = nodes[nextIdx];
    } else if (nodes.length > 0) {
      state.selectedPoint = nodes[0];
    } else {
      state.selectedPoint = null;
    }
  } else {
    state.selectedPoint = null;
  }

  if (state.selectedPoint && state.selectedPoint !== currentSelectedPoint) {
    addGuiOnNodeSelected();
  } else if (!state.selectedPoint && currentSelectedPoint) {
    destroyNodeGui();
    destroyGui();
  }
};

const nodeFunctions = {
  addNode: () => {
    const { point, room } = state.selectedPoint;
    const pointIdx = room.points.indexOf(point);
    const nextPointIdx = (pointIdx + 1) % room.points.length;

    const avgX = (room.points[pointIdx].x + room.points[nextPointIdx].x) / 2;
    const avgY = (room.points[pointIdx].y + room.points[nextPointIdx].y) / 2;

    const newPoint = {
      x: Math.floor(avgX / UNIT_SIZE_PX) * UNIT_SIZE_PX,
      y: Math.floor(avgY / UNIT_SIZE_PX) * UNIT_SIZE_PX,
    };

    room.points.splice(nextPointIdx, 0, newPoint);
    points.push({ room, point: newPoint });
  },
  remove: () => {
    const { point, room } = state.selectedPoint;

    if (room.points.length === 3) {
      return;
    }

    const pointIdxInRoom = room.points.indexOf(point);
    const pointIdxInPointsSet = points.indexOf(state.selectedPoint);

    state.selectedPoint = null;

    points.splice(pointIdxInPointsSet, 1);
    room.points.splice(pointIdxInRoom, 1);

    destroyNodeGui();
    destroyGui();
  },
};
function addGuiOnNodeSelected() {
  if (pointFolder) {
    destroyNodeGui();
  }

  if (!gui) {
    gui = new dat.GUI();
  }

  pointFolder = gui.addFolder(
    `Угол комнаты "${state.selectedPoint.room.title}"`
  );

  pointFolder.add(nodeFunctions, "addNode").name("Добавить узел");
  pointFolder.add(nodeFunctions, "remove").name("Удалить");
  pointFolder.open();
}

function destroyNodeGui() {
  gui.removeFolder(pointFolder);
  pointFolder = null;
}

function getNodes() {
  const { x: cx, y: cy } = getRelativeMousePoint();

  return points.filter(({ point: p }) => {
    const minX = cx - POINT_CLICK_AREA;
    const maxX = cx + POINT_CLICK_AREA;
    const minY = cy - POINT_CLICK_AREA;
    const maxY = cy + POINT_CLICK_AREA;

    return minX < p.x && maxX > p.x && minY < p.y && maxY > p.y;
  });
}

function addNewRoom() {
  const halfW = DEFAULT_ROOM_SIZE / 2;
  const halfH = DEFAULT_ROOM_SIZE / 2;
  const { x, y } = getRelativeMousePoint();
  const roomPoints = [
    { x: x - halfW, y: y - halfH },
    { x: x - halfW, y: y + halfH },
    { x: x + halfW, y: y + halfH },
    { x: x + halfW, y: y - halfH },
  ];

  state.rooms.push({
    isMain: false,
    title: `Room ${state.rooms.length}`,
    points: roomPoints,
  });
  state.activeRoom = state.rooms[state.rooms.length - 1];

  points.push(
    ...roomPoints.map((point) => ({ point, room: state.activeRoom }))
  );
}

const roomFunctions = {
  makeMain: () => {
    state.rooms.forEach((room) => {
      room.isMain = false;
    });
    state.activeRoom.isMain = true;
  },
  remove: () => {
    const idx = state.rooms.indexOf(state.activeRoom);
    const isRoomMain = state.activeRoom.isMain;

    state.activeRoom = null;
    state.rooms.splice(idx, 1);

    if (isRoomMain && state.rooms.length) {
      state.rooms[0].isMain = true;
    }

    destroyRoomGui();
    destroyGui();
  },
};
function addGuiOnRoomSelected() {
  if (roomFolder) {
    destroyRoomGui();
  }

  if (!gui) {
    gui = new dat.GUI();
  }

  roomFolder = gui.addFolder("Меню комнаты");
  roomFolder.add(state.activeRoom, "title").name("Название");

  if (!state.activeRoom.isMain) {
    roomFolder.add(roomFunctions, "makeMain").name("Сделать основной");
  }
  roomFolder.add(roomFunctions, "remove").name("Удалить");
  roomFolder.open();
}

function destroyRoomGui() {
  gui.removeFolder(roomFolder);
  roomFolder = null;
}

function destroyGui() {
  gui.destroy();
  gui = null;
}

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
  const { x: diffX, y: diffY } = getRelativeMousePoint();
  const x = Math.ceil(Math.abs(diffX) / UNIT_SIZE_PX) * UNIT_SIZE_PX;
  const y = Math.ceil(Math.abs(diffY) / UNIT_SIZE_PX) * UNIT_SIZE_PX;

  return {
    x: width / 2 - Math.sign(-diffX) * x,
    y: height / 2 - Math.sign(-diffY) * y,
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

  const isActive = activeRoom === room;
  const shapeColor = isMain
    ? isActive
      ? theme.selectedMainRoom
      : theme.mainRoom
    : isActive
    ? theme.selectedRoom
    : theme.room;

  strokeWeight(1.5);
  stroke(theme.vertex);
  fill(shapeColor);

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
    pointSize =
      (selectedPoint && selectedPoint.point === point) || isActive
        ? POINT_SIZE * 2
        : POINT_SIZE;

    fill(
      (selectedPoint && selectedPoint.point) === point
        ? theme.selectedVertex
        : theme.vertex
    );
    drawPoint(point.x, point.y, pointSize, pointSize);
  }
}
