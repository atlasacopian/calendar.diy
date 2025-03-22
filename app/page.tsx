import Calendar from "@/components/calendar"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 md:p-8 lg:p-12 xl:p-16">
      <div className="w-full max-w-4xl">
        <h1 className="mb-12 text-center font-mono text-4xl font-extralight tracking-tighter text-black">
          PROJECT CALENDAR
        </h1>
        <Calendar />
      </div>
    </main>
  )
}

