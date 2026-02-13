
import { Location } from './types';

export const CAMPUS_LOCATIONS: Location[] = [
  { id: '1', name: 'Main Library', coords: { x: 20, y: 30 }, isPopular: true, trafficLevel: 'high' },
  { id: '2', name: 'Boys Hostel A', coords: { x: 80, y: 15 }, isPopular: true, trafficLevel: 'medium' },
  { id: '3', name: 'Girls Hostel B', coords: { x: 75, y: 70 }, isPopular: true, trafficLevel: 'medium' },
  { id: '4', name: 'Academic Block 1', coords: { x: 40, y: 50 }, isPopular: false, trafficLevel: 'high' },
  { id: '5', name: 'Canteen / Food Court', coords: { x: 55, y: 40 }, isPopular: true, trafficLevel: 'high' },
  { id: '6', name: 'Sports Complex', coords: { x: 15, y: 80 }, isPopular: false, trafficLevel: 'low' },
  { id: '7', name: 'Auditorium', coords: { x: 45, y: 20 }, isPopular: false, trafficLevel: 'medium' },
  { id: '8', name: 'Main Gate', coords: { x: 10, y: 10 }, isPopular: false, trafficLevel: 'medium' },
];

export const MOCK_RIDER = {
  name: 'Arjun Sharma',
  bike: 'Activa 6G',
  plate: 'DL 3S AB 1234',
  rating: 4.8
};

export const BASE_PRICE = 10;
export const PRICE_PER_DISTANCE = 0.5;
