import { WeekMeals, UserProfile, ShareRatio, ShareTheme } from "../types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  borderColor: string
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let renderW, renderH, renderX, renderY;

  if (imgRatio < canvasRatio) {
    renderW = w;
    renderH = w / imgRatio;
    renderX = x;
    renderY = y + (h - renderH) / 2;
  } else {
    renderH = h;
    renderW = h * imgRatio;
    renderY = y;
    renderX = x + (w - renderW) / 2;
  }
  ctx.drawImage(img, renderX, renderY, renderW, renderH);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.restore();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  avatarImg: HTMLImageElement | null,
  name: string,
  x: number,
  y: number,
  size: number,
  accentColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (avatarImg) {
    const imgRatio = avatarImg.width / avatarImg.height;
    let renderW, renderH, renderX, renderY;
    if (imgRatio < 1) {
      renderW = size;
      renderH = size / imgRatio;
      renderX = x;
      renderY = y + (size - renderH) / 2;
    } else {
      renderH = size;
      renderW = size * imgRatio;
      renderY = y;
      renderX = x + (size - renderW) / 2;
    }
    ctx.drawImage(avatarImg, renderX, renderY, renderW, renderH);
  } else {
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold " + Math.floor(size * 0.44) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = (name || "U").slice(0, 1).toUpperCase();
    ctx.fillText(initial, x + size / 2, y + size / 2);
  }

  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawSkippedPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  isDark: boolean
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  ctx.fillStyle = isDark ? "#2A2A2A" : "#F3EFEA";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = isDark ? "#3A3A3A" : "#E2DCD5";
  ctx.lineWidth = 2.5;
  for (let i = -w - h; i < w + h; i += 16) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.stroke();
  }

  const text = "おやすみ";
  ctx.fillStyle = isDark ? "#777777" : "#9C968E";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2);

  ctx.restore();
}

function drawEmptySlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  isDark: boolean
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  
  ctx.strokeStyle = isDark ? "#444444" : "#D3CBC1";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = isDark ? "#555555" : "#C0B7AC";
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", x + w / 2, y + h / 2);

  ctx.restore();
}

export async function generateShareImage(
  meals: WeekMeals,
  weekLabel: string,
  stats: { photoCount: number; skipCount: number; totalSlots: number },
  datesList: string[],
  profile?: UserProfile,
  comment?: string,
  ratio: ShareRatio = "4:5",
  theme: ShareTheme = "ecru"
): Promise<Blob> {
  const WIDTH = 1080;
  const HEIGHT = ratio === "9:16" ? 1920 : ratio === "1:1" ? 1080 : 1350;

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#1A1A1A" : theme === "sage" ? "#F2F7F4" : "#FAF8F5",
    cardBg: isDark ? "#262626" : "#FFFFFF",
    cardBorder: isDark ? "#383838" : "#EDE6DE",
    textMain: isDark ? "#F0F0F0" : "#2C2C2C",
    textSub: isDark ? "#9E9E9E" : "#7C7A77",
    accent: isDark ? "#7EB69B" : "#6B8A7A",
    accentFaint: isDark ? "#2F3B35" : "#EAF2ED",
    watermark: isDark ? "#555555" : "#A8A095",
  };

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  let avatarImg: HTMLImageElement | null = null;
  if (profile?.avatar) {
    try {
      avatarImg = await loadImage(profile.avatar);
    } catch {
      avatarImg = null;
    }
  }

  // 1. Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, WIDTH, 8);

  // 2. Header Branding
  const userName = profile?.name?.trim() || "USER";
  const userHandle = profile?.handle?.trim();

  ctx.fillStyle = colors.textMain;
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("mog", 70, 34);

  ctx.fillStyle = colors.textSub;
  ctx.font = "14px sans-serif";
  ctx.fillText("たべる、のこす、いきる。", 140, 44);

  ctx.textAlign = "right";
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = colors.accent;
  ctx.fillText(weekLabel, WIDTH - 70, 42);

  // 3. User Profile Card & Comment Section
  const profileCardY = 82;
  const profileCardH = ratio === "1:1" ? 95 : 115;
  const profileCardW = WIDTH - 140;

  ctx.save();
  drawRoundedRect(ctx, 70, profileCardY, profileCardW, profileCardH, 14);
  ctx.fillStyle = colors.cardBg;
  ctx.fill();
  ctx.strokeStyle = colors.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const avatarSize = ratio === "1:1" ? 54 : 64;
  drawAvatar(ctx, avatarImg, userName, 90, profileCardY + (profileCardH - avatarSize) / 2, avatarSize, colors.accent);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = colors.textMain;
  ctx.font = "bold 21px sans-serif";
  ctx.fillText(userName, 168, profileCardY + 20);

  if (userHandle) {
    ctx.fillStyle = colors.textSub;
    ctx.font = "14px sans-serif";
    ctx.fillText(userHandle.startsWith("@") ? userHandle : "@" + userHandle, 168 + ctx.measureText(userName).width + 10, profileCardY + 25);
  }

  const displayComment = comment?.trim() || "今週も自分らしく、もぐもぐ記録 🍵";
  ctx.fillStyle = isDark ? "#D0D0D0" : "#55524E";
  ctx.font = "15px sans-serif";
  ctx.fillText("💬 " + displayComment, 168, profileCardY + (ratio === "1:1" ? 54 : 60));

  // 4. Meal Grid
  const DAYS = ["月", "火", "水", "木", "金", "土", "日"];
  const COL_LABELS = ["朝", "昼", "夜"];
  
  const X_START = 70;
  const Y_START = ratio === "9:16" ? 340 : ratio === "1:1" ? 220 : 255;
  const DAY_COL_WIDTH = 55;
  const COL_GAP = 18;
  const ROW_GAP = ratio === "9:16" ? 28 : ratio === "1:1" ? 10 : 16;
  const CELL_WIDTH = 270;
  const CELL_HEIGHT = ratio === "9:16" ? 140 : ratio === "1:1" ? 82 : 110;
  const RADIUS = 10;

  ctx.fillStyle = colors.textSub;
  ctx.font = "bold 19px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  
  for (let c = 0; c < 3; c++) {
    const cx = X_START + DAY_COL_WIDTH + 15 + c * (CELL_WIDTH + COL_GAP) + CELL_WIDTH / 2;
    ctx.fillText(COL_LABELS[c], cx, Y_START - 14);
  }

  for (let r = 0; r < 7; r++) {
    const rowY = Y_START + r * (CELL_HEIGHT + ROW_GAP);
    const day = DAYS[r];
    ctx.font = "bold 21px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    if (day === "土") ctx.fillStyle = "#7AA0C4";
    else if (day === "日") ctx.fillStyle = "#C48A7A";
    else ctx.fillStyle = colors.textMain;

    ctx.fillText(day, X_START + DAY_COL_WIDTH, rowY + CELL_HEIGHT / 2);

    for (let c = 0; c < 3; c++) {
      const colX = X_START + DAY_COL_WIDTH + 15 + c * (CELL_WIDTH + COL_GAP);
      const meal = meals[r]?.[c];

      if (meal && "skipped" in meal && meal.skipped) {
        drawSkippedPattern(ctx, colX, rowY, CELL_WIDTH, CELL_HEIGHT, RADIUS, isDark);
      } else if (meal && "image" in meal && meal.image) {
        try {
          const img = await loadImage(meal.image);
          drawImageCover(ctx, img, colX, rowY, CELL_WIDTH, CELL_HEIGHT, RADIUS, colors.cardBorder);
        } catch (_e) {
          drawEmptySlot(ctx, colX, rowY, CELL_WIDTH, CELL_HEIGHT, RADIUS, isDark);
        }
      } else if (meal && "quickEmoji" in meal && meal.quickEmoji) {
        ctx.save();
        drawRoundedRect(ctx, colX, rowY, CELL_WIDTH, CELL_HEIGHT, RADIUS);
        ctx.fillStyle = isDark ? "#262626" : "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = colors.cardBorder;
        ctx.stroke();
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(meal.quickEmoji, colX + CELL_WIDTH / 2, rowY + CELL_HEIGHT / 2);
        ctx.restore();
      } else {
        drawEmptySlot(ctx, colX, rowY, CELL_WIDTH, CELL_HEIGHT, RADIUS, isDark);
      }
    }
  }

  // 5. Tags Breakdown & Stats
  let cookCount = 0;
  let convCount = 0;
  let outCount = 0;
  meals.forEach((d) =>
    d.forEach((m) => {
      if (m && "tags" in m && m.tags) {
        if (m.tags.includes("自炊")) cookCount++;
        if (m.tags.includes("コンビニ")) convCount++;
        if (m.tags.includes("外食")) outCount++;
      }
    })
  );

  const statsParts = [
    `📸 記録 ${stats.photoCount}/${stats.totalSlots}`,
    stats.skipCount > 0 ? `🌙 おやすみ ${stats.skipCount}食` : "",
    cookCount > 0 ? `🍳 自炊 ${cookCount}食` : "",
    outCount > 0 ? `🍽️ 外食 ${outCount}食` : "",
    convCount > 0 ? `🏪 コンビニ ${convCount}食` : "",
  ].filter(Boolean);

  const statsY = HEIGHT - (ratio === "9:16" ? 140 : 90);
  ctx.fillStyle = colors.textMain;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    statsParts.join("   "),
    WIDTH / 2,
    statsY
  );

  // 6. Watermark
  ctx.fillStyle = colors.watermark;
  ctx.font = "15px sans-serif";
  ctx.fillText("mog-app.vercel.app", WIDTH / 2, HEIGHT - (ratio === "9:16" ? 60 : 40));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}


