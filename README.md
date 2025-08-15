# Crowdfunding Platform - Complete Full-Stack Implementation

A comprehensive crowdfunding platform built with modern technologies, supporting both All-or-Nothing and Keep-it-All funding models, with advanced features like milestone payments, real-time updates, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Multi-Model Funding**: All-or-Nothing (AON), Keep-it-All (KIA), and Milestone-based funding
- **Comprehensive Project Management**: Full project lifecycle from draft to fulfillment
- **Advanced Reward System**: Multiple tiers, add-ons, early bird specials, and inventory management
- **Real-time Updates**: Live funding progress, notifications, and project communications
- **Global Support**: Multi-currency, international shipping, VAT/tax calculations
- **Social Features**: Comments, updates, creator profiles, and community engagement

### Payment & Security
- **Secure Payments**: Stripe integration with 3D Secure, fraud detection, and dispute handling
- **GDPR Compliant**: Full data protection, user consent, and right-to-be-forgotten
- **KYC/AML**: Creator verification and anti-money laundering compliance
- **Risk Management**: Automated project review, creator scoring, and fraud detection

### Advanced Features
- **Full-text Search**: Elasticsearch-powered project discovery with faceted filtering
- **Analytics**: Comprehensive tracking, conversion funnels, and business intelligence
- **Monitoring**: Prometheus/Grafana stack with alerting and health checks
- **API-first**: Complete REST API with OpenAPI documentation
- **Mobile Ready**: Responsive design with React Native compatibility

## 🏗️ Architecture

### Technology Stack

**Backend**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Redis caching
- **Search**: Elasticsearch
- **Queue**: BullMQ with Redis
- **Payments**: Stripe Connect
- **Storage**: AWS S3 compatible
- **Authentication**: JWT with OAuth2 (Google, GitHub)

**Frontend**
- **Framework**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: Zustand + React Query
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation

**Infrastructure**
- **Cloud**: AWS with Terraform
- **Containers**: Docker + ECS Fargate
- **CDN**: CloudFront
- **Monitoring**: Prometheus, Grafana, Sentry
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- AWS CLI (for deployment)
- Terraform (for infrastructure)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/crowdfunding-platform.git
cd crowdfunding-platform

# Run the setup script
chmod +x setup-script.sh
./setup-script.sh
```

### 2. Development Environment

```bash
# Setup development environment
chmod +x scripts/dev/setup.sh
./scripts/dev/setup.sh

# Start development servers
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs
- Database: PostgreSQL on port 5432
- Redis: Redis on port 6379
- Email Testing: MailHog on http://localhost:8025

### 3. Configure Environment Variables

Update the `.env` files in both `backend/` and `frontend/` directories with your API keys:

**Backend (.env)**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# Email
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

## 📁 Project Structure

```
crowdfunding-platform/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/            # Utilities and API clients
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── middleware/     # Custom middleware
│   │   ├── guards/         # Auth guards
│   │   └── utils/          # Utilities
│   └── tests/              # Test files
├── database/                 # Database schemas and migrations
│   ├── schemas/            # SQL schema files
│   ├── migrations/         # Migration scripts
│   └── seeds/              # Seed data
├── infrastructure/           # Terraform and deployment
│   ├── terraform/          # Infrastructure as code
│   ├── docker/             # Docker configurations
│   └── monitoring/         # Monitoring stack
├── scripts/                  # Deployment and utility scripts
│   ├── dev/                # Development scripts
│   ├── deploy/             # Deployment scripts
│   └── maintenance/        # Maintenance scripts
└── docs/                     # Documentation
```

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Unit tests
npm run test:e2e           # Integration tests
npm run test:cov           # Coverage report

# Frontend tests
cd frontend
npm test                    # Component tests
npm run test:coverage      # Coverage report

# Run all tests
npm run test               # From root directory
```

### Code Quality

```bash
# Linting
npm run lint               # Check code style
npm run lint:fix           # Fix auto-fixable issues

# Type checking
npm run type-check         # TypeScript validation

# Formatting
npm run format             # Format code with Prettier
```

### Database Operations

```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database
npm run db:reset
```

## 🚀 Deployment

### Production Deployment

```bash
# Set environment variables
export AWS_ACCOUNT_ID=your_account_id
export DOMAIN_NAME=yourdomain.com
export TERRAFORM_STATE_BUCKET=your_terraform_state_bucket

# Deploy to production
./scripts/deploy/deploy.sh production
```

### Staging Deployment

```bash
# Deploy to staging
./scripts/deploy/deploy.sh staging
```

### Infrastructure Setup

The deployment script will:
1. Build and push Docker images to ECR
2. Deploy infrastructure with Terraform (VPC, RDS, ECS, ALB, etc.)
3. Run database migrations
4. Deploy services to ECS Fargate
5. Configure monitoring and alerting
6. Run health checks

## 📊 Monitoring

### Metrics and Monitoring

- **Application Metrics**: Custom business metrics (projects created, pledges, payments)
- **Infrastructure Metrics**: CPU, memory, disk usage, network
- **Database Metrics**: Connection pool, query performance, replication lag
- **Payment Metrics**: Success rates, failure reasons, processing times

### Dashboards

Access monitoring dashboards:
- **Grafana**: https://monitoring.yourdomain.com
- **Prometheus**: https://prometheus.yourdomain.com
- **Application Logs**: CloudWatch or your logging solution

### Alerts

Configured alerts for:
- High error rates (>10% for 5 minutes)
- High response times (>1s 95th percentile)
- Database/Redis connectivity issues
- High resource usage (>80% CPU, >90% memory)
- Failed payment spikes
- Queue backlogs

## 🔒 Security

### Security Features

- **Authentication**: JWT with refresh tokens, OAuth2 integration
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive validation with Zod/class-validator
- **Rate Limiting**: API rate limiting and DDoS protection
- **Security Headers**: CSRF, XSS, content security policy
- **Audit Logging**: Complete audit trail of user actions

### Compliance

- **GDPR**: Data minimization, consent management, data portability
- **PCI DSS**: Secure payment processing (Stripe handles card data)
- **KYC/AML**: Identity verification for creators
- **Financial Regulations**: Escrow handling, tax compliance

## 📈 Business Features

### Funding Models

1. **All-or-Nothing (AON)**
   - Charges backers only if goal is reached
   - Full refunds if project fails
   - Creator gets funds after successful campaign

2. **Keep-it-All (KIA)**
   - Charges backers immediately
   - Creator keeps all funds regardless of goal
   - Higher platform fee typically

3. **Milestone-based**
   - Staged fund release based on deliverables
   - Escrow management with backer voting
   - Risk reduction for backers

### Revenue Streams

- Platform fees (5-8% of successful funding)
- Payment processing fees (passed through)
- Featured placement fees
- Premium creator tools
- Affiliate/referral commissions

### Analytics & Insights

- Conversion funnel analysis
- Traffic source attribution
- Creator performance metrics
- Category trend analysis
- Seasonal patterns
- Geographic insights

## 🌐 Internationalization

### Multi-currency Support

- Real-time currency conversion
- Local payment methods
- Tax calculation by jurisdiction
- VAT/GST compliance for digital/physical goods

### Localization

- Multi-language support framework
- RTL language support
- Locale-specific formatting
- Cultural adaptation guidelines

## 🔄 Maintenance

### Regular Maintenance

```bash
# Update dependencies
npm run update-deps

# Database maintenance
npm run db:vacuum
npm run db:analyze

# Clear old data
npm run cleanup:old-sessions
npm run cleanup:expired-tokens

# Backup database
npm run backup:database
```

### Performance Optimization

- Database query optimization
- CDN cache management
- Image optimization
- Bundle size monitoring
- Core Web Vitals tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run quality checks
6. Submit a pull request

### Development Workflow

1. **Planning**: Create GitHub issue with requirements
2. **Development**: Feature branch with descriptive name
3. **Testing**: Add unit and integration tests
4. **Review**: Submit PR with detailed description
5. **Deployment**: Automatic deployment after merge

## 📚 API Documentation

Interactive API documentation is available at:
- Development: http://localhost:3001/api/docs
- Production: https://api.yourdomain.com/api/docs

### Key API Endpoints

**Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `GET /auth/google` - Google OAuth
- `GET /auth/github` - GitHub OAuth

**Projects**
- `GET /projects` - List projects with filters
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `POST /projects/:id/submit` - Submit for review

**Pledges**
- `POST /pledges` - Create pledge
- `GET /pledges/:id` - Get pledge details
- `POST /pledges/:id/confirm` - Confirm payment

**Payments**
- `POST /payments/intent` - Create payment intent
- `POST /webhooks/stripe` - Stripe webhooks

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.dev.yml ps postgres

# Reset database
npm run db:reset
```

**Payment Processing Issues**
- Verify Stripe webhooks are configured
- Check webhook endpoint URLs
- Validate webhook signatures
- Review Stripe dashboard for errors

**Build Issues**
```bash
# Clear caches
npm run clean
npm install

# Reset Docker
docker-compose down -v
docker-compose up -d
```

### Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Check `/docs` folder for detailed guides
- Email: support@yourdomain.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS and Next.js communities
- Stripe for payment processing
- All open source contributors
- Beta testers and early adopters

---

Built with ❤️ by the Crowdfunding Platform Team
