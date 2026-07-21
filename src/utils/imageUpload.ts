import { getAccessToken } from '../api/client';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export const MAX_IMAGES = 6;
const MAX_DIMENSION = 1200;   // px — longest edge after resize
const JPEG_QUALITY  = 0.82;

/** Human-readable guard so we reject obviously-wrong files early. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Down-scale + re-encode an image entirely in the browser so we never ship a
 * 5 MB phone photo over the wire (or into the DB as a data URL). Returns a
 * compressed JPEG data URL.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Image processing is not supported here.')); return; }
        // White backdrop so transparent PNGs don't turn black when flattened to JPEG.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload one image and return a URL to store on the product.
 *
 * Strategy: compress in the browser, then try the backend Cloudinary proxy
 * (`POST /upload/image`). If Cloudinary isn't configured (or the call fails),
 * fall back to the compressed data URL so the feature still works end-to-end
 * in local/dev without any external service.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!isImageFile(file)) throw new Error('Please choose an image file.');

  const dataUrl = await compressImage(file);

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const form = new FormData();
    form.append('file', blob, (file.name.replace(/\.\w+$/, '') || 'image') + '.jpg');

    const token = getAccessToken();
    const res = await fetch(`${BASE}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (res.ok) {
      const json = (await res.json()) as { data?: { url?: string } };
      if (json.data?.url) return json.data.url;
    }
  } catch {
    /* fall through to data-URL fallback */
  }

  // Fallback: store the compressed image inline. Works with zero config.
  return dataUrl;
}

/** Generic single-image upload (store logos, banners, etc). Same pipeline as products. */
export const uploadImage = uploadProductImage;
