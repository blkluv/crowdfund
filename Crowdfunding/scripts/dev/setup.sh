#!/bin/bash

# scripts/dev/setup.sh
# Development environment setup

set -e

echo "🛠️  Setting up development environment..."

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed"
        exit 1
    fi
}

echo "Checking prerequisites..."
check_command "node"
check_command "npm"
check_command "docker"
check_command "psql"

# Setup environment files
setup_env() {
    if [ ! -f backend/.env ]; then
        echo "📝 Creating backend environment file..."
        cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://crowdfunding_user:password@localhost:5432/crowdfunding_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
BCRYPT_ROUNDS=12

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@crowdfunding.com

# Payments
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=crowdfunding-dev-assets

# Search
ELASTICSEARCH_URL=http://localhost:9200

# Monitoring
SENTRY_DSN=your-sentry-dsn

# App
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# File uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF
    fi

    if [ ! -f frontend/.env.local ]; then
        echo "📝 Creating frontend environment file..."
        cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
EOF
    fi
}

# Setup Docker services
setup_docker() {
    echo "🐳 Setting up Docker services..."
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: crowdfunding_dev
      POSTGRES_USER: crowdfunding_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schemas:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crowdfunding_user -d crowdfunding_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
EOF

    docker-compose -f docker-compose.dev.yml up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 10
}

# Setup backend
setup_backend() {
    echo "🔧 Setting up backend..."
    cd backend

    cat > package.json << 'EOF'
{
  "name": "crowdfunding-backend",
  "version": "1.0.0",
  "description": "Crowdfunding platform backend API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:migrate": "npm run build && node dist/database/migrate.js",
    "db:seed": "npm run build && node dist/database/seed.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/throttler": "^4.0.0",
    "@nestjs/schedule": "^3.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-google-oauth20": "^2.0.0",
    "passport-github2": "^0.1.12",
    "bcrypt": "^5.1.0",
    "stripe": "^12.0.0",
    "nodemailer": "^6.9.0",
    "bull": "^4.11.0",
    "ioredis": "^5.3.0",
    "multer": "^1.4.5-lts.1",
    "aws-sdk": "^2.1400.0",
    "@elastic/elasticsearch": "^8.8.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.8.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "winston": "^3.9.0",
    "uuid": "^9.0.0",
    "moment": "^2.29.4",
    "lodash": "^4.17.21",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^3.0.8",
    "@types/passport-google-oauth20": "^2.0.11",
    "@types/multer": "^1.4.7",
    "@types/nodemailer": "^6.4.8",
    "@types/uuid": "^9.0.2",
    "@types/lodash": "^4.14.195",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0",
    "eslint": "^8.42.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "prettier": "^2.8.8"
  }
}
EOF

    npm install

    # Create basic backend structure
    mkdir -p src/{controllers,services,models,middleware,utils,types,database}

    # Create main index file
    cat > src/index.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security
  app.use(helmet());
  app.use(compression());
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Crowdfunding Platform API')
    .setDescription('API for the crowdfunding platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on port ${port}`);
}

bootstrap();
EOF

    cd ..
}

# Setup frontend
setup_frontend() {
    echo "🎨 Setting up frontend..."
    cd frontend

    cat > package.json << 'EOF'
{
  "name": "crowdfunding-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^13.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@next/font": "^13.4.0",
    "next-auth": "^4.22.0",
    "@stripe/stripe-js": "^1.54.0",
    "@stripe/react-stripe-js": "^2.1.0",
    "axios": "^1.4.0",
    "react-hook-form": "^7.44.0",
    "react-query": "^3.39.3",
    "zustand": "^4.3.0",
    "framer-motion": "^10.12.0",
    "tailwindcss": "^3.3.0",
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/typography": "^0.5.9",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0",
    "react-markdown": "^8.0.7",
    "date-fns": "^2.30.0",
    "recharts": "^2.6.0",
    "socket.io-client": "^4.7.0",
    "react-dropzone": "^14.2.0",
    "react-hot-toast": "^2.4.0",
    "clsx": "^1.2.1",
    "class-variance-authority": "^0.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "eslint": "^8.42.0",
    "eslint-config-next": "^13.4.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
EOF

    npm install

    # Create Next.js config
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-s3-bucket.s3.amazonaws.com'],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig
EOF

    # Create Tailwind config
    cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
      plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOF

    # Create basic app structure
    mkdir -p src/app/{api,auth,projects,dashboard,admin}
    mkdir -p src/components/{ui,forms,project,dashboard}
    mkdir -p src/hooks src/utils src/types src/styles

    cd ..
}

# Initialize database
init_database() {
    echo "🗄️ Initializing database..."
    
    # Wait for PostgreSQL to be ready
    until docker exec $(docker-compose -f docker-compose.dev.yml ps -q postgres) pg_isready -U crowdfunding_user -d crowdfunding_dev; do
        echo "Waiting for PostgreSQL..."
        sleep 2
    done
    
    # Run schema
    docker exec -i $(docker-compose -f docker-compose.dev.yml ps -q postgres) psql -U crowdfunding_user -d crowdfunding_dev < database/schemas/schema.sql
    
    echo "✅ Database initialized"
}

# Main setup flow
main() {
    setup_env
    setup_docker
    setup_backend
    setup_frontend
    init_database
    
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update the .env files with your actual API keys"
    echo "2. Run 'npm run dev' to start the development servers"
    echo "3. Visit http://localhost:3000 for the frontend"
    echo "4. Visit http://localhost:3001/api/docs for API documentation"
    echo "5. Visit http://localhost:8025 for MailHog (email testing)"
    echo ""
    echo "Services running:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:3001"
    echo "- PostgreSQL: localhost:5432"
    echo "- Redis: localhost:6379"
    echo "- Elasticsearch: http://localhost:9200"
    echo "- MailHog: http://localhost:8025"
}

main
