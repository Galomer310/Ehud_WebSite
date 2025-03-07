# Ehud Fitness Platform

Ehud Fitness Platform is a web-based application designed to help users achieve their fitness goals through personalized workout plans and subscription options. The app provides secure user authentication, email verification, and a personalized dashboard where users can manage their subscription plan.

## Features

- **User Authentication & Registration**
  - Secure registration with user details (email, password, height, weight, age, occupation, exercise frequency, sex, and medical conditions).
  - Email verification via a unique verification token.
- **Subscription Management**
  - Users can select a training program category (e.g., Growth & Development, Weight Loss, Maintaining a Healthy Lifestyle, Improving Abilities).
  - Choose from multiple subscription plans with distinct pricing and meeting options.
  - Once selected, the subscription details are saved and displayed in the Personal Area.
- **Personal Area Dashboard**
  - Displays user details (email, age, weight, height) along with the chosen subscription plan.
  - Shows a friendly message: "Your choices have been sent to Ehud. Your Dashboard will be updated soon with your new plan. In the meantime, make sure you rest and drink water."
- **UI Enhancements**
  - A responsive Navbar featuring a logo placeholder.
  - A Footer with social media links (Instagram, Email, Facebook) and a logo placeholder.
- **Full-Stack Implementation**
  - **Frontend:** React, Vite, Redux, TypeScript
  - **Backend:** Node.js, Express, TypeScript, PostgreSQL (NeonDB), Nodemailer for email, JWT for authentication, and bcrypt for password hashing

## Tech Stack

- **Frontend:** React, Vite, Redux, TypeScript, Axios
- **Backend:** Node.js, Express, TypeScript, PostgreSQL (NeonDB), Nodemailer, JWT, bcrypt, crypto

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A NeonDB (PostgreSQL) instance
- A Gmail account for sending verification emails (with App Password enabled if you use 2FA)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/EhudWebSite.git
   cd EhudWebSite
   ```

2. **Setup Environment Variables:**

   Create a `.env` file in the `backend` folder with the following variables:

   ```env
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

3. **Install Dependencies:**

   - For the backend:
     ```bash
     cd backend
     npm install
     ```
   - For the frontend:
     ```bash
     cd ../frontend
     npm install
     ```

4. **Update Database Schema:**

   Run the following SQL script on your NeonDB instance to create or update the `users` table:

   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     height DECIMAL(5,2),
     weight DECIMAL(5,2),
     age INTEGER,
     occupation VARCHAR(255),
     exercise_frequency INTEGER,
     sex VARCHAR(10),
     medical_conditions TEXT,
     is_verified BOOLEAN DEFAULT false,
     verification_token VARCHAR(255),
     subscription_plan TEXT,
     subscription_price VARCHAR(50),
     training_category VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Running the Application

This project uses a monorepo structure. To run both the backend and frontend concurrently, use:

```bash
npm run dev
```

This command uses the `concurrently` package to start:
- The backend server on `http://localhost:5000`
- The frontend app on `http://localhost:5173` (or as specified by Vite)

## Usage

1. **Registration & Email Verification:**
   - Register a new account.
   - Check your email for a verification link and click it to verify your account.
2. **Login & Subscription Selection:**
   - Log in with your credentials.
   - If no subscription plan is chosen, the Personal Area will prompt you to select a training category and subscription plan.
   - Once selected, the subscription details are saved and will display on subsequent logins.
3. **Dashboard:**
   - The Personal Area displays your user details and your chosen subscription plan along with a friendly message encouraging you to rest and drink water.

## Folder Structure

```
EhudWebSite/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── index.ts
│       ├── db.ts
│       ├── middleware/
│       │   └── authMiddleware.ts
│       └── routes/
│           └── auth.ts
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── HomePage.tsx
│       │   ├── Register.tsx
│       │   ├── Login.tsx
│       │   ├── PersonalArea.tsx
│       │   ├── Navbar.tsx
│       │   ├── Footer.tsx
│       │   └── SubscriptionMenu.tsx
│       └── store/
│           ├── store.ts
│           └── authSlice.ts
└── .gitignore
```



## License

This project is licensed under the [MIT License](LICENSE).

