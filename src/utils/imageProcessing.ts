export interface EraserLayer {
    id: string;
    color: { r: number; g: number; b: number } | null;
    tolerance: number;   // 0-100
    feather: number;     // 0-20
    transparency: number; // 0-100
    isActive: boolean;
}

export interface ProcessingParams {
    layers: EraserLayer[];
    choke: number; // Global choke applied after all layers
}

/**
 * Calculates color distance using Euclidean distance in RGB space.
 * Returns a value between 0 and 1 (normalized).
 */
function colorDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number
): number {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    // Max possible distance is sqrt(3 * 255^2) approx 441.67
    return Math.sqrt(dr * dr + dg * dg + db * db) / 441.67;
}

/**
 * Applies a morphological erosion (choke) to the alpha channel using a separable box filter.
 * This changes complexity from O(N*R^2) to O(N*R), significantly faster.
 */
function applyChoke(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
) {
    if (radius <= 0) return;

    const r = Math.ceil(radius);
    const size = width * height;
    const tempAlpha = new Uint8Array(size);
    const originalAlpha = new Uint8Array(size);

    // Copy alpha channel
    for (let i = 0; i < size; i++) {
        originalAlpha[i] = data[i * 4 + 3];
    }

    // Pass 1: Horizontal Min
    for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
            let minVal = 255;
            const start = Math.max(0, x - r);
            const end = Math.min(width - 1, x + r);

            for (let k = start; k <= end; k++) {
                const val = originalAlpha[rowOffset + k];
                if (val < minVal) minVal = val;
                if (minVal === 0) break; // Optimization
            }
            tempAlpha[rowOffset + x] = minVal;
        }
    }

    // Pass 2: Vertical Min (write back to data)
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let minVal = 255;
            const start = Math.max(0, y - r);
            const end = Math.min(height - 1, y + r);

            for (let k = start; k <= end; k++) {
                const val = tempAlpha[k * width + x];
                if (val < minVal) minVal = val;
                if (minVal === 0) break;
            }

            const idx = (y * width + x) * 4;
            // Only update if we are reducing alpha (erosion)
            if (data[idx + 3] > minVal) {
                data[idx + 3] = minVal;
            }
        }
    }
}

/**
 * Processes the image data to remove background based on multiple color layers.
 */
export function processMagicEraser(
    imageData: ImageData,
    params: ProcessingParams
): ImageData {
    // Return early only if NO layers active AND NO choke effect
    const activeLayers = params.layers.filter(l => l.isActive && l.color);
    if (activeLayers.length === 0 && params.choke === 0) return imageData;

    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    if (activeLayers.length > 0) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            let a = data[i + 3]; // Start with current alpha

            if (a === 0) continue; // Already fully transparent

            // Check against each layer
            for (const layer of activeLayers) {
                if (!layer.color) continue;

                const { r: tr, g: tg, b: tb } = layer.color;
                const tolerance = layer.tolerance / 100;

                const dist = colorDistance(r, g, b, tr, tg, tb);
                const targetAlpha = Math.round(255 * (1 - (layer.transparency / 100)));

                if (dist <= tolerance) {
                    // Inside tolerance: Reduce alpha to targetAlpha
                    // We take the minimum alpha (most transparent result) across all layers
                    if (targetAlpha < a) a = targetAlpha;
                } else if (layer.feather > 0 && dist <= tolerance + (layer.feather / 100)) {
                    // Feathering zone
                    const featherDist = (dist - tolerance) / (layer.feather / 100);
                    // Linear interpolation between targetAlpha and original
                    // BUT for multiple layers, we want to know what 'original' means. 
                    // Should we chain them? "a" is current pixel alpha.
                    // Let's calculate the alpha *this layer* would produce, and take the min.

                    // The alpha if this layer was the only one:
                    // At featherDist=0 (tolerance edge), alpha should be targetAlpha.
                    // At featherDist=1 (outer edge), alpha should be 255 (or original).
                    // Actually, we should interpolate between targetAlpha and *255* (fully opaque assumption for feathering relative to THIS layer).
                    // If the pixel was already semi-transparent, we shouldn't make it more opaque.

                    const layerResultAlpha = targetAlpha + (255 - targetAlpha) * featherDist;

                    if (layerResultAlpha < a) a = Math.floor(layerResultAlpha);
                }

                // Optimization: if we hit 0, we can stop for this pixel
                if (a === 0) break;
            }

            data[i + 3] = a;
        }
    }

    // Apply Choke (Erosion) if needed
    if (params.choke > 0) {
        applyChoke(data, width, height, params.choke);
    }

    return imageData;
}


/**
 * Helper to get pixel color from event coordinates on a canvas
 */
export function getPixelColor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
): { r: number, g: number, b: number } {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
}
