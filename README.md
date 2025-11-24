# Backend - Purchase Order API

Express.js TypeScript backend for the Purchase Order Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your database URL:
```env
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/purchase_orders?sslmode=require
NODE_ENV=development
```

3. Initialize the database:
```bash
npm run db:init
```

4. Start development server:
```bash
npm run dev
```

## API Routes

### Purchase Orders
- `GET /api/purchase-orders` - List all POs with search & pagination
- `GET /api/purchase-orders/:id` - Get single PO
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id` - Update PO
- `DELETE /api/purchase-orders/:id` - Delete PO
- `GET /api/purchase-orders/:id/pdf` - Download PDF

### Health Check
- `GET /api/health` - Server status

## Environment Variables

- `PORT` - Server port (default: 4000)
- `DATABASE_URL` - NeonDB connection string (required)
- `NODE_ENV` - Environment (development/production)

## Database Schema

The application uses a single `purchase_orders` table with the following fields:
- `id` - UUID primary key
- `date` - Purchase order date
- `order_number` - Unique order identifier
- `party_name` - Name of the party
- `broker` - Broker name
- `mill` - Mill name
- `weight` - Product weight
- `bags` - Number of bags
- `product` - Product name
- `rate` - Rate per unit
- `terms_and_conditions` - T&C text
- `created_at` - Created timestamp
- `updated_at` - Updated timestamp
# PO2d
