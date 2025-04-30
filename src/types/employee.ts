
// No need to import Timestamp for file storage
// import type { Timestamp } from 'firebase/firestore'; // This was for Firestore

export interface Employee {
  id: string; // Unique ID (e.g., UUID)
  name: string;
  department: string;
  status: 'in' | 'out';
  lastCheckIn: string | null; // ISO 8601 date string
  lastCheckOut: string | null; // ISO 8601 date string
}
