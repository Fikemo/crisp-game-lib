import { textPatterns } from "./textPattern";
import { context } from "./view";
import { Color, setColor, colorChars, rgbObjects, currentColor } from "./color";
import { Vector } from "./vector";
import { HitBox, hitBoxes, checkHitBoxes, Collision } from "./collision";

export type LetterOptions = {
  color?: Color;
  backgroundColor?: Color;
  rotation?: number;
  mirror?: { x?: 1 | -1; y?: 1 | -1 };
  scale?: { x?: number; y?: number };
};

export function text(
  str: string,
  x: number | VectorLike,
  y?: number | LetterOptions,
  options?: LetterOptions
) {
  return letters(false, str, x, y, options);
}

export function char(
  str: string,
  x: number,
  y: number,
  options?: LetterOptions
) {
  return letters(true, str, x, y, options);
}

export function letters(
  isCharacter: boolean,
  str: string,
  x: number | VectorLike,
  y?: number | LetterOptions,
  options?: LetterOptions
) {
  if (typeof x === "number") {
    if (typeof y === "number") {
      return print(str, x - letterSize / 2, y - letterSize / 2, {
        isCharacter,
        isCheckingCollision: true,
        color: currentColor,
        ...options
      });
    } else {
      throw "invalid params";
    }
  } else {
    return print(str, x.x - letterSize / 2, x.y - letterSize / 2, {
      isCharacter,
      isCheckingCollision: true,
      color: currentColor,
      ...(y as LetterOptions)
    });
  }
}

const dotCount = 6;
const dotSize = 1;
export const letterSize = dotCount * dotSize;

type LetterImage = {
  image: HTMLImageElement | HTMLCanvasElement;
  hitBox: HitBox;
};

let textImages: LetterImage[];
let characterImages: LetterImage[];
let cachedImages: { [key: string]: LetterImage };
let isCacheEnabled = false;
let letterCanvas: HTMLCanvasElement;
let letterContext: CanvasRenderingContext2D;

export type Options = {
  color?: Color;
  backgroundColor?: Color;
  rotation?: number;
  mirror?: { x?: 1 | -1; y?: 1 | -1 };
  scale?: { x?: number; y?: number };
  isCharacter?: boolean;
  isCheckingCollision?: boolean;
};

export const defaultOptions: Options = {
  color: "black",
  backgroundColor: "transparent",
  rotation: 0,
  mirror: { x: 1, y: 1 },
  scale: { x: 1, y: 1 },
  isCharacter: false,
  isCheckingCollision: false
};

export function init() {
  letterCanvas = document.createElement("canvas");
  letterCanvas.width = letterCanvas.height = letterSize;
  letterContext = letterCanvas.getContext("2d");
  textImages = textPatterns.map((lp, i) => {
    return {
      image: createLetterImages(lp),
      hitBox: getHitBox(String.fromCharCode(0x21 + i), false)
    };
  });
  characterImages = textPatterns.map((lp, i) => {
    return {
      image: createLetterImages(lp),
      hitBox: getHitBox(String.fromCharCode(0x21 + i), false)
    };
  });
  cachedImages = {};
}

export function defineCharacters(pattern: string[], startLetter: string) {
  const index = startLetter.charCodeAt(0) - 0x21;
  pattern.forEach((lp, i) => {
    characterImages[index + i] = {
      image: createLetterImages(lp),
      hitBox: getHitBox(String.fromCharCode(0x21 + index + i), true)
    };
  });
}

export function enableCache() {
  isCacheEnabled = true;
}

export function print(
  _str: string,
  x: number,
  y: number,
  _options: Options = {}
): Collision {
  const options = mergeDefaultOptions(_options);
  const bx = Math.floor(x);
  let str = _str;
  let px = bx;
  let py = Math.floor(y);
  let collision: Collision = { isColliding: { rect: {}, text: {}, char: {} } };
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "\n") {
      px = bx;
      py += letterSize * options.scale.y;
      continue;
    }
    const charCollision = printChar(c, px, py, options);
    if (options.isCheckingCollision) {
      collision = {
        isColliding: {
          rect: {
            ...collision.isColliding.rect,
            ...charCollision.isColliding.rect
          },
          text: {
            ...collision.isColliding.text,
            ...charCollision.isColliding.text
          },
          char: {
            ...collision.isColliding.char,
            ...charCollision.isColliding.char
          }
        }
      };
    }
    px += letterSize * options.scale.x;
  }
  return collision;
}

export function printChar(
  c: string,
  x: number,
  y: number,
  _options: Options
): Collision {
  const cca = c.charCodeAt(0);
  if (cca < 0x20 || cca > 0x7e) {
    return { isColliding: { rect: {}, text: {}, char: {} } };
  }
  const options = mergeDefaultOptions(_options);
  if (options.backgroundColor !== "transparent") {
    setColor(options.backgroundColor, false);
    context.fillRect(
      x,
      y,
      letterSize * options.scale.x,
      letterSize * options.scale.y
    );
  }
  if (cca <= 0x20 || options.color === "transparent") {
    return { isColliding: { rect: {}, text: {}, char: {} } };
  }
  const cc = cca - 0x21;
  const li = options.isCharacter ? characterImages[cc] : textImages[cc];
  const rotation = wrap(options.rotation, 0, 4);
  if (
    options.color === "black" &&
    rotation === 0 &&
    options.mirror.x === 1 &&
    options.mirror.y === 1
  ) {
    return drawLetterImage(
      li,
      x,
      y,
      options.scale as VectorLike,
      options.isCheckingCollision
    );
  }
  const cacheIndex = JSON.stringify({ c, options });
  const ci = cachedImages[cacheIndex];
  if (ci != null) {
    return drawLetterImage(
      ci,
      x,
      y,
      options.scale as VectorLike,
      options.isCheckingCollision
    );
  }
  letterContext.clearRect(0, 0, letterSize, letterSize);
  if (rotation === 0 && options.mirror.x === 1 && options.mirror.y === 1) {
    letterContext.drawImage(li.image, 0, 0);
  } else {
    letterContext.save();
    letterContext.translate(letterSize / 2, letterSize / 2);
    letterContext.rotate((Math.PI / 2) * rotation);
    if (options.mirror.x === -1 || options.mirror.y === -1) {
      letterContext.scale(options.mirror.x, options.mirror.y);
    }
    letterContext.drawImage(li.image, -letterSize / 2, -letterSize / 2);
    letterContext.restore();
  }
  if (options.color !== "black") {
    letterContext.globalCompositeOperation = "source-in";
    setColor(options.color, true, letterContext);
    letterContext.fillRect(0, 0, letterSize, letterSize);
    letterContext.globalCompositeOperation = "source-over";
  }
  const hitBox = getHitBox(c, options.isCharacter);
  if (isCacheEnabled) {
    const cachedImage = document.createElement("img");
    cachedImage.src = letterCanvas.toDataURL();
    cachedImages[cacheIndex] = {
      image: cachedImage,
      hitBox
    };
  }
  return drawLetterImage(
    { image: letterCanvas, hitBox },
    x,
    y,
    options.scale as VectorLike,
    options.isCheckingCollision
  );
}

function drawLetterImage(
  li: LetterImage,
  x: number,
  y: number,
  scale: VectorLike,
  isCheckCollision: boolean
) {
  if (scale.x === 1 && scale.y === 1) {
    context.drawImage(li.image, x, y);
  } else {
    context.drawImage(
      li.image,
      x,
      y,
      letterSize * scale.x,
      letterSize * scale.y
    );
  }
  if (!isCheckCollision) {
    return;
  }
  const hitBox = {
    pos: { x: x + li.hitBox.pos.x, y: y + li.hitBox.pos.y },
    size: { x: li.hitBox.size.x * scale.x, y: li.hitBox.size.y * scale.y },
    collision: li.hitBox.collision
  };
  const collision = checkHitBoxes(hitBox);
  hitBoxes.push(hitBox);
  return collision;
}

function createLetterImages(
  pattern: string,
  isSkippingFirstAndLastLine = true
) {
  letterContext.clearRect(0, 0, letterSize, letterSize);
  let p = pattern.split("\n");
  if (isSkippingFirstAndLastLine) {
    p = p.slice(1, p.length - 1);
  }
  let pw = 0;
  p.forEach(l => {
    pw = Math.max(l.length, pw);
  });
  const xPadding = Math.max(Math.ceil((dotCount - pw) / 2), 0);
  const ph = p.length;
  const yPadding = Math.max(Math.ceil((dotCount - ph) / 2), 0);
  p.forEach((l, y) => {
    if (y + yPadding >= dotCount) {
      return;
    }
    for (let x = 0; x < dotCount - xPadding; x++) {
      const c = l.charAt(x);
      let ci = colorChars.indexOf(c);
      if (c !== "" && ci >= 1) {
        const rgb = rgbObjects[ci];
        letterContext.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
        letterContext.fillRect(
          (x + xPadding) * dotSize,
          (y + yPadding) * dotSize,
          dotSize,
          dotSize
        );
      }
    }
  });
  const img = document.createElement("img");
  img.src = letterCanvas.toDataURL();
  return img;
}

function getHitBox(c: string, isCharacter: boolean) {
  const b: HitBox = {
    pos: new Vector(letterSize, letterSize),
    size: new Vector(),
    collision: { isColliding: { char: {}, text: {} } }
  };
  if (isCharacter) {
    b.collision.isColliding.char[c] = true;
  } else {
    b.collision.isColliding.text[c] = true;
  }
  const d = letterContext.getImageData(0, 0, letterSize, letterSize).data;
  let i = 0;
  for (let y = 0; y < letterSize; y++) {
    for (let x = 0; x < letterSize; x++) {
      if (d[i + 3] > 0) {
        if (x < b.pos.x) {
          b.pos.x = x;
        }
        if (y < b.pos.y) {
          b.pos.y = y;
        }
        if (x > b.pos.x + b.size.x - 1) {
          b.size.x = x - b.pos.x + 1;
        }
        if (y > b.pos.y + b.size.y - 1) {
          b.size.y = y - b.pos.y + 1;
        }
      }
      i += 4;
    }
  }
  return b;
}

function mergeDefaultOptions(_options: Options) {
  let options: Options = { ...defaultOptions, ..._options };
  if (_options.scale != null) {
    options.scale = { ...defaultOptions.scale, ..._options.scale };
  }
  if (_options.mirror != null) {
    options.mirror = { ...defaultOptions.mirror, ..._options.mirror };
  }
  return options;
}
