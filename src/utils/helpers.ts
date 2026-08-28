export function photoUrl(seed: string, w: number, h: number): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 1000;
  return `https://picsum.photos/seed/${n}/${w}/${h}`;
}

export function getMondayOfCurrentWeek(date: Date = new Date()): Date {
  const temp = new Date(date);
  const day = temp.getDay();
  const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(temp.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekKey(weekStart: Date): string {
  const y = weekStart.getFullYear();
  const m = String(weekStart.getMonth() + 1).padStart(2, "0");
  const d = String(weekStart.getDate()).padStart(2, "0");
  return `${y}_${m}_${d}`;
}
