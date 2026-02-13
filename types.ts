
export enum UserRole {
  PASSENGER = 'PASSENGER',
  RIDER = 'RIDER'
}

export enum RideStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Location {
  id: string;
  name: string;
  coords: { x: number; y: number };
  isPopular?: boolean;
  trafficLevel?: 'low' | 'medium' | 'high';
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderRole: UserRole;
  timestamp: number;
}

export interface RideDetails {
  id: string;
  passengerId: string;
  riderId?: string;
  from: Location;
  to: Location;
  price: number;
  status: RideStatus;
  riderName?: string;
  bikeModel?: string;
  plateNumber?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  college: string;
  role: UserRole;
  balance: number;
  rating: number;
  hasCompletedOnboarding?: boolean;
  avatarUrl?: string;
}
