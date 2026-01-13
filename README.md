# Splittr - Split Expenses Easily

A modern expense splitting application built with Next.js, allowing users to track shared expenses, split bills, and settle up with friends and groups.

## Features

- ✅ **Group Expenses** - Create groups for roommates, trips, or events
- ✅ **Smart Settlements** - Minimize the number of payments when settling up
- ✅ **Multiple Split Types** - Split equally, by percentage, by exact amounts, or by shares
- ✅ **Friend Management** - Add friends and track individual balances
- ✅ **Expense Management** - Create, view, edit, and delete expenses
- ✅ **Activity Feed** - Track all expense and settlement activities
- ✅ **Real-time Balance Updates** - Automatic balance calculations
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk
- **UI Components:** Radix UI + Tailwind CSS
- **Form Handling:** React Hook Form + Zod
- **State Management:** React Server Components

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd splitwise
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `CLERK_SECRET_KEY` - From Clerk Dashboard
- `CLERK_WEBHOOK_SECRET` - From Clerk Dashboard (optional)

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── actions/            # Server actions
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── expenses/          # Expense pages
│   ├── friends/           # Friends page
│   └── groups/            # Groups pages
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── expenses/          # Expense components
│   ├── friends/           # Friend components
│   ├── groups/            # Group components
│   ├── settlements/       # Settlement components
│   └── ui/                # UI primitives
├── lib/                   # Utility libraries
│   ├── services/          # Business logic services
│   ├── validations/       # Zod schemas
│   └── utils.ts           # Utility functions
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses PostgreSQL with the following main models:
- `User` - User accounts
- `Group` - Expense groups
- `GroupMember` - Group membership
- `Expense` - Expenses
- `Split` - Expense splits
- `Settlement` - Settlements
- `Friendship` - Friend relationships
- `Activity` - Activity log

## Development

### Running Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Database Studio

```bash
npx prisma studio
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

The application is optimized for Vercel's serverless functions.

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

Make sure to:
- Set all required environment variables
- Run database migrations
- Configure Clerk webhooks (if using)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
