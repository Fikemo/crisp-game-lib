title = "DirColle";

description = `
[Tap]
Move/(Pickup)
`;

characters = [
`
  b
 bbb
b b b
  b
  b
`,`
  p
  p
p p p
 ppp
  p
`,`
  g
 g
ggggg
 g
  g
`,`
  y
   y
yyyyy
   y
  y
`,`
 lccl
 lccl
  cc
 cyyc
lccccl
lccccl
`
];

const G = {
  WIDTH: 100,
  HEIGHT: 110
}

let spawnRate = 120;
let spawnCooldown = spawnRate;

options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 8,
};

function randomProperty (object) {
  const keys = Object.keys(object);
  return object[keys[keys.length * Math.random() << 0]];
}

const directions = {
  up: vec(0, -1),
  down: vec(0, 1),
  left: vec(-1, 0),
  right: vec(1, 0),
}

/**
 * @typedef {{
 * pos: Vector,
 * direction: Vector,
 * sprite: string,
 * }} DirPickup
 */

/**
 * @type { DirPickup[] }
 */
let pickups = [];

/**
 * @typedef {{
 * direction: Vector,
 * rotation: number,
 * sprite: string,
 * }} DirItem
 */

/**
 * @type { DirItem[] }
 */
let directionStack = [];

/**
 * @typedef {{
 * pos: Vector,
 * direction: Vector,
 * speed: number,
 * rotation: number,
 * sprite: string,
 * }} Player
 */

/**
 * @type { Player }
 */
let player;

/**
 * @param { Vector } direction 
 * @returns { DirItem }
 */
function newDirectionItem(direction) {
  let sprite;
  let rotation;
  if (direction == directions.up) {
    sprite = "a";
    rotation = 0;
  } else if (direction == directions.down) {
    sprite = "b";
    rotation = 90;
  } else if (direction == directions.left) {
    sprite = "c";
    rotation = 135;
  } else if (direction == directions.right) {
    sprite = "d";
    rotation = 45;
  }

  return {
    direction: direction,
    rotation: rotation,
    sprite: sprite
  }
}

/**
 * @param { Vector } [direction]
 * @returns { DirPickup }
 */
 function newDirectionPickup(direction) {
  if (direction == undefined) {
    direction = randomProperty(directions);
  }

  let sprite;

  let pos = vec(
    rnd(10, G.WIDTH - 10),
    rnd(10, G.WIDTH - 10)
  )

  if (direction == directions.up) {
    sprite = "a";
  } else if (direction == directions.down) {
    sprite = "b";
  } else if (direction == directions.left) {
    sprite = "c";
  } else if (direction == directions.right) {
    sprite = "d";
  }

  return {
    pos: pos,
    direction: direction,
    sprite: sprite
  }
}

/**
 * @param { Vector } direction 
 * @returns { DirItem }
 */
function newDirectionItem(direction) {
  let sprite;
  let rotation;
  if (direction == directions.up) {
    sprite = "a";
    rotation = 0;
  } else if (direction == directions.down) {
    sprite = "b";
    rotation = 90;
  } else if (direction == directions.left) {
    sprite = "c";
    rotation = 135;
  } else if (direction == directions.right) {
    sprite = "d";
    rotation = 45;
  }

  return {
    direction: direction,
    rotation: rotation,
    sprite: sprite
  }
}

function update() {
  if (!ticks) {
    // initialize arrays
    directionStack = [];
    pickups = [];

    // give the player 1 of each direction
    directionStack.push(
      newDirectionItem(directions.left),
      newDirectionItem(directions.down),
      newDirectionItem(directions.right),
      newDirectionItem(directions.up)
    );

    // define player
    player = {
      pos: vec(G.WIDTH / 2, G.WIDTH / 2),
      direction: directions.up,
      speed: 0.3,
      rotation: 0,
      sprite: "e",
    }

    // spawn four initial pickups
    times(4, () => {pickups.push(newDirectionPickup())})
  }

  // count score
  if (ticks % 30 == 0) addScore(1);

  // draw bounding box
  color("red");
  rect(0,0,4,G.WIDTH);
  rect(0,0,G.WIDTH,4);
  rect(G.WIDTH - 4, 0, 4, G.WIDTH);
  rect(0, G.WIDTH - 4, G.WIDTH, 4);

  // draw direction inventory
  color("black");
  directionStack.forEach((d, i) => {
    char(d.sprite, 4 + 6 * i, G.HEIGHT - 6);
  })

  // detect input
  if (input.isJustPressed && directionStack.length != 0) {
    const newDirection = directionStack.shift();
    player.direction = newDirection.direction;
    player.rotation = newDirection.rotation;
    console.log(input.isJustPressed.valueOf());
    play("jump");
  }

  // player update
  player.pos.add(vec(player.direction).mul(player.speed));
  char(player.sprite, player.pos, {rotation: player.rotation});

  // spawn new pickups
  if (pickups.length < 5) {
    spawnCooldown--;
  } else {
    spawnCooldown = spawnRate;
  }
  if (spawnCooldown <= 0) {
    times(2, () => {
      pickups.push(newDirectionPickup());
    });
    spawnCooldown = spawnRate;
  }

  // draw pickups and handle collsion
  remove(pickups, p => {
    const isCollidingWithPlayer = char(p.sprite, p.pos).isColliding.char[player.sprite];

    if (isCollidingWithPlayer) {
      directionStack.push(newDirectionItem(p.direction));
      play("powerUp");
    }

    return isCollidingWithPlayer;
  })

  // collision with edge (or enemy)
  color("transparent");
  const isCollidingWithEdge = char(player.sprite, player.pos).isColliding.rect.red;
  if (isCollidingWithEdge) {
    play("explosion");
    end();
  }
}
