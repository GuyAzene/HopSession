export function combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number)
    const result = new Date(date)
    result.setHours(hours, minutes, 0, 0)
    return result
}