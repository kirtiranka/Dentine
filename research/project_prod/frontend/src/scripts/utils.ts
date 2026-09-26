

/**
 * Returns the nearest non-Sunday date (in YYYY-MM-DD format).
 * If the date is Sunday, it shifts forward to the upcoming Monday.
 */
export const getNearestNonSundayDate = (baseDate: Date = new Date()): string => {
  const date = new Date(baseDate);

  // 0 = Sunday
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1); // Advance to Monday
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  console.log('Called getNearestNonSunday', `${year}-${month}-${day}`)

  return `${year}-${month}-${day}`;
};