export interface CalendarEventInput {
  title: string
  description?: string
  location?: string
  startDateTime?: string
  endDateTime?: string
  startDate?: string
  endDate?: string
  allDay?: boolean
  color?: string
  repeatWeekly?: boolean
  repeatWeeks?: number
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  description?: string
  location?: string
  start: string
  end: string
  allDay: boolean
  color?: string
  createdAt: string
  updatedAt: string
}

export const NATIVE_COLORS: Record<string, string> = {
  'tomato': '#D50000',
  'flamingo': '#E67C73',
  'tangerine': '#F4511E',
  'banana': '#F6BF26',
  'sage': '#33B679',
  'basil': '#0B8043',
  'peacock': '#039BE5',
  'blueberry': '#3F51B5',
  'lavender': '#7986CB',
  'grape': '#8E24AA',
  'graphite': '#616161',
}
