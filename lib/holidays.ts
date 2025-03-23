export type Holiday = {
  date: Date
  name: string
}

export const getAllHolidays = (year: number): Holiday[] => {
  switch (year) {
    case 2020:
      return [
        { date: new Date(2020, 0, 1), name: "New Year's Day" },
        { date: new Date(2020, 0, 20), name: "Martin Luther King Jr. Day" },
        { date: new Date(2020, 1, 17), name: "Presidents' Day" },
        { date: new Date(2020, 4, 25), name: "Memorial Day" },
        { date: new Date(2020, 6, 4), name: "Independence Day" },
        { date: new Date(2020, 8, 7), name: "Labor Day" },
        { date: new Date(2020, 9, 12), name: "Columbus Day" },
        { date: new Date(2020, 10, 11), name: "Veterans Day" },
        { date: new Date(2020, 10, 26), name: "Thanksgiving Day" },
        { date: new Date(2020, 11, 25), name: "Christmas Day" },
      ]
    case 2021:
      return [
        { date: new Date(2021, 0, 1), name: "New Year's Day" },
        { date: new Date(2021, 0, 18), name: "Martin Luther King Jr. Day" },
        { date: new Date(2021, 1, 15), name: "Presidents' Day" },
        { date: new Date(2021, 4, 31), name: "Memorial Day" },
        { date: new Date(2021, 5, 19), name: "Juneteenth" }, // First year as federal holiday
        { date: new Date(2021, 6, 4), name: "Independence Day" },
        { date: new Date(2021, 8, 6), name: "Labor Day" },
        { date: new Date(2021, 9, 11), name: "Columbus Day" },
        { date: new Date(2021, 10, 11), name: "Veterans Day" },
        { date: new Date(2021, 10, 25), name: "Thanksgiving Day" },
        { date: new Date(2021, 11, 25), name: "Christmas Day" },
      ]
    case 2022:
      return [
        { date: new Date(2022, 0, 1), name: "New Year's Day" },
        { date: new Date(2022, 0, 17), name: "Martin Luther King Jr. Day" },
        { date: new Date(2022, 1, 21), name: "Presidents' Day" },
        { date: new Date(2022, 4, 30), name: "Memorial Day" },
        { date: new Date(2022, 5, 19), name: "Juneteenth" },
        { date: new Date(2022, 6, 4), name: "Independence Day" },
        { date: new Date(2022, 8, 5), name: "Labor Day" },
        { date: new Date(2022, 9, 10), name: "Columbus Day" },
        { date: new Date(2022, 10, 11), name: "Veterans Day" },
        { date: new Date(2022, 10, 24), name: "Thanksgiving Day" },
        { date: new Date(2022, 11, 25), name: "Christmas Day" },
      ]
    case 2023:
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
    case 2024:
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
    case 2025:
      return [
        { date: new Date(2025, 0, 1), name: "New Year's Day" },
        { date: new Date(2025, 0, 20), name: "Martin Luther King Jr. Day" },
        { date: new Date(2025, 1, 17), name: "Presidents' Day" },
        { date: new Date(2025, 2, 21), name: "Day of the Sun" }, // Special holiday kept from original
        { date: new Date(2025, 4, 26), name: "Memorial Day" },
        { date: new Date(2025, 5, 19), name: "Juneteenth" },
        { date: new Date(2025, 6, 4), name: "Independence Day" },
        { date: new Date(2025, 8, 1), name: "Labor Day" },
        { date: new Date(2025, 9, 13), name: "Columbus Day" },
        { date: new Date(2025, 10, 11), name: "Veterans Day" },
        { date: new Date(2025, 10, 27), name: "Thanksgiving Day" },
        { date: new Date(2025, 11, 25), name: "Christmas Day" },
      ]
    case 2026:
      return [
        { date: new Date(2026, 0, 1), name: "New Year's Day" },
        { date: new Date(2026, 0, 19), name: "Martin Luther King Jr. Day" },
        { date: new Date(2026, 1, 16), name: "Presidents' Day" },
        { date: new Date(2026, 4, 25), name: "Memorial Day" },
        { date: new Date(2026, 5, 19), name: "Juneteenth" },
        { date: new Date(2026, 6, 4), name: "Independence Day" },
        { date: new Date(2026, 8, 7), name: "Labor Day" },
        { date: new Date(2026, 9, 12), name: "Columbus Day" },
        { date: new Date(2026, 10, 11), name: "Veterans Day" },
        { date: new Date(2026, 10, 26), name: "Thanksgiving Day" },
        { date: new Date(2026, 11, 25), name: "Christmas Day" },
      ]
    case 2027:
      return [
        { date: new Date(2027, 0, 1), name: "New Year's Day" },
        { date: new Date(2027, 0, 18), name: "Martin Luther King Jr. Day" },
        { date: new Date(2027, 1, 15), name: "Presidents' Day" },
        { date: new Date(2027, 4, 31), name: "Memorial Day" },
        { date: new Date(2027, 5, 19), name: "Juneteenth" },
        { date: new Date(2027, 6, 4), name: "Independence Day" },
        { date: new Date(2027, 8, 6), name: "Labor Day" },
        { date: new Date(2027, 9, 11), name: "Columbus Day" },
        { date: new Date(2027, 10, 11), name: "Veterans Day" },
        { date: new Date(2027, 10, 25), name: "Thanksgiving Day" },
        { date: new Date(2027, 11, 25), name: "Christmas Day" },
      ]
    case 2028:
      return [
        { date: new Date(2028, 0, 1), name: "New Year's Day" },
        { date: new Date(2028, 0, 17), name: "Martin Luther King Jr. Day" },
        { date: new Date(2028, 1, 21), name: "Presidents' Day" },
        { date: new Date(2028, 4, 29), name: "Memorial Day" },
        { date: new Date(2028, 5, 19), name: "Juneteenth" },
        { date: new Date(2028, 6, 4), name: "Independence Day" },
        { date: new Date(2028, 8, 4), name: "Labor Day" },
        { date: new Date(2028, 9, 9), name: "Columbus Day" },
        { date: new Date(2028, 10, 11), name: "Veterans Day" },
        { date: new Date(2028, 10, 23), name: "Thanksgiving Day" },
        { date: new Date(2028, 11, 25), name: "Christmas Day" },
      ]
    case 2029:
      return [
        { date: new Date(2029, 0, 1), name: "New Year's Day" },
        { date: new Date(2029, 0, 15), name: "Martin Luther King Jr. Day" },
        { date: new Date(2029, 1, 19), name: "Presidents' Day" },
        { date: new Date(2029, 4, 28), name: "Memorial Day" },
        { date: new Date(2029, 5, 19), name: "Juneteenth" },
        { date: new Date(2029, 6, 4), name: "Independence Day" },
        { date: new Date(2029, 8, 3), name: "Labor Day" },
        { date: new Date(2029, 9, 8), name: "Columbus Day" },
        { date: new Date(2029, 10, 11), name: "Veterans Day" },
        { date: new Date(2029, 10, 22), name: "Thanksgiving Day" },
        { date: new Date(2029, 11, 25), name: "Christmas Day" },
      ]
    case 2030:
      return [
        { date: new Date(2030, 0, 1), name: "New Year's Day" },
        { date: new Date(2030, 0, 21), name: "Martin Luther King Jr. Day" },
        { date: new Date(2030, 1, 18), name: "Presidents' Day" },
        { date: new Date(2030, 4, 27), name: "Memorial Day" },
        { date: new Date(2030, 5, 19), name: "Juneteenth" },
        { date: new Date(2030, 6, 4), name: "Independence Day" },
        { date: new Date(2030, 8, 2), name: "Labor Day" },
        { date: new Date(2030, 9, 14), name: "Columbus Day" },
        { date: new Date(2030, 10, 11), name: "Veterans Day" },
        { date: new Date(2030, 10, 28), name: "Thanksgiving Day" },
        { date: new Date(2030, 11, 25), name: "Christmas Day" },
      ]
    default:
      // For any other year, return an empty array
      // You could also calculate holidays dynamically here if needed
      return []
  }
}

