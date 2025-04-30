import type { Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string; // Firestore document ID
  name: string;
  status: 'in' | 'out';
  lastCheckIn: Timestamp | null;
  lastCheckOut: Timestamp | null;
}
