import { useEffect, useState } from 'react'

interface DateIconProps {
  className?: string
}

export function DateIcon({ className = 'w-5 h-5' }: DateIconProps) {
  const [date, setDate] = useState(new Date().getDate())

  useEffect(() => {
    // Update date at midnight
    const updateDate = () => {
      setDate(new Date().getDate())
    }

    // Check every minute if the day has changed
    const interval = setInterval(() => {
      const currentDate = new Date().getDate()
      if (currentDate !== date) {
        updateDate()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [date])

  return (
    <div
      className={`${className} flex items-center justify-center font-bold text-xs`}
    >
      {String(date).padStart(2, '0')}
    </div>
  )
}
