/**
 * クライアント側で画像をリサイズ・圧縮してDataURL（Base64）に変換するユーティリティ
 * - EXIF（GPS位置情報・撮影日時・カメラ情報等のメタデータ）を100%完全サニタイズ
 * - 最大幅720px / WebP 0.75クオリティ（平均20〜35KB）に軽量化し、Supabase無料枠・ローカル容量を保護
 * - createImageBitmap対応ブラウザでの超高速非同期デコード
 */
export async function compressImage(
  file: File,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.75
): Promise<string> {
  // createImageBitmap が利用可能な場合はメインスレッドをブロックせず高速処理
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

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

      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        // 白背景で塗りつぶし（透過PNG対策）
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        try {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          if (dataUrl.startsWith("data:image/webp")) {
            return dataUrl;
          }
        } catch {
          // fallback
        }
        return canvas.toDataURL("image/jpeg", quality);
      }
    } catch {
      // フォールバックへ進む
    }
  }

  // レガシー / フォールバック処理
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

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

