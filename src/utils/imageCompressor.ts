/**
 * クライアント側で画像をリサイズ・圧縮してDataURL（Base64）に変換するユーティリティ
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // アスペクト比を維持しながら最大サイズに収める
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // WebPが利用できればWebP、そうでなければJPEGで出力
        try {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          if (dataUrl.startsWith("data:image/webp")) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback
        }

        const jpegUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(jpegUrl);
      };

      if (typeof reader.result === "string") {
        img.src = reader.result;
      } else {
        reject(new Error("Failed to read image as DataURL"));
      }
    };

    reader.readAsDataURL(file);
  });
}
