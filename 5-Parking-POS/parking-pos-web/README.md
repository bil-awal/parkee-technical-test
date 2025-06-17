# 🚗 Parking POS Web

A modern web application for parking management system built with Next.js and TypeScript. This system provides comprehensive parking operations including vehicle check-in/check-out, member management, payment processing, and reporting.

## ✨ Features

### Core Functionality
- **Vehicle Management**: Check-in/check-out with photo capture
- **Member System**: Registration, balance top-up, and member benefits
- **Payment Processing**: Multiple payment methods (cash, member balance, cards)
- **Voucher System**: Discount management with percentage/fixed amount
- **Real-time Dashboard**: Statistics and analytics
- **Photo Management**: Vehicle photo storage and retrieval
- **Invoice Generation**: Detailed parking receipts

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live parking status and notifications
- **Modern UI**: Clean interface with Tailwind CSS and Radix UI
- **Form Validation**: Robust validation with React Hook Form + Zod

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Camera**: React Webcam

### State Management & Data Fetching
- **Global State**: Zustand
- **Server State**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Validation**: Zod

### Development Tools
- **Package Manager**: npm/yarn/pnpm
- **Linting**: ESLint
- **Build Tool**: Turbopack (Next.js)

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ 
- npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd parking-pos-web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Development

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

## 🔌 API Integration

The application integrates with the Parking POS API with the following endpoints:

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh-token` - Token refresh
- `POST /auth/logout` - User logout

### Parking Operations
- `POST /parking/check-in` - Vehicle check-in
- `POST /parking/check-out` - Vehicle check-out
- `GET /parking/status/{plateNumber}` - Check parking status
- `GET /parking/calculate/{plateNumber}` - Calculate parking fee

### Member Management
- `GET /parking/members` - List members
- `POST /parking/members` - Register new member
- `PUT /parking/members/{id}` - Update member
- `POST /parking/members/{id}/topup` - Top-up balance

### Additional Features
- Voucher management
- Photo handling
- Dashboard statistics
- Report generation

## 🎨 Key Components

### Authentication
- Login form with validation
- JWT token management
- Protected routes

### Dashboard
- Real-time statistics
- Quick actions panel
- Recent activities

### Vehicle Management
- Photo capture integration
- Plate number validation
- Status tracking

### Member System
- Registration forms
- Balance management
- Member benefits

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS 4 with custom configurations for:
- Design system colors
- Component variants
- Responsive breakpoints

### React Query
Configured for:
- API data caching
- Background updates
- Error handling
- Optimistic updates

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🧪 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error boundaries
- Use custom hooks for logic reuse

### Component Structure
```tsx
// Component with proper TypeScript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export function Component({ title, onAction }: ComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### API Integration
```tsx
// Using React Query
function useVehicleStatus(plateNumber: string) {
  return useQuery({
    queryKey: ['vehicle-status', plateNumber],
    queryFn: () => api.getVehicleStatus(plateNumber),
    enabled: !!plateNumber,
  });
}
```

## 🚀 Deployment

### Build Optimization
- Next.js automatic optimization
- Image optimization
- Bundle analysis
- Performance monitoring

### Production Checklist
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Performance testing completed
- [ ] Security headers implemented
- [ ] Error monitoring setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

## License
Proprietary for PARKEE Technical Test - Bil Awal © 2025