import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { testConnection, pool } from './db/connection';
import { initializeDatabase } from './db/init';
import purchaseOrderRoutes from './routes/purchaseOrders';
import companyRoutes from './routes/company';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

// Add production domain if available
if (process.env.PRODUCTION_FRONTEND_URL) {
  allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging in production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/company', companyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Purchase Order API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      purchaseOrders: '/api/purchase-orders',
      company: '/api/company',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error(
        '✗ Database connection failed. Please configure DATABASE_URL'
      );
      process.exit(1);
    }

    console.log('✓ Database connected successfully');

    // Initialize database if connected
    try {
      await initializeDatabase();
    } catch (err) {
      if (NODE_ENV !== 'production') {
        console.warn('Warning: Database initialization failed', err);
      } else {
        console.error('✗ Database initialization failed:', err);
        process.exit(1);
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`\n✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ API base URL: http://localhost:${PORT}/api`);
      console.log(`✓ CORS enabled for: ${allowedOrigins.join(', ')}\n`);
    });

    // Handle shutdown gracefully
    const gracefulShutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await pool.end();
        console.log('✓ Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('✗ Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err) {
    console.error('✗ Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
