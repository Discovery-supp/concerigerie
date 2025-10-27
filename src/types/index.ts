// Types pour l'application Nzoo Immo
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'owner' | 'traveler' | 'partner' | 'provider' | 'admin';
  profileImage?: string;
  createdAt: Date;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: string;
  address: string;
  surface: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  pricePerNight: number;
  cleaningFee: number;
  minNights: number;
  maxNights: number;
  amenities: string[];
  images: string[];
  availability: { [key: string]: boolean };
  rules: string[];
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Reservation {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  additionalServices: string[];
  createdAt: Date;
}

export interface ServiceProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  experience: string;
  services: string[];
  availability: { [key: string]: { start: string; end: string } };
  hourlyRate: number;
  interventionZones: string[];
  documents: string[];
  isVerified: boolean;
  rating: number;
  completedJobs: number;
}

export interface ServicePackage {
  name: string;
  type: 'essential' | 'complete' | 'premium';
  commission: string;
  services: {
    [key: string]: 'included' | 'additional' | 'not-included';
  };
}

export interface Review {
  id: string;
  reservationId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface FormStep {
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}