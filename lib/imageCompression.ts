/**
 * Image Compression Utility
 * Compresses images client-side before upload to reduce bandwidth and storage
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    maxSizeMB: 2
};

/**
 * Compress an image file
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Calculate new dimensions while maintaining aspect ratio
                    let { width, height } = img;
                    const aspectRatio = width / height;

                    if (width > opts.maxWidth! || height > opts.maxHeight!) {
                        if (width > height) {
                            width = opts.maxWidth!;
                            height = width / aspectRatio;
                        } else {
                            height = opts.maxHeight!;
                            width = height * aspectRatio;
                        }
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d')!;

                    // Use better image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to compress image'));
                                return;
                            }

                            // Check if compressed size is acceptable
                            const sizeMB = blob.size / (1024 * 1024);
                            if (sizeMB > opts.maxSizeMB!) {
                                // Try again with lower quality
                                const lowerQuality = Math.max(0.5, opts.quality! - 0.2);
                                compressImage(file, { ...opts, quality: lowerQuality })
                                    .then(resolve)
                                    .catch(reject);
                                return;
                            }

                            // Create new file from blob
                            const compressedFile = new File(
                                [blob],
                                file.name,
                                {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                }
                            );

                            console.log(`[COMPRESSION] Original: ${(file.size / 1024).toFixed(2)}KB → Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`);
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        opts.quality
                    );
                } catch (err) {
                    reject(err);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns Validation result
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.'
        };
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${maxSizeMB}MB (your file: ${sizeMB.toFixed(2)}MB)`
        };
    }

    return { valid: true };
}
