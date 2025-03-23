export type Holiday = {
  date: Date
  name: string
}

export const getAllHolidays = (year: number): Holiday[] => {
  // Replace with actual holiday data fetching logic if needed
  if (year === 2023) {
    return [
      { date: new Date(2023, 0, 1), name: "New Year's Day" },
      { date: new Date(2023, 11, 25), name: "Christmas Day" },
    ]
  } else if (year === 2024) {
    return [
      { date: new Date(2024, 0, 1), name: "New Year's Day" },
      { date: new Date(2024, 4, 27), name: "Memorial Day" },
      { date: new Date(2024, 6, 4), name: "Independence Day" },
      { date: new Date(2024, 11, 25), name: "Christmas Day" },
    ]
  } else if (year === 2025) {
    return [
      { date: new Date(2025, 0, 1), name: "New Year's Day" },
      { date: new Date(2025, 4, 26), name: "Memorial Day" },
      { date: new Date(2025, 2, 21), name: "Day of the Sun" },
      { date: new Date(2025, 6, 4), name: "Independence Day" },
      { date: new Date(2025, 11, 25), name: "Christmas Day" },
    ]
  } else {
    return []
  }
}

