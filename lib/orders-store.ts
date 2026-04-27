import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'upi' | 'card' | 'netbanking';

export interface OrderItem {
  bookId: string;
  sku: string;
  titleEnglish: string;
  titleHindi: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  billingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}

interface OrdersStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
}

const seedOrders: Order[] = [
  {
    id: 'SSP-A7B2C8D4',
    createdAt: '2026-04-20T10:30:00Z',
    customer: { name: 'Ravi Kumar Sharma', email: 'ravi.sharma@gmail.com', phone: '+91 98765 43210' },
    billingAddress: { line1: '42, Shastri Nagar, Near Bus Stand', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208005' },
    items: [
      { bookId: 'i-swar-vadan-1', sku: 'SSP-SV-01', titleEnglish: 'Swar Vadan Part 1', titleHindi: 'स्वर वादन भाग 1', qty: 2, price: 280 },
      { bookId: 'i-swar-vadan-2', sku: 'SSP-SV-02', titleEnglish: 'Swar Vadan Part 2', titleHindi: 'स्वर वादन भाग 2', qty: 1, price: 320 },
    ],
    subtotal: 880,
    status: 'delivered',
    paymentMethod: 'upi',
  },
  {
    id: 'SSP-F3G9H1J5',
    createdAt: '2026-04-21T14:15:00Z',
    customer: { name: 'Priya Agarwal', email: 'priya.agarwal@yahoo.com', phone: '+91 91234 56789' },
    billingAddress: { line1: '7, Civil Lines, Opp. GPO', city: 'Allahabad', state: 'Uttar Pradesh', pincode: '211001' },
    items: [
      { bookId: 'v-bhatkhande-1', sku: 'SSP-BK-01', titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 1', titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग 1', qty: 1, price: 350 },
    ],
    subtotal: 350,
    status: 'shipped',
    paymentMethod: 'card',
  },
  {
    id: 'SSP-K2L8M4N6',
    createdAt: '2026-04-22T09:45:00Z',
    customer: { name: 'Anand Mishra', email: 'anand.mishra@rediffmail.com', phone: '+91 70000 11223' },
    billingAddress: { line1: '15, Tilak Nagar, Sector 4', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
    items: [
      { bookId: 'r-raag-shastra-1', sku: 'SSP-RS-01', titleEnglish: 'Raag Shastra Parichay Part 1', titleHindi: 'राग शास्त्र परिचय भाग 1', qty: 3, price: 295 },
      { bookId: 'r-raag-shastra-2', sku: 'SSP-RS-02', titleEnglish: 'Raag Shastra Parichay Part 2', titleHindi: 'राग शास्त्र परिचय भाग 2', qty: 3, price: 310 },
    ],
    subtotal: 1815,
    status: 'confirmed',
    paymentMethod: 'netbanking',
  },
  {
    id: 'SSP-P5Q7R3S9',
    createdAt: '2026-04-23T16:00:00Z',
    customer: { name: 'Sunita Verma', email: 'sunita.verma@gmail.com', phone: '+91 94455 66778' },
    billingAddress: { line1: 'H.No. 88, Model Town', city: 'Chandigarh', state: 'Punjab', pincode: '160009' },
    items: [
      { bookId: 'k-kathak-pravesh', sku: 'SSP-KP-01', titleEnglish: 'Kathak Pravesh', titleHindi: 'कथक प्रवेश', qty: 1, price: 260 },
      { bookId: 'k-kathak-madhyam', sku: 'SSP-KM-01', titleEnglish: 'Kathak Madhyam', titleHindi: 'कथक मध्यम', qty: 1, price: 285 },
    ],
    subtotal: 545,
    status: 'pending',
    paymentMethod: 'upi',
  },
  {
    id: 'SSP-T1U6V2W8',
    createdAt: '2026-04-23T18:30:00Z',
    customer: { name: 'Deepak Srivastava', email: 'd.srivastava@outlook.com', phone: '+91 88001 99234' },
    billingAddress: { line1: '201, Vikas Nagar, Sector 2', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208024' },
    items: [
      { bookId: 'b-swar-vadan-set', sku: 'SSP-SVB-01', titleEnglish: 'Swar Vadan Parts 1-5 (Complete Set)', titleHindi: 'स्वर वादन भाग 1-5 सम्पूर्ण सेट', qty: 1, price: 1685 },
    ],
    subtotal: 1685,
    status: 'confirmed',
    paymentMethod: 'card',
  },
  {
    id: 'SSP-X4Y0Z7A3',
    createdAt: '2026-04-24T11:20:00Z',
    customer: { name: 'Meena Tiwari', email: 'meena.tiwari@gmail.com', phone: '+91 97800 12345' },
    billingAddress: { line1: '33, Ram Nagar, Near Ganga Bridge', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
    items: [
      { bookId: 'c-cbse-music-9', sku: 'SSP-CM-09', titleEnglish: 'CBSE Music Class 9', titleHindi: 'सीबीएसई संगीत कक्षा 9', qty: 5, price: 195 },
      { bookId: 'c-cbse-music-10', sku: 'SSP-CM-10', titleEnglish: 'CBSE Music Class 10', titleHindi: 'सीबीएसई संगीत कक्षा 10', qty: 5, price: 210 },
    ],
    subtotal: 2025,
    status: 'shipped',
    paymentMethod: 'netbanking',
  },
  {
    id: 'SSP-B9C5D1E7',
    createdAt: '2026-04-24T15:50:00Z',
    customer: { name: 'Rohit Pandey', email: 'rohit.pandey@gmail.com', phone: '+91 99887 76655' },
    billingAddress: { line1: '12, Azad Nagar, Kalyanpur', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208017' },
    items: [
      { bookId: 'i-swar-vadan-3', sku: 'SSP-SV-03', titleEnglish: 'Swar Vadan Part 3', titleHindi: 'स्वर वादन भाग 3', qty: 1, price: 340 },
    ],
    subtotal: 340,
    status: 'delivered',
    paymentMethod: 'upi',
  },
  {
    id: 'SSP-H6I2J8K4',
    createdAt: '2026-04-25T08:10:00Z',
    customer: { name: 'Kavita Gupta', email: 'kavita.gupta@rediffmail.com', phone: '+91 93300 44566' },
    billingAddress: { line1: '5, Indira Nagar, Block C', city: 'Agra', state: 'Uttar Pradesh', pincode: '282001' },
    items: [
      { bookId: 'b-raag-set', sku: 'SSP-RSB-01', titleEnglish: 'Raag Theory Complete Set', titleHindi: 'राग शास्त्र सम्पूर्ण सेट', qty: 1, price: 895 },
    ],
    subtotal: 895,
    status: 'pending',
    paymentMethod: 'upi',
  },
];

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      orders: seedOrders,
      addOrder: (order) =>
        set((s) => ({ orders: [order, ...s.orders] })),
      updateStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
    }),
    { name: 'ssp-orders' }
  )
);
