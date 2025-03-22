import Calendar from "@/components/calendar"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">PROJECT CALENDAR</h1>
      <Calendar />
    </main>
  )
}

