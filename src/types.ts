export interface Watch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  year: string;
  condition: string;
  box: 'Yes' | 'No' | 'Unsure';
  papers: 'Yes' | 'No' | 'Unsure';
  price: number;
  image: string;
  status: 'Available' | 'Reserved' | 'Sold';
  description: string;
  createdAt: string;
  stripeLink?: string;
}

export interface ValuationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredContact: 'Phone' | 'Email' | 'WhatsApp';
  location: string;
  brand: string;
  model: string;
  reference: string;
  year: string;
  condition: string;
  box: 'Yes' | 'No' | 'Unsure';
  papers: 'Yes' | 'No' | 'Unsure';
  receipt: 'Yes' | 'No' | 'Unsure';
  serviceHistory: string;
  askingPrice: string; // can be numerical or custom like "Please advise"
  additionalDetails: string;
  photos: {
    front?: string;
    back?: string;
    side?: string;
    boxPapers?: string;
    additional?: string;
  };
  status: 'Pending Review' | 'Offered' | 'Approved' | 'Declined';
  adminNotes?: string;
  createdAt: string;
}

export interface SourcingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  model: string;
  reference: string;
  year: string;
  condition: string;
  boxPapers: string;
  budget: string;
  timeframe: string;
  notes: string;
  status: 'Active Sourcing' | 'Watch Found' | 'Completed' | 'Cancelled';
  adminNotes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  watchId: string;
  watchDetails: {
    brand: string;
    model: string;
    price: number;
    reference: string;
  };
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  clientPostcode: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod: string;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
}
