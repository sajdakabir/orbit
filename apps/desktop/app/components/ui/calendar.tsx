'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from 'react-day-picker'

import { cn } from '../../../lib/utils'
import { Button, buttonVariants } from './button'

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  datesWithContent?: Date[]
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  buttonVariant = 'ghost',
  datesWithContent = [],
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  const currentYear = new Date().getFullYear()
  const fromYear = currentYear - 5
  const toYear = currentYear + 6

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:2.25rem]',
        className,
      )}
      captionLayout={captionLayout}
      startMonth={new Date(fromYear, 0)}
      endMonth={new Date(toYear, 11)}
      formatters={{
        formatMonthDropdown: date =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months,
        ),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[--cell-size] w-[--cell-size] cursor-pointer select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[--cell-size] w-[--cell-size] cursor-pointer select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-9 w-full items-center justify-center px-9',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'flex h-9 w-full items-center justify-center gap-2 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute inset-0 cursor-pointer opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex items-center gap-1 text-sm [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        month_grid: 'w-full border-collapse',
        weekdays: cn('flex w-full', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 select-none text-center text-[0.8rem] font-normal',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn(
          'group/day relative h-[--cell-size] w-[--cell-size] cursor-pointer select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day,
        ),
        range_start: cn(
          'bg-accent rounded-l-md',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...rootProps}
            />
          )
        },
        Chevron: ({
          className: chevronClassName,
          orientation,
          ...chevronProps
        }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon
                className={cn('size-4', chevronClassName)}
                {...chevronProps}
              />
            )
          }
          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', chevronClassName)}
                {...chevronProps}
              />
            )
          }
          return (
            <ChevronDownIcon
              className={cn('size-4', chevronClassName)}
              {...chevronProps}
            />
          )
        },
        DayButton: dayButtonProps => (
          <CalendarDayButton
            datesWithContent={datesWithContent}
            {...dayButtonProps}
          />
        ),
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

function CalendarDayButton({
  className,
  day,
  modifiers,
  datesWithContent = [],
  ...props
}: React.ComponentProps<typeof DayButton> & {
  datesWithContent?: Date[]
}) {
  const defaultClassNames = getDefaultClassNames()
  const hasContent = datesWithContent.some(d => isSameDay(d, day.date))

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
        'data-[range-middle=true]:bg-accent data-[range-middle=true]:text-foreground',
        'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground',
        'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground',
        'group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50',
        'relative flex h-[--cell-size] w-[--cell-size] cursor-pointer items-center justify-center border-0 p-0 text-sm leading-none font-normal',
        'data-[range-end=true]:rounded-r-md data-[range-start=true]:rounded-l-md',
        'hover:bg-accent hover:text-accent-foreground',
        'group-data-[today=true]/day:bg-accent group-data-[today=true]/day:text-accent-foreground',
        'group-data-[today=true]/day:data-[selected-single=true]:bg-primary group-data-[today=true]/day:data-[selected-single=true]:text-primary-foreground',
        defaultClassNames.day,
        className,
      )}
      {...props}
    >
      {day.date.getDate()}
      {hasContent && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
      )}
    </Button>
  )
}

export { Calendar, CalendarDayButton }
