import { Button } from "@/components/ui/button"

export function MobileHeader() {
  return (
    <div className="flex justify-between w-full overflow-x-auto no-scrollbar">
      <div className="flex space-x-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          SIGN IN
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          RESET
        </Button>
      </div>
      <div className="flex space-x-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          SCREENSHOT
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          ICAL
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          GOOGLE
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          SHARE
        </Button>
      </div>
    </div>
  )
}

