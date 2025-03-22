import Calendar from "@/components/calendar"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-8 md:p-12 lg:p-16 xl:p-24">
      <div className="w-full max-w-3xl">
        <h1 className="mb-12 text-center font-mono text-4xl font-extralight tracking-tighter text-black">
          PROJECT CALENDAR
        </h1>
        <Calendar />
      </div>
    </main>
  )
}

