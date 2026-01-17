# 🚀 AspireAI - AI-Powered Career Development Platform

![AspireAI Logo](https://github.com/kirigaya07/AICareerSense/blob/master/public/logo.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-blue?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-blue?logo=postgresql)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red)](https://github.com/kirigaya07/AICareerSense)

---

## 📚 Table of Contents

- [🔍 Overview](#-overview)
- [✨ Features](#-features)
- [💎 AI Token System](#-ai-token-system)
- [⚙️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Prerequisites](#-prerequisites)
  - [📁 Environment Setup](#-environment-setup)
  - [📦 Installation](#-installation)
  - [🔐 Security Best Practices](#-security-best-practices)
- [📁 Project Structure](#-project-structure)
- [🔒 Payment Security](#-payment-security)
- [🛠 Contributing](#-contributing)
- [🪪 License](#-license)
- [📬 Contact](#-contact)

---

## 🔍 Overview

**AspireAI** is an advanced, AI-powered career development platform designed to guide users through every step of their professional journey. Whether you're crafting the perfect resume, preparing for interviews, or navigating industry shifts, AspireAI provides intelligent, real-time support and tools to supercharge your career.

---

## ✨ Features

- **AI-Powered Career Guidance**  
  Receive personalized career path suggestions and role-specific advice using cutting-edge AI algorithms.

- **Smart Resume Creation**  
  Generate ATS-optimized resumes with dynamic formatting and keyword suggestions to increase job match success.

- **Interview Preparation**  
  Practice realistic, role-based questions with real-time AI feedback and tips to improve your answers.

- **Industry Insights**  
  Stay updated on salary trends, in-demand roles, skills, and hiring patterns relevant to your domain.

- **Cover Letter Generation**  
  Instantly generate tailored cover letters specific to any job listing using AI prompts.

- **Continuous Career Development**  
  Get learning path suggestions, course recommendations, and skill assessments to grow consistently.

---

## 💎 AI Token System

AspireAI operates on a **credit-based token model** that powers all AI-driven features. Token costs are dynamically managed based on feature usage and system configuration, ensuring fair usage and scalability.

🪙 **Tokens** can be purchased directly through secure Razorpay payment integration. The system uses OpenAI's token counting algorithm to accurately track token consumption for all AI operations.

### Token Packages

- **Starter**: 10,000 tokens
- **Professional**: 50,000 tokens
- **Enterprise**: 100,000 tokens

New users receive **10,000 free tokens** upon registration.

---

## ⚙️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/), [React 19](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: Next.js API Routes, [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [Clerk.dev](https://clerk.dev/)
- **AI Integration**: [OpenAI GPT-4](https://openai.com/) (GPT-4o-mini)
- **UI Library**: [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/), [Shadcn UI](https://ui.shadcn.com/)
- **Payments**: [Razorpay](https://razorpay.com/) with enterprise-level security
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 🔧 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js v18+**
- **PostgreSQL** installed and running
- **Clerk account** for authentication
- **OpenAI API Key**
- **Razorpay account** (for payment processing)

---

### 📁 Environment Setup

Create a `.env` file in the root directory and add the following environment variables:

```env
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/aspireai"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret  # Optional but recommended

# Inngest (for background jobs)
INNGEST_EVENT_KEY=your_inngest_event_key  # Optional
INNGEST_SIGNING_KEY=your_inngest_signing_key  # Optional
```

---

### 📦 Installation

1. Clone the Repository:

   ```bash
   git clone https://github.com/kirigaya07/AICareerSense.git
   cd aspireai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser to access the app.

### 🔐 Security Best Practices

- **Never commit** `.env` file to version control
- Use **strong, unique** API keys for production
- Enable **Razorpay webhooks** for production deployments
- Regularly **rotate** API keys and secrets
- Monitor **payment logs** for suspicious activity
- Use **HTTPS** in production (required for Razorpay)

---

### 📁 Project Structure

```bash
aspireai/
├── app/                          # Next.js app directory
│   ├── (main)/                   # Main application routes
│   │   ├── dashboard/            # User dashboard
│   │   ├── resume/               # Resume builder
│   │   ├── ai-cover-letter/      # Cover letter generator
│   │   ├── interview/            # Interview preparation
│   │   └── tokens/                # Token management
│   ├── api/                      # API routes
│   │   ├── payments/             # Payment endpoints
│   │   │   ├── create-order/     # Create Razorpay order
│   │   │   ├── verify/            # Verify payment (client-side)
│   │   │   └── webhook/          # Razorpay webhook handler
│   │   └── inngest/              # Inngest webhook
│   └── lib/                      # Reusable utility functions
│       ├── openai.js             # OpenAI integration
│       ├── openai-tokens.js       # Token counting
│       ├── razorpay.js           # Razorpay client
│       ├── tokens.js             # Token management
│       └── auth-utils.js          # Authentication helpers
├── actions/                      # Server actions
│   ├── payments.js                # Payment operations
│   ├── resume.js                 # Resume operations
│   ├── cover-letter.js           # Cover letter operations
│   └── interview.js              # Interview operations
├── components/                   # Reusable React UI components
│   └── ui/                       # Shadcn UI components
├── data/                         # Static data files and constants
├── lib/                          # Shared utilities
│   ├── constants.js              # Token packages and constants
│   └── ai-helpers.js             # AI utility functions
├── prisma/                       # Prisma schema and migrations
│   ├── schema.prisma             # Database schema definition
│   └── migrations/               # Database migrations
├── public/                       # Static files (images, favicon, etc.)
└── .env                          # Environment variables
```

---

## 🔒 Payment Security

AspireAI implements **enterprise-level security** for all payment transactions to ensure your money is safe:

### Security Features

✅ **Multi-Layer Verification**

- HMAC SHA256 signature verification
- Razorpay API payment status verification
- Payment ownership validation
- Amount validation against package pricing

✅ **Fraud Prevention**

- Duplicate payment detection
- Race condition protection with database transactions
- Payment ownership checks (users can only process their own payments)
- Real-time payment status verification with Razorpay

✅ **Webhook Support**

- Server-side payment verification via Razorpay webhooks
- Automatic payment status updates
- More secure than client-side verification

### Webhook Configuration (Recommended)

For enhanced security, configure Razorpay webhooks:

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET` environment variable

### Payment Flow

1. **Order Creation**: User selects a token package → Server creates Razorpay order
2. **Payment Processing**: User completes payment via Razorpay checkout
3. **Verification**:
   - Client-side signature verification (immediate feedback)
   - Server-side webhook verification (more secure, recommended)
4. **Token Addition**: Tokens are added to user account only after successful verification

All payment data is encrypted and transactions are logged for audit purposes.

---

## 🛠 Contributing

We love contributions! ❤️

1. Fork the repository.
2. Create your feature branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add: amazing feature"
   ```

4. Push to the branch:

   ```bash
   git push origin feature/amazing-feature
   ```

5. Create a Pull Request.

Please make sure to follow the Code of Conduct and adhere to our contribution guidelines.

---

### 🪪 License

This project is licensed under the [MIT License](LICENSE).

---

### 📬 Contact

For questions or feedback, feel free to reach out via [GitHub Issues](https://github.com/kirigaya07/AICareerSense/issues).
