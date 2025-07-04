"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  const [month, setMonth] = React.useState<Date>(props.defaultMonth || new Date());
  const [monthPopoverOpen, setMonthPopoverOpen] = React.useState(false); 
  const [yearPopoverOpen, setYearPopoverOpen] = React.useState(false);

  const today = new Date()
  const currentYear = today.getFullYear()

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const years = Array.from({ length: 101 }, (_, i) => currentYear - 100 + i);

  // month selection
  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(month);
    newDate.setMonth(monthIndex);
    setMonth(newDate);
    setMonthPopoverOpen(false); 
  };

  const toggleMonthPopover = () => {
    setMonthPopoverOpen(!monthPopoverOpen);
  };

  // year selection
  const handleYearSelect = (year: number) => {
    const newDate = new Date(month);
    newDate.setFullYear(year);
    setMonth(newDate);
    setYearPopoverOpen(false); 
  };

  const toggleYearPopover = () => {
    setYearPopoverOpen(!yearPopoverOpen);
  };

  // previous month
  const handlePrevMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() - 1)
    setMonth(newDate)
  }

  // next month
  const handleNextMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + 1)
    setMonth(newDate)
  }

  return (
    <div className="space-y-4 pt-3">
      <div className="flex justify-center items-center gap-2 px-2 pb-1">
      <Popover open={monthPopoverOpen} onOpenChange={setMonthPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={toggleMonthPopover} 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
            >
              {months[month.getMonth()]}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0">
            <div className="grid grid-cols-3 gap-1 p-1">
              {months.map((m, i) => (
                <button
                  key={m}
                  onClick={() => handleMonthSelect(i)}
                  className={cn(
                    "text-center text-sm rounded-md p-2 hover:bg-accent",
                    month.getMonth() === i &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={yearPopoverOpen} onOpenChange={setYearPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={toggleYearPopover} 
              className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3")}
            >
              {month.getFullYear()}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0">
            <div className="max-h-60 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1 p-1">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      "text-center text-sm rounded-md p-2 hover:bg-accent",
                      month.getFullYear() === y &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={handlePrevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-2",
          month: "flex flex-col gap-4",
          caption: "hidden", 
          nav: "hidden",
          table: "w-full border-collapse space-x-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: cn(
            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
            props.mode === "range"
              ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              : "[&:has([aria-selected])]:rounded-md",
          ),
          day: cn(buttonVariants({ variant: "ghost" }), "size-8 p-0 font-normal aria-selected:opacity-100"),
          day_range_start: "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_range_end: "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        month={month}
        onMonthChange={setMonth}
        locale={id}
        {...props}
      />
    </div>
  )
}

export { Calendar }

