export function generateTimeSlots(): { label: string; value: string }[] {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min of [0, 30]) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      slots.push({
        label: timeStr,
        value: timeStr,
      })
    }
  }
  return slots
}

export const TIME_SLOTS = generateTimeSlots()
