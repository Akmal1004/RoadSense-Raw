export function getDepartureAndArrivalTimes(etaMinutes: number): {
  departureTime: string;
  arrivalTime: string;
  durationText: string;
} {
  const now = new Date();
  const arrival = new Date(now.getTime() + etaMinutes * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  return {
    departureTime: formatTime(now),
    arrivalTime: formatTime(arrival),
    durationText: `${etaMinutes} mins`
  };
}

export function formatArrivalTime(etaMinutes: number): string {
  const now = new Date();
  const arrival = new Date(now.getTime() + etaMinutes * 60 * 1000);
  return arrival.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}
