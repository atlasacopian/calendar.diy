export type Holiday = {
  date: Date
  name: string
}

export function getAllHolidays(year: number): Holiday[] {
  // This is a placeholder implementation.
  // In a real application, you would fetch holidays from an API or a database.
  // For simplicity, we'll return a few hardcoded holidays.
  if (year === new Date().getFullYear()) {
    return [
      { date: new Date(year, 0, 1), name: "New Year's Day" },
      { date: new Date(year, 11, 25), name: "Christmas Day" },
    ]
  } else if (year === new Date().getFullYear() + 1) {
    return [
      { date: new Date(year, 0, 1), name: "New Year's Day" },
      { date: new Date(year, 11, 25), name: "Christmas Day" },
    ]
  }
  return []
}

