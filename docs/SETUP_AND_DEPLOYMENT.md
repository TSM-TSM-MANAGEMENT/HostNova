# HostNova — Setup, Security & Deployment Guide

> **Demonstration Notice**: HostNova is a demonstration international web hosting platform. All payments, revenue figures, SSL certificates, and hosting service activations are simulated. No real financial transactions or physical server provisioning occur.

---

## 1. Architecture Overview
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, jsPDF.
- **Live Persistent Database (AI Studio Environment)**: Firebase Firestore + Firebase Authentication with strict security rules (`firestore.rules`) and atomic batch order creation.
- **Supabase PostgreSQL Migration Package**: Complete schema, constraints, RLS policies, and approved default seed data included in `supabase/migrations/001_hostnova_schema.sql` for standalone Supabase deployments.

## 2. Approved Default Pricing & Discounts
| Plan | Base Monthly | Storage | Websites | Highlight |
| :--- | :--- | :--- | :--- | :--- |
| **Basic** | `$15.00` | `10 GB SSD` | `1` | Standard |
| **Pro** | `$25.00` | `50 GB SSD` | `2` | Most Popular |
| **Enterprise** | `$45.00` | `100 GB SSD` | `10` | Multi-Site |

| Duration | Discount | Basic Total | Pro Total | Enterprise Total |
| :--- | :--- | :--- | :--- | :--- |
| **1 Month** | `0%` | `$15.00` | `$25.00` | `$45.00` |
| **3 Months** | `3%` | `$43.65` | `$72.75` | `$130.95` |
| **6 Months** | `7%` | `$83.70` | `$139.50` | `$251.10` |
| **12 Months** | `15%` | `$153.00` | `$255.00` | `$459.00` |
| **24 Months** | `25%` | `$270.00` | `$450.00` | `$810.00` |

## 3. Secure Initial Admin Setup
1. **Live Firebase Environment**:
   - No public admin registration exists.
   - The workspace owner account (`packbaribd@gmail.com` with verified email) is authorized as the initial bootstrap administrator in `firestore.rules`.
   - Additional administrators can only be added out-of-band in the Firebase Console by creating a document at `/admins/{firebaseAuthUid}` with `{ uid, email, createdAt }`.
   - Navigate to `/admin/login` and sign in with Google to access the Admin Panel.
2. **Standalone Supabase Deployment**:
   - Run `supabase/migrations/001_hostnova_schema.sql` in the Supabase SQL Editor.
   - Sign up your administrator account via Supabase Auth, then run the following in the Supabase SQL Editor (service role only):
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'your-admin-email@domain.com';
     ```

## 4. Local Development
```bash
npm install
npm run dev
```
The development server runs at `http://localhost:3000`.

## 5. Production Build & Deployment
```bash
npm run lint
npm run build
```
Deploy the `dist/` bundle to Cloud Run, Vercel, Netlify, or Firebase Hosting. Configure environment variables from `.env.example` in your hosting provider's secret manager (never commit `.env` or service role keys to version control).

## 6. GitHub Repository Setup
```bash
git init
git add .
git commit -m "Initial commit: HostNova international hosting platform"
git branch -M main
git remote add origin https://github.com/<your-username>/hostnova.git
git push -u origin main
```
