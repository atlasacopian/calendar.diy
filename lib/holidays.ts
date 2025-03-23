export type Holiday = {
  date: Date
  name: string
}

export const getAllHolidays = (year: number): Holiday[] => {
  // Replace with actual holiday data fetching logic if needed
  if (year === 2023) {
    return [
      { date: new Date(2023, 0, 1), name: "New Year's Day" },
      { date: new Date(2023, 0, 16), name: "Martin Luther King Jr. Day" },
      { date: new Date(2023, 1, 20), name: "Presidents' Day" },
      { date: new Date(2023, 4, 29), name: "Memorial Day" },
      { date: new Date(2023, 5, 19), name: "Juneteenth" },
      { date: new Date(2023, 6, 4), name: "Independence Day" },
      { date: new Date(2023, 8, 4), name: "Labor Day" },
      { date: new Date(2023, 9, 9), name: "Columbus Day" },
      { date: new Date(2023, 10, 11), name: "Veterans Day" },
      { date: new Date(2023, 10, 23), name: "Thanksgiving Day" },
      { date: new Date(2023, 11, 25), name: "Christmas Day" },
    ]
  } else if (year === 2024) {
    return [
      { date: new Date(2024, 0, 1), name: "New Year's Day" },
      { date: new Date(2024, 0, 15), name: "Martin Luther King Jr. Day" },
      { date: new Date(2024, 1, 19), name: "Presidents' Day" },
      { date: new Date(2024, 4, 27), name: "Memorial Day" },
      { date: new Date(2024, 5, 19), name: "Juneteenth" },
      { date: new Date(2024, 6, 4), name: "Independence Day" },
      { date: new Date(2024, 8, 2), name: "Labor Day" },
      { date: new Date(2024, 9, 14), name: "Columbus Day" },
      { date: new Date(2024, 10, 11), name: "Veterans Day" },
      { date: new Date(2024, 10, 28), name: "Thanksgiving Day" },
      { date: new Date(2024, 11, 25), name: "Christmas Day" },
    ]
  } else if (year === 2025) {
    return [
      { date: new Date(2025, 0, 1), name: "New Year's Day" },
      { date: new Date(2025, 0, 20), name: "Martin Luther King Jr. Day" },
      { date: new Date(2025, 1, 17), name: "Presidents' Day" },
      { date: new Date(2025, 2, 21), name: "Day of the Sun" },
      { date: new Date(2025, 4, 26), name: "Memorial Day" },
      { date: new Date(2025, 5, 19), name: "Juneteenth" },
      { date: new Date(2025, 6, 4), name: "Independence Day" },
      { date: new Date(2025, 8, 1), name: "Labor Day" },
      { date: new Date(2025, 9, 13), name: "Columbus Day" },
      { date: new Date(2025, 10, 11), name: "Veterans Day" },
      { date: new Date(2025, 10, 27), name: "Thanksgiving Day" },
      { date: new Date(2025, 11, 25), name: "Christmas Day" },
    ]
  } else {
    return []
  }
}

