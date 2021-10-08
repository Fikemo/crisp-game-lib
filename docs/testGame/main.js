title = "Charge Rush";

description = `
`;

characters = [
`
  cC
 ycCY
 ycCY 
yyccyY
yyyyyY
y    Y
`,`
rr  rr
rrrrrr
rrpprr
rrrrrr
  rr
  rr
`,`
 y  y
yyyyyy
 y  y
yyyyyy
 y  y
`
];

const G = {
  WIDTH: 100,
  HEIGHT: 150,

  STAR_SPEED_MIN: 0.5,
  STAR_SPEED_MAX: 1.0,

  PLAYER_FIRE_RATE: 4,
  PLAYER_GUN_OFFSET: 3,

  FBULLET_SPEED: 5,

  ENEMY_MIN_BASE_SPEED: 1.0,
  ENEMY_MAX_BASE_SPEED: 2.0,
  ENEMY_FIRE_RATE: 45,

  EBULLET_SPEED: 2.0,
  EBULLET_ROTATION_SPD: 0.1
}

options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  seed: 2,
  isPlayingBgm: true,
  isReplayEnabled: true,
  theme: "dark",
};

/**
 * @typedef {{
 * pos: Vector,
 * speed: number
 * }} Star
 */

/**
 * @type { Star[] }
 */
let stars;

/**
 * @type { Star [] }
 */
let bigStars;

/**
 * @typedef {{
 * pos: Vector,
 * firingCooldown: number,
 * isFiringLeft: boolean
 * }} Player
 */

/**
 * @type { Player }
 */
let player;

/**
 * @typedef {{
 * pos: Vector
 * }} FBullet
 */

/**
 * @type { FBullet[] }
 */
let fBullets;

// ENEMY
/**
 * @typedef {{
 * pos:Vector,
 * firingCooldown: number,
 * }} Enemy
 */

/**
 * @type { Enemy[] }
 */
let enemies;

/**
 * @type { number }
 */
let currentEnemySpeed;

/**
 * @type { number }
 */
let waveCount;

/**
 * @typedef {{
 * pos: Vector,
 * angle: number,
 * rotation: number
 * }} EBullet
 */

/**
 * @type { EBullet [] }
 */
let eBullets;

/**
 * @param {number} num 
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
function clamp (num, min, max) { return Math.min(Math.max(num, min), max); }

// The game loop function
function update() {
  // The init function running at startup
  if (!ticks) {
    waveCount = 0;

    // A CrispGameLib function
    // First argument (number): number of times to run the second argument
    // Second argument (function): a funtion that returns an object.
    // This object is then added to an array. This array will eventually be
    // reuturned as output of the times() function
    stars = times(20, () => {
      // Random number generator function
      // rnd( min, max)
      const posX = rnd(0, G.WIDTH);
      const posY = rnd(0, G.HEIGHT);
      // An object of type Star with appropriate properties
      return {
        // Creates a vector
        pos: vec(posX, posY),
        // More RNG
        speed: rnd(G.STAR_SPEED_MIN, G.STAR_SPEED_MAX),
      }
    });

    bigStars = times(15, () => {
      const posX = rnd(0, G.WIDTH);
      const posY = rnd(0, G.HEIGHT);

      return {
        pos: vec(posX, posY),
        speed: rnd(G.STAR_SPEED_MIN, G.STAR_SPEED_MAX) * 1.4
      }
    })

    // Player
    player = {
      pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
      firingCooldown: G.PLAYER_FIRE_RATE,
      isFiringLeft: true
    };

    fBullets = [];

    // ENEMY
    enemies = [];
    waveCount = 0;
    currentEnemySpeed = 0;
    eBullets = [];
  }

  // enemy update
  if (enemies.length === 0){
    currentEnemySpeed = rnd(G.ENEMY_MIN_BASE_SPEED, G.ENEMY_MAX_BASE_SPEED) * difficulty;
    for (let i = 0; i < 9; i++){
      const posX = rnd(0, G.WIDTH);
      const posY = -rnd(i * G.HEIGHT * 0.1);
      enemies.push({ pos: vec(posX, posY), firingCooldown: G.ENEMY_FIRE_RATE});
    }

    waveCount++;
  }

  // Update for Star
  stars.forEach((s) => {
    // Move the star downwards
    s.pos.y += s.speed;
    // Bring the star back to top once it's past the bottom of the screen
    s.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);

    // Choose a color to draw
    color("light_black");
    // Draw the star as a square of size 1
    box(s.pos, 1);
  })

  bigStars.forEach((s) => {
    // Move the star downwards
    s.pos.y += s.speed;
    // Bring the star back to top once it's past the bottom of the screen
    s.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);

    // Choose a color to draw
    color("light_black");
    // Draw the star as a square of size 1
    box(s.pos, 2);
  })

  // Player
  player.pos = vec(input.pos.x, input.pos.y);
  player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);

  // Cooling down for the next shot
  player.firingCooldown--;
  // Time to fire the next shot
  if (player.firingCooldown <= 0){
    // Get the side from which the bullet is fired
    const offset = (player.isFiringLeft) ? -G.PLAYER_GUN_OFFSET : G.PLAYER_GUN_OFFSET;
    // Create the bullet
    fBullets.push({
      pos: vec(player.pos.x + offset, player.pos.y)
    });
    // Reset the firing cooldown
    player.firingCooldown = G.PLAYER_FIRE_RATE;
    // Switch the sid of the firing gun by flipping the boolean value
    player.isFiringLeft = !player.isFiringLeft;

    color("yellow");
    particle(
      player.pos.x + offset,
      player.pos.y,
      4,
      1,
      -PI/2,
      PI/4
    )
  }

  color("black");
  // box(player.pos, 4);
  char("a", player.pos);

  // Updateing and drawing bullets
  fBullets.forEach((fb) => {
    // Move the bullets upwards
    fb.pos.y -= G.FBULLET_SPEED;

    // Drawing
    color("blue");
    box(fb.pos, 1, 2);
  });

  // Another update loop
  // This time, with remove()
  remove(enemies, (e) => {
    e.pos.y += currentEnemySpeed;
    e.firingCooldown--;

    if (e.firingCooldown <= 0) {
      eBullets.push({
        pos: vec(e.pos.x, e.pos.y),
        angle: e.pos.angleTo(player.pos),
        rotation: rnd()
      });
      e.firingCooldown = G.ENEMY_FIRE_RATE;
      play("select");
    }

    color("black");

    // Shorthand to check for collision against another specific type
    // Also draw the sprite
    const isCollidingWithFBullets = char("b", e.pos).isColliding.rect.blue;

    // Check whether to make a small particle explosion at the position
    if (isCollidingWithFBullets) {
      color("yellow");
      particle(e.pos);
      play("explosion");
      addScore(10 * waveCount, e.pos);
    }

    const isCollidingWithPlayer = char("b", e.pos).isColliding.char.a;
    if (isCollidingWithPlayer) {
      end();
      play("powerUp");
    }

    return (isCollidingWithFBullets || e.pos.y > G.HEIGHT);
  });

  remove(fBullets, (fb) => {
    // Interaction from fBullets to enemies, after enemies have been drawn
    color("yellow");
    const isCollidingWithEnemies = box(fb.pos, 1, 2).isColliding.char.b;
    
    return (isCollidingWithEnemies || fb.pos.y < 0);
  });

  remove(eBullets, (eb) => {
    // Old-fashioned trigonometry to find out the velocity on each axis
    eb.pos.x += G.EBULLET_SPEED * Math.cos(eb.angle);
    eb.pos.y += G.EBULLET_SPEED * Math.sin(eb.angle);

    // The bullet also rotates around itself
    eb.rotation += G.EBULLET_ROTATION_SPD;

    color("red");

    const isCollidingWithFBullets = char("c", eb.pos, {rotation: eb.rotation}).isColliding.rect.blue;
    if (isCollidingWithFBullets) addScore(1, eb.pos);

    const isCollidingWithPlayer = char("c", eb.pos, {rotation: eb.rotation}).isColliding.char.a;

    if (isCollidingWithPlayer) {
      end();
      play("powerUp");
    }

    // If eBullet is not onscreen, remove it
    return (!eb.pos.isInRect(0, 0, G.WIDTH, G.HEIGHT));
  })
}
