export interface SpriteBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SpriteAtlasBuilder {
  private readonly _ctx: CanvasRenderingContext2D;
  private _buildX = 0;
  private _buildY = 0;
  private _maxY = 0;
  private readonly _sprites = new Map<string, SpriteBounds>();

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error();
    }
    this._ctx = ctx;
  }

  public async addSprite(
    key: string,
    imageBitmap: ImageBitmap,
    width: number,
    height: number,
  ) {
    if (!key) {
      throw new Error();
    }
    if (!imageBitmap) {
      throw new Error();
    }
    if (!width) {
      throw new Error();
    }
    if (!height) {
      throw new Error();
    }

    if (this._buildY + height >= this.canvas.height) {
      throw new Error('The canvas can not fit this image.');
    }

    if (this._buildX + width > this.canvas.width) {
      this._buildX = 0;
      this._buildY = this._maxY;
    }

    this._ctx.drawImage(imageBitmap, this._buildX, this._buildY, width, height);

    this._sprites.set(key, {
      x: this._buildX,
      y: this._buildY,
      width,
      height,
    });

    this._buildX += width;
    this._maxY = Math.max(this._maxY, this._buildY + height);
  }

  public getSpriteBounds(): ReadonlyMap<string, Readonly<SpriteBounds>> {
    return this._sprites;
  }
}

// https://stackoverflow.com/a/12300351/246901
export function dataURItoBlob(dataURI: string) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], { type: mimeString });
  return blob;
}

export function sortByHeightThenWidth(
  a: { width: number; height: number },
  b: { width: number; height: number },
) {
  if (a.height < b.height) {
    return -1;
  } else if (a.height > b.height) {
    return 1;
  } else {
    if (a.width < b.width) {
      return -1;
    } else if (a.width > b.width) {
      return 1;
    } else {
      return 0;
    }
  }
}
