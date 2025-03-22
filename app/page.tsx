import Calendar from "@/components/calendar"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 transition-colors duration-200">
      <div className="w-full max-w-full sm:max-w-2xl">
        <Calendar />
      </div>
    </main>
  )
}

