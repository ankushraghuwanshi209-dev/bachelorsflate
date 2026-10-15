# Bachelors Flat 🏠

> **“A little space to call your own.”**  
> A modern, mobile-responsive web platform connecting travellers, exam aspirants, and interview candidates who need a clean, affordable room for a few hours with trusted local hosts.

---

## 🌟 Key Features

1. **Flexible Micro-Stay Durations:**
   - **2–3 Hours:** Power nap, freshen up with a hot shower, change clothes.

2. **Dual-Role Single Account:**
   - Users can be a **Traveller**, a **Host**, or **Both** using one account.
   - Switch active browsing modes instantly from the top bar or profile page.

3. **Strict Host & Guest Privacy Guard:**
   - **Public search & room pages:** General neighbourhood, approximate area, amenities, slot pricing, and verified reviews.
   - **Never publicly exposed:** Exact flat/house numbers, building entrance codes, and host telephone numbers.
   - **Unlocked upon acceptance:** Full street address and arrival door instructions are revealed *strictly* to the authorised traveller when the host accepts the booking.

4. **Conflict-Free Smart Scheduling:**
   - Validates room availability and prevents conflicting accepted bookings for overlapping time slots.

5. **Direct & Transparent Payments:**
   - Clear policy: Zero advance credit card locking. Travellers pay directly to the host at check-in (Cash or UPI).

6. **Full Supabase Integration with Zero-Setup Demo Fallback:**
   - **Supabase Auth:** Email/password signup & login, password reset, optional Google OAuth.
   - **PostgreSQL Database:** User profiles, room listings, booking requests, and reviews.
   - **Supabase Storage:** Multi-photo room uploads to public `room-photos` bucket with size & MIME validation.
   - **Offline / Local Demo Mode:** If Supabase credentials are not yet set in `.env`, the app seamlessly runs using local browser storage with realistic demo listings and 1-click test accounts.

---

## 🏗️ Project Architecture & Data Model

```
bachelors-flat/
├── supabase_schema.sql      # Complete PostgreSQL tables & RLS security policies
├── .env.example             # Template for Supabase credentials
├── index.html               # Main HTML entry with brand metadata
├── src/
│   ├── types/               # TypeScript interfaces & data models
│   ├── supabase/            # Supabase client SDK initialization & fallback check
│   ├── services/            # Storage, Room, Booking, Review, Auth services
│   ├── context/             # AuthContext (roles, sessions) & ToastContext
│   ├── components/          # Navbar, Footer, RoomCard, Modals, Banners
│   ├── pages/               # Home, Search, RoomDetails, Dashboards, Profile, Safety, Auth
│   └── App.tsx              # View router and layout orchestration
```

### PostgreSQL Tables (Supabase)

- **`users`**: Private account data such as email, phone number, roles, and verification status. Protected by RLS (`auth.uid() = uid`).
- **`public_profiles`**: Public allowlist (`displayName`, `photoURL`, `city`, `bio`) accessible to everyone.
- **`rooms`**: Public listing fields only, including `host_id`, `title`, `description`, `city`, `neighbourhood`, `approx_location`, amenities, pricing, availability, and photos.
- **`room_private`**: Host-only `exact_address`, `check_in_instructions`, and `host_phone`.
- **`bookings`**: Booking request fields accessible only to the host and traveller.
- **`booking_private_details`**: Private arrival/contact details accessible by the host and traveller only after the booking is accepted.
- **`reviews`**: `booking_id`, `room_id`, `host_id`, `traveller_id`, `traveller_name`, `rating` (1–5), `comment`, `moderation_status`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### 2. Installation & Running Locally

```bash
# Navigate to project folder
cd bachelors-flat

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit the local development server (typically `http://localhost:5173`) in your browser.

> 💡 **Instant Testing Tip:** The app comes with built-in instant demo login buttons on the Login screen and top banner ("Test as Traveller" and "Test as Host") so you can explore all features right away without typing credentials!

---

## 🔑 Supabase Setup Guide (Connecting Live Supabase)

Follow these steps to connect your own live Supabase project:

### Step 1: Create a Supabase Project
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, pick your organization, project name (e.g. `bachelors-flat`), and a strong database password.
3. Choose a region closest to your users.

### Step 2: Configure Environment Variables
Open the `.env` file in the root of `bachelors-flat`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

> ⚠️ **Security Warning:** Only use the **Anon (public)** key in frontend code. Never put the `service_role` (secret) key in the frontend!

### Step 3: Run Database Schema & Storage Rules
1. In the Supabase Dashboard left sidebar, click **SQL Editor**.
2. Click **New Query**.
3. Copy the entire contents of `supabase_schema.sql` and click **Run**.
4. This creates all necessary tables (`users`, `public_profiles`, `rooms`, `room_private`, `bookings`, `booking_private_details`, `reviews`), enables Row Level Security (RLS) policies, and creates the `room-photos` storage bucket.

### Step 4: Restart Vite Development Server
```bash
npm run dev
```

The top banner will immediately show **"Live Supabase Connected"** in green!

---

## 🔒 Security & Privacy Guarantees

- **No Passwords in Plaintext Tables:** Supabase Auth strictly manages encrypted authentication tokens and passwords. Passwords are never stored in user database tables.
- **Granular Row Level Security (RLS):**
  - Users can read and write only their own profile data.
  - Hosts can manage only their own room listings.
  - Public search queries receive only active listings without sensitive host phone numbers or exact addresses.
  - Room private details (`exact_address`, `check_in_instructions`, `host_phone`) are accessible only to the room's host.
  - Booking private details are accessible to travellers strictly after the host accepts the booking.
  - Reviews can only be submitted by verified travellers.
- **Granular Storage Policies:**
  - Hosts upload photos to their own directory (`room-photos/{userId}/`).
  - Strict MIME validation (`image/*`) and 5MB size limit enforced.

---

## 📱 Mobile Responsiveness & Accessibility

- **Mobile First:** Designed with touch targets, responsive drawer menus, and clean card padding.
- **Keyboard Accessible:** Accessible form inputs, ARIA labels, and clear visual focus rings.
- **Feedback States:** Friendly toasts for validation errors, scheduling conflicts, and photo upload progress.

---

## 📄 License
This project is licensed under the MIT License.
