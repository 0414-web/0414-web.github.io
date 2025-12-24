export type SlotTime = 'Morning' | 'Lunch' | 'Dinner';
export type Gender = 'Male' | 'Female';

export interface User {
  name: string;
  gender: Gender;
}

export const SLOTS: { key: SlotTime; label: string; time: string }[] = [
  { key: 'Morning', label: '아침', time: '07:00' },
  { key: 'Lunch', label: '점심', time: '12:00' },
  { key: 'Dinner', label: '저녁', time: '19:00' },
];

export interface Reservation {
  id: string;
  name: string;
  gender: Gender;
  slot: SlotTime;
  dateStr: string; // Format YYYY-MM-DD
  createdAt: number;
}

export type ReservationMap = Record<string, Reservation[]>; // Key is YYYY-MM-DD
