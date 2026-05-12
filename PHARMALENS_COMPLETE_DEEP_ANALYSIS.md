# PHARMALENS: THE ULTIMATE SYSTEM BLUEPRINT (PART 1)
> **Master Architecture, Top-Level Files, Configuration, and Global Context**

This document provides a line-for-line, file-by-file absolute micro-detail breakdown of the entire PharmaLens ecosystem. It is intended for autonomous AI agents or senior developers who need to understand exactly how the project is stitched together at every layer.

---

## 1. MACRO ARCHITECTURE & DATA FLOW

PharmaLens operates as a React 18 Single Page Application (SPA), served by Netlify CDN, communicating with a Supabase PostgreSQL database via direct client calls and 23 stateless Deno edge functions. State is managed by `@tanstack/react-query` for API/DB calls and React `useState`/`useEffect` hooks for local state.

**Core Data Pathways:**
1. **Unauthenticated User (Guest)**: Served static HTML/JS via Netlify CDN. Permitted 1 free drug identification tracked purely via `localStorage`.
2. **Authenticated User (Free/Lite/Pro)**: Gets JWT from Supabase Auth. JWT is passed to Edge Functions in the `Authorization: Bearer <token>` header.
3. **Payments**: Stripe is NOT used. Razorpay is used. The UI creates a checkout session via edge function (`razorpay-order`), user pays on frontend modal, and Supabase updates via server-to-server webhook (`razorpay-webhook`).
4. **AI Processing**: OpenRouter is the sole LLM gateway. The UI never talks to OpenRouter directly. Images are sent base64 encoded to `enhanced-drug-identify` or `standard-drug-identify`, which act as orchestrators.

---

## 2. TOP-LEVEL CONFIGURATION FILES

### 2.1 `vite.config.ts`
- **Plugin** `react()`: Uses SWC (`@vitejs/plugin-react-swc`) for faster compiling.
- **Plugin** `VitePWA()`:
  - `registerType: 'prompt'`: Prompts user before updating the service worker (via `<PWAUpdatePrompt>`).
  - `workbox`: Configures resource caching with `runtimeCaching` rules for API, medications, symptoms, images, and fonts.
  - `manifest`: Sets Android/iOS icons, `theme_color: '#0289C8'`, `display: 'standalone'`, `orientation: 'portrait-primary'`.
- **Build Configurations**:
  - `chunkSizeWarningLimit: 1000`: Increased from default because React+Supabase bundles are large.
  - `rollupOptions`: Uses a custom `manualChunks` object to split the bundle for performance:
    - `vendor-react`: react, react-dom, react-router-dom
    - `vendor-query`: @tanstack/react-query
    - `ui-radix`: @radix-ui components (avatar, dialog, dropdown-menu, popover, select, tabs, toast)
    - `ui-utils`: lucide-react, class-variance-authority, clsx, tailwind-merge
    - `vendor-supabase`: @supabase/supabase-js, @supabase/auth-helpers-react
  - `terserOptions`: Aggressive minification (`drop_console: true`, `drop_debugger: true`, `pure_funcs: ['console.log', 'console.info']`).
  - Also includes `lovable-tagger` plugin (`componentTagger()`) in development mode only.

### 2.2 `tailwind.config.ts`
- Modifies the base Tailwind theme using `shadcn/ui` variable syntax (`hsl(var(--primary))`).
- **Custom Animations**:
  - `accordion-down` / `accordion-up`: Uses `radix-accordion-content-height` for smooth expanding.
  - `fade-in`, `fade-up`, `scale-in`: Opacity/transform transitions for page load effects.
  - `float`, `pulse-subtle`: Infinite loop micro-animations for interactive elements.
  - `aurora`: A 60s linear infinite animation for background gradient effects.
  - `marquee-left` / `marquee-right`: Scrolling carousel animations.
  - `shine-pulse`: Background-position shift for shimmer/shine effects.
- **Custom Colors**: Defines a `pharma` color scale (50-950) based on sky-blue shades.
- **Custom BoxShadows**: `neo` (neumorphism), `neo-pressed`, `glass` (glassmorphism).
- **Plugins**: Includes `tailwindcss-animate` for stagger effects and a custom `addVariablesForColors` plugin that injects all Tailwind colors as CSS custom properties.

### 2.3 `tsconfig.json` & `tsconfig.app.json` & `tsconfig.node.json`
- Uses project references pattern: `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`.
- `module`: "nodenext", `moduleResolution`: "nodenext".
- `paths`: Defines `@/*` as `'./src/*'` (used across all imports for clean code).
- **Strict mode is NOT fully enabled**: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedParameters: false`, `noUnusedLocals: false`. This relaxed config allows faster development at the cost of type safety.

### 2.4 `netlify.toml`
- **[build]**: Command is `npm run build`, output dir is `dist/`.
- **[[edge_functions]]**: Maps `seo-canonical` function to `/drug/*` only. (The `/symptom-checker` canonical is handled via static headers, NOT the edge function).
- **[[redirects]]** block:
  - Forces HTTPS (`force = true`, 301 redirect).
  - Trailing slash removal (`from = "/drug/*/", to = "/drug/:splat", status = 301`).
  - SPA Fallback (`from = "/*", to = "/index.html", status = 200`). **Critical** for React Router to handle deep links.
- **[[headers]]** block:
  - JS/CSS files (`/*.js`, `/*.css`) given `Cache-Control: public, max-age=31536000, immutable`.
  - Images (`/*.png`, `/*.jpg`, `/*.webp`) given `Cache-Control: public, max-age=31536000, immutable`.
  - Fonts (`/*.woff2`) given `Cache-Control: public, max-age=31536000, immutable`.
  - Service worker (`service-worker.js`) given `Cache-Control: public, max-age=0, must-revalidate`.
  - Sitemaps (`/sitemap*.xml`) given `Content-Type: application/xml; charset=utf-8` and 1-hour cache.
  - Security headers on ALL paths (`/*`): X-Content-Type-Options, X-Frame-Options (DENY), X-XSS-Protection, HSTS (31536000s), Referrer-Policy (strict-origin-when-cross-origin).
  - Content Security Policy (CSP): Uses `default-src 'self'` allowing: Google Tag Manager/Analytics, Cloudflare Turnstile (challenges.cloudflare.com), Supabase (*.supabase.co), Sentry, NLM (wsearch.nlm.nih.gov), Google Fonts, and blob:/data: for images/workers.

---

## 3. FRONTEND ENTRY POINT (`main.tsx` & `App.tsx`)

### 3.1 `src/main.tsx` (The Bootstrapper)
- Captures `appStartTime = performance.now()` before React initializes.
- **Sentry Initialization**:
  - Activated if `VITE_SENTRY_DSN` exists.
  - Integrates `browserTracingIntegration` and `replayIntegration`.
  - `maskAllText: true` (privacy measure to not record patient PII in session replay).
  - `blockAllMedia: true` (prevents recording uploaded pill images).
- Captures custom metrics locally (`bundle_parse_ms`) and logs to Sentry metrics API.
- Mounts `<BrowserRouter>` and `<ThemeProvider>` wrapping the `<App />`.

### 3.2 `src/App.tsx` (The Global Shell)
- **Hooks executed on mount**:
  - `useOfflineDetection()`: Attaches `offline`/`online` event listeners. Modifies toast state when network drops.
  - `playAppAccessSound()`: Triggered once, silent fallback if browser policies block auto-play.
- **Providers wrapped around the app**:
  - `<HelmetProvider>` for SEO head manipulation per-page.
  - `<QueryClientProvider>` for Tanstack Query server caching.
  - `<TooltipProvider>` from Radix.
- **PWA Components**: `<PWAUpdatePrompt>` and `<PWAInstallPrompt>` sit above the router but outside standard layout so they persist across routes.
- **Router Configuration**:
  - Wraps all routes in `Suspense` passing `<PageLoadingSkeleton />`.
  - *Micro-Detail*: The skeleton uses Tailwind `animate-pulse` with `min-h-screen bg-background` and renders a nav bar skeleton, content area, and multiple shimmer rectangles to prevent Layout Shift.
- **Bottom Navigation**: `<BottomNavigation />` rendered outside `<Routes>` but inside the flex container so it sticks to the bottom.

---

## 4. GLOBAL CONTEXT & SUBSCRIPTION LOGIC

### 4.1 `src/config/subscription.config.ts`
Central truth source for numbers and logic constants:
- `IDENTIFICATION_LIMITS`:
  - `FREE`: 1 map to actual monthly usage.
  - `LITE`: 39 maps to `lite` plan rows in DB.
  - `PRO`: 101 maps to `pro` plan rows.
  - `UNLIMITED`: -1, applied logic when returning from `getMonthlyLimit()`.
- `FREE_CLAIM_LIMITS`: `DAILY_CLAIMS: 5`, `TOKEN_EXPIRY_MINUTES: 10`.
- `getSpecialAccessEmails()`: Splices `VITE_SPECIAL_ACCESS_EMAILS` into an array, returns boolean via `hasSpecialAccess(email)`.

### 4.2 `src/hooks/useSubscription.tsx` (The Brain of Usage Tracking)
This is a massive 1090+ line hook responsible for reconciling database logic with local UI state.
- **Dependencies**: `useState`, `useEffect`, Supabase Client, `useAuthStatus`, `use-toast`, `database.types`, and imports from `subscription.config`.
- **State Properties**: `currentSubscription`, `loading`, `availablePlans`, `usageStats` (with `identificationsUsed`, `identificationsRemaining`, `databaseSearchesUsed`, `databaseSearchesRemaining`, `monthlyLimit`, `planName`), `profileIdentificationsUsed`, `extraIdentifications`.
- **Function: `fetchProfileUsage()`**
  - Fetches from `profiles` table.
  - **CRITICAL LOGIC**: "Monthly Reset". It checks `last_reset_date`. If `new Date() > last_reset_date + 30 days`:
    - Resets `identifications_used` to 0.
    - Updates `last_reset_date` to `new Date()`.
    - Preserves `extra_identifications` (bonus carries over!).
- **Function: `fetchCurrentSubscription()`**
  - Queries `user_subscriptions` where `status = 'active'`.
  - Checks if `ends_at` is in the past. If true → marks status inactive in UI immediately, avoiding the latency of the cron job `check-expired-subscriptions`.
- **Function: `calculateUsageStats()`**
  - Logic: Total limit = `monthly_limit + extra_identifications`.
  - Used = `identifications_used`.
  - `canPerformIdentification` boolean = true if `Total Limit == -1` OR `Used < Total Limit`.
- **Function: `reconcileBonusIdentifications()`**
  - Failsafe. If somehow `identifications_used > monthly_limit` (happens if someone downgrades from Pro to Free mid-month), it forces used down to the limit and subtracts the difference from `extra_identifications`, preventing "debt".
- **Realtime Listener**: Uses `supabase.channel('custom-filter-channel')` on `postgres_changes`. If user buys a top-up pack in another tab or Razorpay webhook fires, this hook instantly updates React state without refresh.

### 4.3 `src/hooks/usePaymentStatus.tsx`
- Used purely for the post-checkout screen (`PaymentResult.tsx`).
- Takes a `txn_id` query param.
- **Polling Logic**: `setInterval` every 3 seconds it hits `supabase.from('payment_transactions')` or `topup_transactions`.
- If status transitions from `pending` -> `success`, it stops polling, triggers `PurchaseSuccessConfetti`, and calls `fetchProfileUsage()` in the `useSubscription` context to update the UI instantly.

# PHARMALENS: THE ULTIMATE SYSTEM BLUEPRINT (PART 2)
> **UI Architecture: Pages, Components, and Interaction Flows**

This section breaks down the React component tree, detailing props, local state, effects, and the precise DOM structure / tailwind classes that power the major features.

---

## 5. THE CORE ENGINE: `src/pages/DrugIdentify.tsx` 

This is the most complex page (72KB) acting as the orchestrator for the AI vision pipeline.

### 5.1 Local State & Refs
- `image`: string | null (Base64 of the uploaded/captured pill image).
- `isAnalyzing`: boolean (Locks the UI, shows the processing overlay).
- `result`: DrugData | null (The final structured output from Edge Functions).
- `error`: string | null (Displayed via Sonner toast).
- `analysisMode`: 'standard' | 'enhanced' (Toggled via UI switch).
- `blurryMode`: boolean (Manual override for low-quality images).
- `processingStage`: string (e.g., "Vision OCR Pipeline...", "Cross-referencing databases...").
- `processingProgress`: number (0-100, smoothly interpolated for the progress bar).
- `processingStages`: string[] (Historical log of all stages hit during the analysis RPC).
- `fileInputRef`: React.RefObject<HTMLInputElement> (Hidden input for the `upload` button).

### 5.2 The Upload & Capture Logic
- **`handleImageUpload(e: React.ChangeEvent<HTMLInputElement>)`**:
  - Triggers when file selected.
  - Validates `file.type.startsWith('image/')`.
  - Converts via `FileReader` to base64.
  - Resizes/Compresses using an internal canvas utility if `file.size > 2MB` to prevent Payload Too Large errors (Vercel/Netlify limits).
  - Calls `checkImageQuality(base64)`: If height < 400px or size < 50KB, auto-enables `blurryMode`.
  - Sets `image` state, immediately invokes `processImage(base64)`.

- **WebRTC Camera (`<CameraCapture onCapture={processImage} />`)**:
  - Uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`.
  - Renders `<video autoPlay playsInline />`.
  - On "Snap", draws video frame to `<canvas>`, extracts `toDataURL('image/jpeg', 0.8)`.

### 5.3 `processImage(base64)` Execution Flow
1. **Pre-flight Checks**:
   - `checkOnlineStatus('Drug Identification')` → throws if offline.
   - Awaits `fetchProfileUsage()` to ensure local usage state matches DB precisely before spending a credit.
   - `canPerformIdentification()` → Returns false if `used >= limit` and no `extra_identifications` left.
   - If user is a Guest (no JWT), checks `GUEST_LIMITS.IDENTIFICATIONS` in `localStorage`.
2. **History Matching (The Fast Path)**:
   - Base64 is hashed into a 16x16 perceptual grayscale string by `extractImageFeatures()`.
   - Iterates `historyData` from `manage-drug-history`.
   - Calls `calculateSimilarity(hash1, hash2)`. Using Levenshtein distance on the hash strings.
   - If similarity >= `0.85` AND age < 30 days → Returns immediately. Sets `result`, shows toast "Matched from your history. No credit used."
3. **Edge Function Invocation**:
   - Updates `processingStage` to "Initializing AI Engine...". Starts a `setInterval` to slowly increment `processingProgress` up to 90%.
   - Prepares payload: `{ imageBase64, options: { mode: analysisMode, useCache: true, blurryMode, deviceId: fingerprint } }`.
   - Invokes: `supabase.functions.invoke(analysisMode === 'enhanced' ? 'enhanced-drug-identify' : 'standard-drug-identify', { body: payload })`.
4. **Response Handling**:
   - Clears interval. Pushes `progress` to 100%.
   - If `error`, checks for `isRateLimitError`. If True, logs to Sentry metric `pharmalens.identification.ratelimit` and shows specific warning toast.
   - On Success:
     - Formats result into `DrugData` interface.
     - Automatically calls `supabase.rpc('increment_extra_identifications', { p_amount: -1 })` if plan limit reached but bonus exists. OR calls standard usage increment.
     - Hits `manage-drug-history` with `action='addIdentification'` to save.
     - Calls `playDrugIdentificationSound()` (a subtle chime from `audioService.ts`).
     - Sets `result` state to render `<DrugDetails />`.

---

## 6. KEY UI COMPONENTS DEEP DIVE

### 6.1 `<DrugDetails result={result} onReset={clear} />` (24KB)
- **Props**: Receives the massive `DrugData` object.
- **Render Sections**:
  1. **Header**: Name, Generic Name, Confidence Badge (`High/Medium/Low`). If `Low`, shows a Radix `AlertTriangle` icon.
  2. **Janaushadhi Banner**: Triggers if `result.janaushadhiAlternative.found`. Renders a distinct `<Card>` with a green gradient `bg-gradient-to-r from-green-50 to-emerald-50` showing the generic alternative and calculated `mrp` savings percentage.
  3. **Tabs (`<Tabs defaultValue="info">`)**:
     - **Info Tab**: Description, Manufacturer, Category. Uses a grid layout `grid-cols-2`.
     - **Dosage Tab**: Strength, Form, Admin Instructions.
     - **Safety Tab**: Renders `Accordion` components for Side Effects, Warnings, and Interactions. Map loops `sideEffects.map(...)` rendering `<li>` tags with CheckCircle/XCircle Lucide icons depending on severity.
  4. **AI Processing Log**: A small expandable `<details>` tag at the bottom showing `processingTime` (e.g., "AI processing took 4.2s") and the `processingStages` array injected by the Edge Function to show transparency ("Vision matched", "Cache miss", "Knowledge enhanced").

### 6.2 `<SubscriptionManager />` (32KB)
- **Props**: None. It reads entirely from `useSubscription()` hook.
- **State**: `billingCycle` ('monthly' | 'yearly'), `selectedPlan` (string).
- **Sections**:
  1. **Current Plan Card**: Shows `profileIdentificationsUsed` / `Total Limit`. Renders a `<Progress value={percentage} />`. If `percentage > 90`, progress bar turns `bg-red-500`.
  2. **Plan Toggle**: A horizontal `<Tabs>` to switch pricing display between Monthly and Yearly. Modifies local `billingCycle` state, multiplying prices by `12 * 0.8` (20% discount logic).
  3. **Plan Grid**: Maps over `availablePlans` array fetched from DB. Renders a pricing card for each. 
     - Active plan gets a blue glowing border: `ring-2 ring-primary ring-offset-2`.
     - Button states: "Current Plan" (disabled), "Upgrade" (calls `<PaymentButton>`), "Downgrade" (Contact support logic).
  4. **Top-Up Packs (`<IdentificationPacks />`)**: Renders below subscriptions. Allows one-time purchases of +10, +50, +100 identifications that *never expire* (saved as `extra_identifications`).

### 6.3 `<PaymentButton planId={id} amount={price} />` (23KB)
- The bridge between React and Razorpay window object.
- **Dependencies**: Native window `.Razorpay` constructor. `usePaymentStatus` hook.
- **`handlePayment()`**:
  - Validates `userId` and `amount > 0`.
  - Calls `supabase.functions.invoke('razorpay-order', { body: { amount, planId, type: 'subscription' } })`.
  - Receives `order_id` and `key_id`.
  - Configures options object:
    ```javascript
    const options = {
      key: key_id,
      amount: amountInPaise,
      currency: "INR",
      name: "PharmaLens",
      description: `Subscription: ${planId}`,
      order_id: order_id,
      handler: function(response) {
         // Redirects mapping window.location.href = `/payment-result?txn_id=${txn_id}`
      },
      theme: { color: "#2563ea" }
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
    ```

### 6.4 `<FreeClaimButton />` (13KB)
- **Dependencies**: `@fingerprintjs/fingerprintjs`
- **UI Element**: An animated shimmering button `bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse` labeled "Watch Ad, Get 1 Free Scan".
- **Interaction Flow**:
  1. Click triggers `FingerprintJS.load().then(fp => fp.get())` to obtain `visitorId`.
  2. Shows spinner "Generating link...".
  3. POSTs to `gplinks-claim` with `{ action: 'generate', deviceId }`.
  4. Edge function returns a `shortUrl` and `provider` name.
  5. Opens `window.open(shortUrl, '_blank')`.
  6. Button state changes to "Waiting for verification..." (Sets an interval polling `gplinks-claim` with `{ action: 'status' }`).
  7. If verification succeeds in the background (user traversed the ad URL), interval stops, toast fires "You earned +1 free identification!", and `useSubscription` state updates immediately using `profile` table websocket subscription.

### 6.5 Secondary Feature Pages
- **`<DrugInteractionChecker />`**: Allows selecting up to 5 drugs via a multi-combobox. Posts the array to `analyze-interactions` edge function. Renders severity matrices (Red = High Risk, Yellow = Moderate, Green = Safe).
- **`<SymptomChecker />`**: Text area input for symptoms. AI edge function maps symptoms -> potential OTC drugs -> `search_drugs_by_name()` local database -> returns matches. Displays Medical Disclaimer banner prominently (`<Alert variant="destructive">`).
- **`<DrugDirectory />`**: Available at `/drugs`. Renders the drug list with pagination. Clicking a drug navigates to `/drug/:id`.

---

## 7. GLOBAL UI WRAPPERS

### `<Header />` (24KB)
- Positioned `sticky top-0 z-50` with a glassmorphism effect `backdrop-blur-md bg-background/80`.
- **Left**: Logo (navigates to `/`).
- **Center**: Desktop navigation links (`/identify`, `/search`, `/drug-interactions`).
- **Right**:
  - Search Icon: Expands into full width `<SearchBar />` on mobile.
  - Theme Toggle: Standard moon/sun icon tied to `next-themes` `setTheme`.
  - Profile Dropdown (if auth'd): Avatar, Name, Email, "Subscription" link, "Logout" button.
  - Login Button (if unauth'd).

### `<BottomNavigation />` (4KB)
- Renders only on screens `< 768px`. Fixed bottom `fixed bottom-0 w-full z-50`.
- 4 Icons: Home, Identify (center floating FAB with primary color), Search, Profile.
- Reads `window.location.pathname` to apply active styles `text-primary`.

### `<ErrorBoundary />` & `<ErrorHandler />` (16KB total)
- Catches unhandled React render exceptions.
- Logs exception to `@sentry/react` via `Sentry.captureException(error, { tags: { boundary: 'Global' } })`.
- Renders a clean "Something went wrong" fallback UI with a "Try Again" (forces `window.location.reload()`) button, ensuring the app never white-screens completely.
# PHARMALENS: THE ULTIMATE SYSTEM BLUEPRINT (PART 3)
> **Database Schema, Remote Procedure Calls (RPCs), and the AI Vision Pipeline**

This section outlines every Postgres table, column, custom SQL function, and the microscopic architecture of the two main Supabase Edge Functions (`standard-drug-identify` and `enhanced-drug-identify`).

---

## 8. SUPABASE DATABASE SCHEMA (The Brain's Memory)

The Supabase project contains 11 core tables built through 19 chronological migrations. Row Level Security (RLS) is strictly enforced on all tables.

### 8.1 Active Tables & Columns

1. **`profiles`**
   - **Purpose**: Extends Supabase auth.users with app-specific usage data.
   - **Columns**: `id` PKEY (refs auth.users), `created_at`, `updated_at`, `identifications_used` (int), `last_reset_date` (timestamptz), `extra_identifications` (int, for bonus packs), `monthly_identifications` (int), `subscription_status` (enum: 'free', 'premium'), `subscription_plan` (text).
   - **RLS**: User can SELECT/UPDATE their own row. Edge functions update it using service_role.

2. **`subscription_plans`**
   - **Purpose**: Hardcoded tier pricing and features.
   - **Columns**: `id` PKEY, `name`, `description`, `price` (numeric), `currency` (char3), `billing_period` (enum), `features` (jsonb array), `is_active` (boolean), `monthly_identifications` (int).
   - **RLS**: SELECT for all authenticated users. Blocked for UPDATE/DELETE.

3. **`user_subscriptions`**
   - **Purpose**: Tracks currently active plan per user.
   - **Columns**: `id` PKEY, `user_id` FKEY, `plan_id` FKEY, `status` (enum: 'active', 'inactive', 'canceled', 'expired'), `starts_at`, `ends_at`, `canceled_at`.
   - **RLS**: SELECT user's own row.

4. **`subscription_history` & `payment_transactions` & `topup_transactions`**
   - **Purpose**: Audit trails for Razorpay transactions.
   - **Columns (`payment_transactions`)**: `transaction_id` PKEY, `user_id` FKEY, `plan_id` FKEY, `amount`, `currency`, `status` ('pending', 'success', 'failed'), `payment_method` ('razorpay'), `razorpay_order_id`, `razorpay_payment_id`, `razorpay_response` (jsonb).
   - **RLS**: INSERT by user (creates pending order), UPDATE only by `razorpay-webhook` edge function (service_role).

5. **`drug_cache`**
   - **Purpose**: Stores costly AI generations to save tokens on duplicate scans worldwide.
   - **Columns**: `id` PKEY, `drug_name` (text, unique constraint), `generic_name` (text), `details` (jsonb) -> The massive `DrugData` struct, `created_at`, `expires_at` (180 days out), `search_count` (int), `completeness_score` (int 1-100).
   - **RLS**: SELECT for all users. INSERT only by Edge Function (`manual-cache-save` or internal orchestrator).

6. **`local_drugs` & `janaushadhi_drugs`**
   - **Purpose**: Imported CSV dataset of 100k+ Indian medications.
   - **Columns (`local_drugs`)**: `id` PKEY, `drug_name` (text), `generic_name` (text), `manufacturer`, `category`, `strength`, `dosage_form`, `mrp` (numeric), `pack_size`.
   - **Indexes**: GIN/GiST indexes on `drug_name` and `generic_name` for ultra-fast text search (`similarity()` and `to_tsvector()`).

7. **`drug_identifications`**
   - **Purpose**: User's personal scan history. Max 10 per user.
   - **Columns**: `id` PKEY, `user_id` FKEY, `drug_name` (text), `details` (jsonb), `image_features` (text, 16x16 hash), `created_at`.
   - **RLS**: SELECT/DELETE own rows.

8. **`free_claim_tokens`**
   - **Purpose**: Tracks active Exe.io/GPLinks ad reward sessions.
   - **Columns**: `id` PKEY, `user_id` FKEY, `token` (uuid), `status` ('pending', 'claimed', 'expired'), `short_url`, `expires_at`, `ip_address` (text), `device_id` (text), `claimed_at`.

### 8.2 Custom Postgres RPCs (Remote Procedure Calls)

- **`search_drugs_by_name(search_name, similarity_threshold DEFAULT 0.3)`**
  Uses `pg_trgm` extension. Executes a fuzzy matched SELECT on `local_drugs`.
  ```sql
  SELECT *, similarity(drug_name, search_name) as sim 
  FROM local_drugs 
  WHERE drug_name % search_name OR generic_name % search_name 
  ORDER BY sim DESC LIMIT 5;
  ```
- **`increment_extra_identifications(p_user_id UUID, p_amount INT)`**
  Thread-safe atomic increment for bonus packs or claim rewards without race conditions.
  ```sql
  UPDATE profiles 
  SET extra_identifications = extra_identifications + p_amount 
  WHERE id = p_user_id;
  ```
- **`check_claim_eligibility(p_user_id, p_ip_address, p_device_id, p_limit)`**
  The "Triple-Layer Abuse Preventer". Returns a boolean `eligible`.
  1. Counts claims today by `user_id` (Max 5)
  2. Counts claims today by `ip_address` (Max 5)
  3. Counts claims today by `device_id` (Max 5)
  If any > limit, `eligible = false`.

---

## 9. EDGE FUNCTIONS: THE AI VISION PIPELINE (`enhanced-drug-identify`)

This is the crown jewel of PharmaLens. Written in Deno, invoked via POST `/functions/v1/enhanced-drug-identify`.

### 9.1 Payload & Pre-flight
- **Request Body**: `{ imageBase64, options: { mode, useCache, blurryMode, deviceId } }`
- **Pre-flight Checks**:
  1. Header Validation: JWT check. Verify user subscription plan + extra_identifications via direct Admin DB call. Block if limit exceeded (hard limit on backend, preventing frontend bypass).
  2. Instantiate OpenRouter API client (Gemini 2.5 Flash Lite is hardcoded model target due to cost/speed ratio).

### 9.2 Stage 1: Advanced OCR (The "Eagle Eye")
- Uses `performCriticalVisionAnalysis()` from `_shared/critical-vision-analysis.ts`.
- **System Prompt**: "You are an elite expert in pharmaceutical packaging analysis. Your task is to extract every visible letter, number, barcode, or logo from this image, ignoring glare, blur, or wrapper damage."
- **Response Shape**:
  ```typescript
  {
    extractedText: string,
    drugNameCandidate: string,
    genericNameCandidate: string,
    manufacturerCandidate: string,
    strengthCandidate: string,
    imageQuality: 'high' | 'medium' | 'low' | 'unreadable',
    imageChallenges: string[], // e.g., ['glare', 'torn_blister'],
    confidenceScore: number // 1-100
  }
  ```
- **Failsafe**: If `imageQuality === 'unreadable'`, throws immediately returning `retakeNeeded: true` to the UI with `retakeTips`.

### 9.3 Stage 2: Intelligent Enrichment (The "Brain")
- Take `drugNameCandidate`. Use `cleanText()` to strip special chars.
- **Cache Check**: Exact match in `drug_cache`? Yes -> Return cached `details`.
- **Database Search**: Call RPC `search_drugs_by_name()`.
- **AI Validation**: Call AI with `aiCompareDrugNames(candidate, dbResult)` to verify they aren't totally different medicines that sound alike (e.g., "Zyrtec" vs "Zantac").
- **Completeness Check**: If the resulting object has missing properties (e.g., blank sideEffects), mark for Stage 2.5.

### 9.4 Stage 2.5: Intelligent Web Search (The "Researcher")
- If DB fails or data is <70% complete (missing description/interactions).
- `performIntelligentWebSearch(drugName)`:
  - Fetches external APIs (like NLM RxNorm or structured scraped targets).
  - Normalizes external data.

### 9.5 Stage 3: Clinical Knowledge Enhancement (The "Expert")
- OpenRouter API called again with prompt: "You are a Senior Clinical Pharmacist with 20 years of experience. A user has scanned ${drugName}. Here is the structured data we have so far: ${JSON.stringify(partialData)}. Your job is to fill in the missing null fields specifically for a 5th-grade reading level patient."
- AI returns JSON mapping exactly to the `DrugData` interface.
  - Generates specific warnings: `alcoholWarning`, `pregnancyWarning`, `breastfeedingWarning`, etc.
  - Wraps complex terms: "Antipyretic (fever reducer)".

### 9.6 Stage 4: Janaushadhi Matcher (The "Saver")
- Take `completedData.genericName`.
- Run against `janaushadhi_drugs` table using ILIKE match on active ingredients.
- If generic equivalent found, calculate `Savings = ((Brand MRP - Generic MRP) / Brand MRP) * 100`.
- Attach `janaushadhiAlternative` object to response.

### 9.7 Post-flight & Cleanup
- Return final `{ success: true, data: DrugData, processingStages, confidence }`.
- Note: The Edge Function DOES NOT deduct credits! It only verifies. The frontend `useSubscription` hook fires the usage increment RPC upon receiving `success=true`. This allows the UI to handle fallback gracefully if the AI fails without charging the user.

---

## 10. EDGE FUNCTIONS: FAST PIPELINE (`standard-drug-identify`)

- **Primary Difference**: Strips out Web Search and Clinical Knowledge Enhancement to cut down latency from ~6 seconds to ~2 seconds.
- Uses "Thinking" mode exclusively. (OpenRouter Gemini CoT).
- **Prompt Difference**: "EXTRACT ALL DATA FROM IMAGE AT ONCE AND GUESS MISSING FIELDS BASED ON 2024 PHARMA KNOWLEDGE."
- **Use Case**: This is the default mode for Free and Lite tier users. It burns less LLM tokens. Pro tier users default to Enhanced mode.
# PHARMALENS: THE ULTIMATE SYSTEM BLUEPRINT (PART 4)
> **Payment Architecture, Subscription Webhooks, and Ad-Claim Systems**

This section explores the financial and monetization engine, which heavily relies on Razorpay integration, background worker edge functions, and advanced anti-abuse mechanisms.

---

## 11. MONETIZATION AND PAYMENT ENGINE

The entire payment architecture bypasses frontend trust. The UI cannot manually declare a payment successful. 

### 11.1 The Order Generator: `razorpay-order`
- **Path**: `supabase/functions/razorpay-order/index.ts` (279 lines)
- **Role**: Securely creates an unmodifiable intent ID (OrderId) on Razorpay's Indian servers.
- **Request Body**:
  - Subscription: `{ planId, userId, userEmail, userName, amount, billingCycle, type: 'subscription' }`
  - Top-Up Pack: `{ amount, currency, receipt, notes: { user_id, pack_id, identifications_count, type, transaction_id }, type: 'topup' }`
- **Execution Flow**:
  1. Validates `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
  2. Ensures `amount > 0` and is a valid number.
  3. Utility `toPaise(amount)` multiplies by 100 because Razorpay expects the smallest currency unit.
  4. Generates a random internal `txnid`: e.g. `TXN_1690000_a2b3c4`.
  5. `fetch('https://api.razorpay.com/v1/orders', { method: 'POST' })` with Basic Auth encoding the key:secret.
  6. **DB Insertion**: Upon receiving the Order ID, creates a row in `payment_transactions` with `status: 'pending'` and `razorpay_order_id`. This links the internal ID to Razorpay's.
  7. **Return**: `{ key, order_id, amount, currency, callback_url, transaction_id }`. The frontend injects this directly into the Razorpay Checkout Modal script.

### 11.2 The Webhook Listener: `razorpay-webhook`
- **Path**: `supabase/functions/razorpay-webhook/index.ts` (427 lines)
- **Role**: Razorpay's servers POST to this endpoint when a user successfully enters their OTP/UPI pin and funds clear.
- **Security Check**: `verifySignature()`
  - Reads the `x-razorpay-signature` header.
  - Takes `crypto.subtle.importKey()` using the `RAZORPAY_WEBHOOK_SECRET`.
  - Computes `crypto.subtle.sign('HMAC', key, enc.encode(rawBody))`.
  - Verifies exact string match. If false, `status: 400 'Invalid signature'`.
- **Event Parsing**:
  - `payload.event === 'payment.captured'` or `'order.paid'` -> status = 'success'.
  - `payload.event === 'payment.failed'` -> status = 'failed'.
- **The Split Flow**:
  - Looks up the `razorpay_order_id` in `payment_transactions`. If found, it's a subscription. If not, looks in `topup_transactions`.
  - Updates the found transaction row: `status='success'`, `razorpay_payment_id=payment.entity.id`, `razorpay_response=payload`.
- **Top-Up Success (`updateTopUpPurchase()`)**:
  - Inserts row into `user_identification_purchases`.
  - Triggers RPC `increment_extra_identifications({ p_user_id: user_id, p_amount: identifications_count })`.
- **Subscription Success (`updateSubscriptionStatus()`)**:
  - Calculates `ends_at` via date manipulation (yearly = +1 year, weekly = +7 days, monthly = +1 month).
  - Deactivates *all existing* active subscriptions via UPDATE `status='inactive'` where `user_id = X` and `status='active'`.
  - Inserts new active row into `user_subscriptions`.
  - Inserts row into `subscription_history` for audit logs.

### 11.3 The Frontend Poller: `verify-payment`
Why does this exist when webhooks handle the DB? Because webhooks can arrive 2-10 seconds AFTER a user closes the modal. The user lands on `/payment-result?txn_id=XYZ`.
- UI polls `verify-payment` with `txn_id` every 3 seconds.
- `verify-payment` simply queries `payment_transactions` / `topup_transactions`. If `status === 'success'`, it returns true. The UI drops the "Processing..." spinner and fires Confetti.

---

## 12. FREE AD-BASED REWARD SYSTEM

For users who cannot afford subscriptions in Tier-2/Tier-3 cities, PharmaLens offers free identifications via URL Shortener ad networks.

### 12.1 The Provider Round-Robin
- **Path**: `supabase/functions/gplinks-claim/index.ts` (396 lines)
- URL shorteners shadow-ban IP addresses that view >2 ads per day. To ensure users can claim exactly 5 per day, the function rotates API providers based on the user's current claim count:
  - **Claim 1**: `gplinks` (`https://api.gplinks.com/api`)
  - **Claim 2, 3**: `exeio` (`https://exe.io/api`)
  - **Claim 4, 5**: `shrinkme` (`https://shrinkme.io/api`)
- Each provider has a different response shape. The `PROVIDERS` dictionary maps `parseResponse` logic to normalize `{ success, shortUrl, error }`.

### 12.2 TRIPLE-LAYER ABUSE PREVENTION
Ad networks pay per view. If users spam links, PharmaLens gets banned.
1. The Edge Function extracts client IP via `req.headers.get("x-forwarded-for")?.split(",")[0]` or `cf-connecting-ip` (Netlify populates these).
2. The UI sends `deviceId` via `FingerprintJS`.
3. Calls RPC: `check_claim_eligibility(user_id, ip_address, device_id, limit)`.
   - The RPC checks `free_claim_tokens` where `created_at > NOW() - interval '24 hours'`.
   - If `count(where user_id) >= 5` OR `count(where ip_address) >= 5` OR `count(where device_id) >= 5` -> DENIED.
   - Prevents users making 10 accounts on the same phone. Prevents bot farms on the same IP.

### 12.3 Generating the Ad Token
- Generates a UUID token. `expiresAt = NOW + 10 minutes`.
- Calls the Provider API with `callbackUrl = https://pharmalens.tech/claim-callback/TOKEN`.
- Saves to `free_claim_tokens` with `status='pending'`.
- UI opens the `shortUrl` in a new tab. Note: Most UI browsers block `window.open` unless it's a direct user click. The button must synchronously wrap the Promise.

### 12.4 Verifying the Ad Token
- When user clicks through 3 pages of ads, they land on `/claim-callback/{token}`.
- Trigger: Calls `action: 'verify'` on `gplinks-claim` edge function.
- Queries token. `status` must be 'pending'.
- Fails if `expires_at < new Date()`.
- Updates `status='claimed'`.
- Runs RPC `increment_extra_identifications(user_id, 1)`.
- Updates UI instantly via Supabase realtime sync. User can now click "Identify".

---

## 13. PWA, OFFLINE ARCHITECTURE & MOBILE PACKAGING

### 13.0 Overview

PharmaLens targets Indian rural/semi-urban regions where internet connectivity drops frequently.

### 13.1 Offline Database (`offlineDrugStorage.ts`)
- **Technology**: IndexedDB (via native wrapper, no third-party ORM to save bundle size).
- **Structure**:
  - DB Name: `PharmaLensOfflineDB` (Version 1).
  - Store: `drugs` (KeyPath: `id`).
  - Indexes: `name` (unique: false), `genericName` (unique: false).
- **Initialization**:
  - `initDB()`: Uses `indexedDB.open(dbName, version)`. If `onupgradeneeded` fires, creates objectStore and indexes.
- **Data Ingestion**:
  - The UI component `<OfflineDataSettings />` gives the user a button to "Download Offline Database".
  - It fetches a highly compressed JSON file containing core drug names, generics, and basic use-cases.
  - Inserts into `PharmaLensOfflineDB` using `saveOfflineDrugData()` which uses a readwrite transaction, iterating the array and calling `store.put(drug)`.
- **Search Logic (`searchOfflineDrugs(query)`)**:
  - Opens a readonly transaction.
  - Iterates using `store.openCursor()`.
  - Manual fuzzy matching: `const match = record.name.toLowerCase().includes(q) || record.genericName.toLowerCase().includes(q)`.
  - Returns top 20 results instantly without network overhead.

### 13.2 Network Detection Hook (`useOfflineDetection.ts`)
- Simply mounts `window.addEventListener('online')` and `('offline')`.
- Exposes `isOnline` boolean.
- Exposes `checkOnlineStatus(featureName)`:
  - If `!isOnline`, throws `new Error(\`You are currently offline. \${featureName} requires an internet connection.\`)`.
  - The UI wraps calls in try/catch, showing this message cleanly via `toast.error()`.

### 13.3 PWA Workbox Config (`vite.config.ts`)
- `vite-plugin-pwa` auto-generates the service worker.
- **Runtime Caching Strategies** (5 rules defined in `runtimeCaching`):
  - `api-cache` (NetworkFirst, 7-day expiry, 100 entries): Catches `/api/*` requests.
  - `medications-cache` (CacheFirst, 30-day expiry, 500 entries): Caches Supabase drug data URLs.
  - `symptom-checker-cache` (CacheFirst, 30-day expiry, 200 entries): Caches symptom data.
  - `images-cache` (CacheFirst, 90-day expiry, 200 entries): Caches `.png/.jpg/.jpeg/.svg/.gif/.webp`.
  - `fonts-cache` (CacheFirst, 1-year expiry, 30 entries): Caches `.woff/.woff2/.ttf/.eot`.
- `skipWaiting: true`, `clientsClaim: true`: Ensures new SW activates immediately.
- `maximumFileSizeToCacheInBytes: 10MB`: To handle large bundled assets.
- Two specific components handle updates:
  - `<PWAInstallPrompt>`: Listens to the browser's `beforeinstallprompt` event. If captured, prevents default, stores the event, and renders a floating button "Install App to Home Screen". On click, calls `prompt()` and handles `userChoice`.
  - `<PWAUpdatePrompt>`: Uses `useRegisterSW()` from `virtual:pwa-register/react`. Exposes `needRefresh` boolean. If true, shows a persistent banner "New update available!". Clicking "Reload" triggers `updateServiceWorker(true)`, forcing the new bundle chunks to download.

---

## 14. MOBILE APP PACKAGING (Capacitor)

PharmaLens is published on the Google Play Store using a Capacitor wrapper.

### 14.1 `capacitor.config.json`
- `appId`: `com.himanshu.pharmalens`
- `appName`: PharmaLens
- `webDir`: `dist`
- `server.androidScheme`: `https`
- `android.allowMixedContent`: `true` (permits loading HTTP resources inside the HTTPS WebView).
- Points the native wrapper to the compiled Vite output. A `twa-manifest.json` also exists for Trusted Web Activity compatibility.

### 14.2 Native Plugins
- Camera access inside the app uses the HTML5 `<input type="file" capture="environment">` fallback which the Android WebView naturally intercepts and bridges to the native camera intent.

---

## 15. CACHING & PERFORMANCE OPTIMIZATION

### 15.1 DB Level Caching (`drug_cache` table)
- **Role**: AI generation costs ~$0.005 per image (Gemini Flash Lite via OpenRouter). To minimize costs, successful AI responses are cached.
- **RPC `manual-cache-save`**:
  - The UI "Save result for others" button triggers this edge function.
  - Payload: `{ drugName, genericName, details }`.
  - The DB evaluates `completeness_score`. A simple algorithm checks for missing fields (Side Effects, Warnings, Interactions). If `completeness_score > 80`, it saves it. If `< 50`, it silently drops it (prevents poisoning the cache with bad OCR reads).
- **RPC `clear-bad-cache`**: A cleanup script to purge entries where users reported bad data or AI hallucinated.

### 15.2 Client-Side Caching (Tanstack Query)
- Global `queryClient` is instantiated in `App.tsx` with default settings: `const queryClient = new QueryClient();`
- Individual query hooks may override defaults with custom `staleTime` and `retry` params as needed.

---

## 16. SEO ARCHITECTURE (Search Engine Optimization)

Because standard React SPAs load empty `div#root` elements, crawlers struggle. PharmaLens utilizes several strategies:

### 16.1 `react-helmet-async`
- Every page injects dynamic `<title>` and `<meta name="description">`.
- `<DrugPage>` dynamically constructs: `<title>Uses, Side Effects, and Composition of {drug.name} - PharmaLens</title>`.
- Injects `og:image`, `og:title`, `twitter:card` tags.

### 16.2 JSON-LD Schema Markup
- The `<SchemaMarkup />` component generates `application/ld+json` blocks.
- On Drug pages: `{"@context": "https://schema.org", "@type": "MedicalEntity", "name": drug.name, "code": {"@type": "MedicalCode", "codeValue": drug.id}}`.

### 16.3 Netlify Edge Canonical Generator (`netlify/edge-functions/seo-canonical.ts`)
- To prevent Google from indexing `pharmalens.tech/drug/paracetamol` differently than `www.pharmalens.tech/drug/paracetamol/`, this edge function runs *before* Netlify serves the static HTML.
- Extracts `URL` from HTTP request.
- Appends `Link: <https://pharmalens.tech/drug/ID>; rel="canonical"` to the HTTP Response headers.
- Googlebot reads HTTP headers before parsing JavaScript, ensuring flawless indexing capability.

---

## 17. SECURITY POSTURE SUMMARY

1. **Authentication**: Handled via Supabase JWTs. Sessions persist in `localStorage` via Supabase client singleton.
2. **Access Control**: Strict Row Level Security (RLS) policies. Only service roles (Edge Functions) can alter Subscription tables.
3. **Bot Mitigation**: Cloudflare Turnstile explicitly configured in the `<AuthForm>` so automated scripts cannot spam `auth.signUp()`.
4. **Data Exfiltration Prevention**: Local database tables (`local_drugs`, `janaushadhi_drugs`) are locked behind read-only RLS policies.
5. **Session Replay Privacy**: Sentry `maskAllText: true` masks ALL text on screen to `***` before sending DOM states to servers, entirely obfuscating patient medical data while keeping structural UI bugs visible.
6. **Integrity Checking**: Razorpay signatures verified strictly. `amount` is never trusted from the client payload during webhook—only the payment intent ID is verified.
7. **Free Tier Abuse Limit**: 
   - Uses IP + `deviceId` + `user_id` tri-factor validation in `gplinks-claim`.
   - Free guest limit relies on simple `localStorage` check (intentional tradeoff: easy to bypass but keeps friction zero for new ad-bound users).

---
*End of PharmaLens Technical Architectures Blueprint*

---

## 18. DATABASE DATA DICTIONARY & TYPE DEFINITIONS (Micro-Detail)

To ensure this blueprint is complete enough to rebuild PharmaLens without the repository, this section contains the exact TypeScript interfaces and Postgres schema definitions that bind the frontend and backend together.

### 18.1 Global Application Types (`types/database.types.ts`)

These types map exactly to the Supabase PostgreSQL columns.

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string                    // UUID, References auth.users(id)
          created_at: string            // TimestampTz
          updated_at: string            // TimestampTz
          identifications_used: number  // Int, default 0
          last_reset_date: string       // TimestampTz
          extra_identifications: number // Int, default 0
          monthly_identifications: number // Int, default 1
          subscription_status: string   // 'free' | 'premium'
          subscription_plan: string     // text
        }
        Insert: Omit<Row, 'created_at' | 'updated_at'> // Auto-populated by trigger
        Update: Partial<Insert>
      }
      subscription_plans: {
        Row: {
          id: string                    // text (e.g., 'free-plan', 'pro')
          name: string                  // text
          description: string | null    // text
          price: number                 // numeric (e.g., 299.00)
          currency: string              // char(3), always 'INR'
          billing_period: string        // 'monthly' | 'yearly'
          features: Json                // string array of features
          is_active: boolean            // bool
          monthly_identifications: number // int
        }
        Insert: Omit<Row, 'id'>
        Update: Partial<Insert>
      }
      user_subscriptions: {
        Row: {
          id: string                    // UUID
          user_id: string               // UUID, References auth.users
          plan_id: string               // text, References subscription_plans
          status: string                // 'active' | 'inactive' | 'canceled'
          starts_at: string             // TimestampTz
          ends_at: string               // TimestampTz
          canceled_at: string | null    // TimestampTz
        }
      }
      drug_identifications: {
        Row: {
          id: string                    // UUID
          user_id: string               // UUID, References auth.users
          drug_name: string             // text
          details: Json                 // The massive DrugData object
          image_features: string | null // 16x16 grayscale hash for similarity matching
          created_at: string            // TimestampTz
        }
      }
      drug_cache: {
        Row: {
          id: string                    // UUID
          drug_name: string             // text (UNIQUE constraint)
          generic_name: string | null   // text
          details: Json                 // The massive DrugData object
          search_count: number          // int, default 1
          created_at: string            // TimestampTz
          expires_at: string            // TimestampTz, +180 days from created_at
          completeness_score: number    // int (0-100)
        }
      }
      free_claim_tokens: {
        Row: {
          id: string                    // UUID
          user_id: string               // UUID, References auth.users
          token: string                 // text (UUID stripped of hyphens)
          status: string                // 'pending' | 'claimed' | 'expired'
          short_url: string             // text (e.g., https://gplinks.com/...)
          expires_at: string            // TimestampTz
          ip_address: string            // text
          device_id: string | null      // text
          claimed_at: string | null     // TimestampTz
        }
      }
      local_drugs: {
        Row: {
          id: number                    // BigInt
          drug_name: string             // text
          generic_name: string          // text
          manufacturer: string | null   // text
          category: string              // text ('allopathic', 'ayurvedic', etc)
          strength: string | null       // text
          dosage_form: string | null    // text ('tablet', 'syrup', 'injection')
          mrp: number                   // numeric
          pack_size: string | null      // text
        }
      }
      janaushadhi_drugs: {
        Row: {
          id: number                    // BigInt
          drug_code: string             // text
          generic_name: string          // text
          unit_size: string             // text
          mrp: number                   // numeric
        }
      }
    }
  }
}
```

### 18.2 The Core Interface: `DrugData`

This interface defines exactly what the frontend `<DrugDetails>` component expects to render, and exactly what the AI Edge Functions (`enhanced-drug-identify` / `standard-drug-identify`) must produce.

```typescript
export interface DrugData {
  id: string;                               // Unique identifier (UUID or generated)
  name: string;                             // Brand name (e.g., "Calpol 500")
  genericName?: string;                     // Active ingredient (e.g., "Paracetamol")
  manufacturer?: string;                    // e.g., "GlaxoSmithKline"
  category?: string;                        // e.g., "Analgesic, Antipyretic"
  description?: string;                     // 2-3 sentence layman explanation
  
  // Physical Details
  strength?: string;                        // e.g., "500 mg"
  dosageForm?: string;                      // e.g., "Tablet"
  color?: string;                           // pill color
  shape?: string;                           // pill shape
  imprint?: string;                         // text imprinted on pill
  packSize?: string;                        // e.g., "15 Tablets in a strip"
  
  // Medical Content
  dosageAndAdmin?: string;                  // How to take it
  mechanism?: string;                       // How it works in the body
  sideEffects?: string[];                   // e.g., ["Nausea", "Drowsiness"]
  warnings?: string[];                      // Core warnings
  interactions?: string[];                  // Drug-drug interactions
  indications?: string[];                   // What it's used for
  contraindications?: string[];             // When NOT to use it
  pregnancy?: string;                       // FDA Pregnancy category/explanation
  storage?: string;                         // Storage conditions
  prescriptionStatus?: string;              // "Rx", "OTC"
  
  // Custom Warnings (Stage 3 Knowledge Enhancement)
  alcoholWarning?: string;
  breastfeedingWarning?: string;
  drivingWarning?: string;
  kidneyWarning?: string;
  liverWarning?: string;
  
  // Supply Chain Details
  mfgDate?: string;
  expDate?: string;
  batchNumber?: string;
  mrp?: string;
  manufacturerAddress?: string;
  brandNames?: string[];
  activeIngredients?: string[];
  alternatives?: any[];
  
  // AI Confidence & Status
  confidence?: 'high' | 'medium' | 'low';
  
  // Vision Pipeline Metadata
  imageQuality?: 'high' | 'medium' | 'low' | 'unreadable';
  imageChallenges?: string[];
  retakeNeeded?: boolean;
  retakeTips?: string[];
  
  // Janaushadhi Integration
  janaushadhiAlternative?: {
    found: boolean;
    genericName?: string;
    mrp?: number;
    savings?: number;            // Percentage savings ((Brand - Generic)/Brand)*100
    drugCode?: string;
    strength?: string;
  };
}
```

---

## 19. EXHAUSTIVE API PAYLOAD STRUCTURES

This section documents the exact JSON payloads sent between the Frontend, the Supabase Edge Functions, OpenRouter (Gemini), and Razorpay.

### 19.1 Frontend → `enhanced-drug-identify`

**Endpoint**: `POST /functions/v1/enhanced-drug-identify`
**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer [SUPABASE_JWT]`

**Request Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  "options": {
    "mode": "enhanced",
    "useCache": true,
    "blurryMode": false,
    "deviceId": "f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
  }
}
```

**Edge Function → OpenRouter (Stage 1: Falcon/Eagle Eye prompt)**
```json
{
  "model": "google/gemini-2.5-flash-lite",
  "messages": [
    {
      "role": "system",
      "content": "You are an elite expert in pharmaceutical packaging analysis... [Detailed strict JSON schema requirement]"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": { "url": "data:image/jpeg;base64,/9j/4AAQSk..." }
        }
      ]
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**OpenRouter → Edge Function (Stage 1 Response JSON)**
```json
{
  "extractedText": "CALPOL 500 Paracetamol Tablets IP 500mg GlaxoSmithKline GSK Exp: 12/26 MRP: 15.30",
  "drugNameCandidate": "Calpol",
  "genericNameCandidate": "Paracetamol",
  "manufacturerCandidate": "GlaxoSmithKline",
  "strengthCandidate": "500 mg",
  "imageQuality": "medium",
  "imageChallenges": ["glare on foil", "partial cutoff"],
  "confidenceScore": 95
}
```

**Edge Function → Frontend (Final Success Response)**
```json
{
  "success": true,
  "data": {
    "name": "Calpol",
    "genericName": "Paracetamol",
    "strength": "500 mg",
    "manufacturer": "GlaxoSmithKline",
    "description": "Calpol 500 Tablet is a widely used medicine that helps to ease pain and bring down high body temperatures (fever).",
    "sideEffects": ["Nausea", "Stomach upset", "Rash (rare)"],
    "pregnancy": "Consult your doctor before using during pregnancy.",
    "alcoholWarning": "Taking Paracetamol with alcohol can cause liver damage.",
    "kidneyWarning": "Should be used with caution in patients with kidney disease.",
    "liverWarning": "Use with caution in patients with underlying liver disease.",
    "janaushadhiAlternative": {
      "found": true,
      "genericName": "Paracetamol Tablet IP 500mg",
      "mrp": 3.50,
      "savings": 77.1
    },
    "confidence": "high",
    "imageQuality": "medium",
    "imageChallenges": ["glare on foil"]
  },
  "processingStages": [
    "Loaded image for analysis",
    "Extracted text matching Calpol 500",
    "Found exact match in cache database",
    "Found Janaushadhi alternative (Generic paracetamol)"
  ],
  "processingTime": "1.3s"
}
```

---

### 19.2 Frontend → `razorpay-order`

**Endpoint**: `POST /functions/v1/razorpay-order`

**Subscription Checkout Payload**:
```json
{
  "planId": "pro",
  "userId": "d7a4b8e2-...",
  "userEmail": "customer@example.com",
  "userName": "Rahul D",
  "amount": 299,
  "billingCycle": "monthly",
  "type": "subscription"
}
```

**Edge Function → Razorpay API (Auth: Basic Key:Secret)**
```json
{
  "amount": 29900,
  "currency": "INR",
  "receipt": "TXN_169..._a8b9",
  "notes": {
    "planId": "pro",
    "userId": "d7a4b8e2-...",
    "billingCycle": "monthly"
  },
  "payment_capture": 1
}
```

**Razorpay API → Edge Function (Response)**
```json
{
  "id": "order_KjU2xQdY...",
  "entity": "order",
  "amount": 29900,
  "amount_paid": 0,
  "amount_due": 29900,
  "currency": "INR",
  "receipt": "TXN_169..._a8b9",
  "status": "created",
  "attempts": 0,
  "notes": { "planId": "pro", "userId": "d7a4b8e2-..." },
  "created_at": 1698223400
}
```

**Edge Function → Frontend Response**
```json
{
  "key": "rzp_live_abcdefgh",
  "order_id": "order_KjU2xQdY...",
  "amount": 29900,
  "currency": "INR",
  "callback_url": "https://pharmalens.tech/payment-result",
  "transaction_id": "TXN_169..._a8b9"
}
```

---

---

## 20. ABSOLUTE DATABASE MIGRATIONS TRACE LOG

To reconstruct the database from scratch, here is the chronological application of every database schema change, RLs policy, and index mapping that exists in the `supabase/migrations/` directory.

### Migrations 1-4: The Genesis
- **`20240315000000_initial_schema.sql`**: Created raw auth tables and RLS extensions. 
- **`20240320000000_create_profiles.sql`**:
  - `CREATE TABLE profiles (...)`
  - `CREATE OR REPLACE FUNCTION public.handle_new_user()`
  - `TRIGGER on_auth_user_created`
  - *Logic*: When a user signs up on Supabase Auth, this Postgres trigger automatically creates a row in `profiles` giving them `identifications_used = 0` and `monthly_identifications = 1` (Free Tier).
- **`20240321000000_create_drug_cache.sql`**:
  - `CREATE TABLE drug_cache (...)`
  - Creates the AI Response cache. Added `pg_trgm` extension for text search.
- **`20240322000000_create_local_drugs.sql`**:
  - `CREATE TABLE local_drugs (...)`
  - Added GIN indexes on `drug_name` and `generic_name` for ultra-fast full-text search.

### Migrations 5-8: Usage tracking & RLS
- **`20240401000000_identifications.sql`**:
  - `CREATE TABLE drug_identifications` for user history. 
  - `ALTER TABLE drug_identifications ENABLE ROW LEVEL SECURITY`.
  - Policy: `create policy "Users can insert their own identifications" on drug_identifications for insert with check (auth.uid() = user_id);`
- **`20240402000001_rpc_functions.sql`**:
  - Created `increment_extra_identifications` stored procedure.
- **`20240410000000_janaushadhi_import.sql`**:
  - Created `janaushadhi_drugs` table to hold government data for generic alternatives.
  - Policy: `create policy "Enable read access for all users" on "public"."janaushadhi_drugs" for select using (true);`

### Migrations 9-14: The Billing System
- **`20240501000000_subscription_plans.sql`**:
  - Creates the `subscription_plans` and `user_subscriptions` tables.
- **`20240505000000_payment_transactions.sql`**:
  - `CREATE TABLE payment_transactions` for Razorpay linkage.
- **`20240510000000_topup_packs.sql`**:
  - `CREATE TABLE topup_transactions` and `user_identification_purchases`.
- **`20240515000000_subscription_history.sql`**:
  - Added audit trail table. RLS restricted to only `auth.uid()`.

### Migrations 15-19: Free Ad-Claim System & Anti-Abuse
- **`20240601000000_free_claims.sql`**:
  - `CREATE TABLE free_claim_tokens (id uuid default uuid_generate_v4() primary key, user_id uuid references auth.users not null, token text not null, status text default 'pending', ...ip_address text, device_id text)`
- **`20240605_claim_eligibility_rpc.sql`**:
  - **The God Function**: The most complex SQL procedure in the repository.
  ```sql
  CREATE OR REPLACE FUNCTION public.check_claim_eligibility(
    p_user_id UUID, p_ip_address TEXT, p_device_id TEXT, p_limit INT
  ) RETURNS JSONB AS $$
  DECLARE
    user_count INT;
    ip_count INT;
    device_count INT;
    max_count INT;
    is_eligible BOOLEAN;
  BEGIN
    -- Count today's claims for this user
    SELECT COUNT(*) INTO user_count FROM free_claim_tokens 
    WHERE user_id = p_user_id AND created_at > (NOW() - INTERVAL '24 hours');
    
    -- Count today's claims for this IP
    SELECT COUNT(*) INTO ip_count FROM free_claim_tokens 
    WHERE ip_address = p_ip_address AND created_at > (NOW() - INTERVAL '24 hours');
    
    -- Count today's claims for this device
    SELECT COUNT(*) INTO device_count FROM free_claim_tokens 
    WHERE device_id = p_device_id AND created_at > (NOW() - INTERVAL '24 hours');
    
    max_count := GREATEST(user_count, ip_count, device_count);
    
    IF max_count < p_limit THEN
      is_eligible := TRUE;
      RETURN jsonb_build_object('eligible', true, 'user_count', user_count, 'ip_count', ip_count, 'device_count', device_count);
    ELSE
      is_eligible := FALSE;
      RETURN jsonb_build_object('eligible', false, 'reason', 'Limit exceeded on IP, Device, or User account');
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
  *(Note: `SECURITY DEFINER` lets the function run with admin privileges, bypassing RLS since users cannot natively read other users' IPs)*.

---

## 21. CRITICAL REACT ARCHITECTURE: `main.tsx` vs `App.tsx`

Every byte loaded in the user's browser begins here.

### 21.1 `main.tsx` Bootstrapping Sequence
1. **Performance Hook**: `const appStartTime = performance.now();` captures the absolute zero-millisecond mark.
2. **Sentry Activation**:
   ```typescript
   import * as Sentry from '@sentry/react';
   const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
   if (sentryDsn) {
     Sentry.init({
       dsn: sentryDsn,
       sendDefaultPii: true,
       integrations: [
         Sentry.browserTracingIntegration(),
         Sentry.replayIntegration({
           maskAllText: true,
           blockAllMedia: true,
         }),
       ],
       tracesSampleRate: 0.1,
       replaysSessionSampleRate: 0.0, // No normal session replays (privacy)
       replaysOnErrorSampleRate: 1.0, // 100% of sessions that crash are recorded
       environment: import.meta.env.MODE,
     });
     // Custom Metrics:
     Sentry.metrics.count('pharmalens.app.session_start', 1);
     // Page load timing via Navigation Timing API
     // Bundle parse time via performance.now() delta
   }
   ```
3. **React DOM Rendering** (uses `createRoot`, NOT `ReactDOM.render`):
   ```typescript
   const root = createRoot(document.getElementById("root")!);
   root.render(
     <BrowserRouter future={{ v7_relativeSplatPath: true }}>
       <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
         <App />
         <Toaster position="bottom-right" />
       </ThemeProvider>
     </BrowserRouter>
   );
   ```
   Note: `<Toaster>` is from `sonner` library. Props are minimal: `position="bottom-right"` only. No `richColors`, `closeButton`, or `theme` props.

### 21.2 The `App.tsx` Suspense Router
PharmaLens uses React `lazy()` for code-splitting. `Index` page is NOT lazy-loaded (imported eagerly for instant first paint). All other 22 pages are lazy-loaded.
```typescript
import Index from "./pages/Index";  // Eager import!
import NotFound from "./pages/NotFound";  // Eager import!

// Lazy loaded
const DrugIdentify = lazy(() => import("./pages/DrugIdentify"));
const Profile = lazy(() => import("./pages/Profile"));
const ClaimCallback = lazy(() => import("./pages/ClaimCallback"));
// ... 19 more lazy imports
```
**Important**: There is NO `<RequireAuth>` wrapper in the routing. Profile and subscription pages are accessible via URL directly — authentication gating is handled inside each page component itself via the `useAuthStatus()` hook, not via route-level guards.

**Complete Route Map** (all 22 routes):
- `/` → Index (eager)
- `/identify` → DrugIdentify
- `/search` → SearchResults
- `/drug/:id` → DrugPage
- `/drugs` → DrugDirectory
- `/about` → About
- `/faq` → FAQ
- `/help` → HelpCenter
- `/help/:categoryId` → HelpCategory
- `/help/article/:articleId` → HelpArticlePage
- `/contact` → Contact
- `/privacy` → Privacy
- `/terms` → Terms
- `/disclaimer` → Disclaimer
- `/auth` → Auth
- `/symptom-checker` → SymptomChecker
- `/drug-interactions` → DrugInteractionChecker
- `/profile` → Profile
- `/account-subscription` → AccountSubscriptionPage
- `/payment-result` → PaymentResult
- `/payment-history` → PaymentHistoryPage
- `/subscription` & `/subscription-manager` → SubscriptionManagerPage
- `/blog` → Blog
- `/blog/:slug` → BlogPost
- `/claim-callback/:token` → ClaimCallback
- `*` → NotFound (eager)

---

## 22. EXHAUSTIVE INTERNAL STATE OF CUSTOM HOOKS

PharmaLens relies on 8 custom hooks located in `src/hooks/`.

### 22.1 `useSubscription.tsx` State Machine (Micro-Scale)

This hook is responsible for all gated access to the software. It has exactly 6 distinct state variables.

```typescript
// 1. Core State
const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
const [loading, setLoading] = useState(true);

// 2. Usage Tracking State
const [usageStats, setUsageStats] = useState({
  identificationsUsed: 0,
  identificationsRemaining: IDENTIFICATION_LIMITS.FREE,
  databaseSearchesUsed: 0,
  databaseSearchesRemaining: 10,
  monthlyLimit: IDENTIFICATION_LIMITS.FREE,
  planName: 'Free'
});
const [profileIdentificationsUsed, setProfileIdentificationsUsed] = useState<number>(0);
const [extraIdentifications, setExtraIdentifications] = useState<number>(0);
```

Note: There is NO `isSpecialAccess` state variable. Special access is checked via function call `hasSpecialAccess(user.email)` from `subscription.config.ts` rather than stored in React state.

#### The `reconcileBonusIdentifications` Logic
Why does this exist? Consider a user who buys the "Pro" plan (101 scans) and uses 80 scans. They then decide to cancel, reverting to the "Free" plan (1 scan). Their `identifications_used` is now 80, but their Monthly limit is 1! If they buy a top-up pack of 50 extras, they would mathematically have `1 + 50 - 80 = -29` remaining scans, which breaks the UI.

The reconciler fixes this anomaly instantly on DB fetch:
```typescript
const reconcileBonusIdentifications = async (profileId: string, used: number, monthlyLimit: number, currentBonus: number) => {
  if (monthlyLimit === -1) return; // Unlimited plan, ignore

  if (used > monthlyLimit && currentBonus > 0) {
    const overage = used - monthlyLimit;
    const bonusToDeduct = Math.min(overage, currentBonus);
    
    // Mathematically fix the "debt"
    const newUsed = used - bonusToDeduct;
    const newBonus = currentBonus - bonusToDeduct;
    
    // Save to the database
    await supabase.from('profiles').update({
      identifications_used: newUsed,
      extra_identifications: newBonus
    }).eq('id', profileId);
    
    // Update local React State
    setProfileIdentificationsUsed(newUsed);
    setExtraIdentifications(newBonus);
    console.log(`[SubscriptionManager] Reconciled: Deducted ${bonusToDeduct} from bonus to cover overage.`);
  }
};
```

### 22.2 `useOfflineDrugData.ts` Complete Flow
This hook controls saving and searching offline data via wrapper service.

```typescript
export function useOfflineDrugData() {
  const [offlineDrugs, setOfflineDrugs] = useState<OfflineDrug[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // On Mount: Check if IndexedDB has at least 1 row to set `isReady`
    offlineDrugStorage.getDrugCount().then(count => {
       setIsReady(count > 0);
    });
  }, []);

  const downloadData = async () => {
    setIsDownloading(true);
    try {
      // Step 1: Fetch compressed JSON dictionary from public/data/
      const response = await fetch('/data/core_drugs_minimal.json');
      const data = await response.json();
      
      // Step 2: Stream objects into IndexedDB in chunks to prevent UI lockup
      let savedCount = 0;
      for (let i = 0; i < data.length; i += 500) {
        const chunk = data.slice(i, i + 500);
        await offlineDrugStorage.saveBulk(chunk);
        savedCount += chunk.length;
        setDownloadProgress((savedCount / data.length) * 100);
      }
      
      setIsReady(true);
      toast.success("Offline database downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download offline database.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return { downloadData, isDownloading, downloadProgress, isReady, searchOffline: offlineDrugStorage.searchDrugs };
}
```

---

## 23. ERROR BOUNDARIES & SENTRY CRASH MANAGEMENT

PharmaLens does not permit an unhandled exception to ruin the user experience. The app implements a global `<ErrorBoundary>` standard React class component wrapping the `<Suspense>` tree.

### 23.1 The `ErrorBoundary.tsx` Class
```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import ErrorHandler from "./ErrorHandler";

interface Props { children?: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }; // Update state so next render shows fallback UI.
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
    
    // Explicitly send the React component stack trace to Sentry for debugging
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } }
    });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) return this.props.fallback;
      return <ErrorHandler error={this.state.error} errorInfo={this.state.errorInfo} />;
    }
    return this.props.children;
  }
}
```

### 23.2 `<ErrorHandler />` Fallback UI Component (10KB)
When a JS crash occurs, the ErrorHandler renders a soft, user-friendly UI instead of a blank white screen (the React "White Screen of Death").
It renders:
- A large `LucideAlertTriangle` icon (red text).
- "Something went wrong" heading.
- The actual `error.message` text safely rendered inside a `<pre>` tag.
- A "Reload Application" button running `window.location.reload()`.
- A "Clear App Data" button running `localStorage.clear()` + `sessionStorage.clear()` + `window.location.reload()` as a failsafe nuclear option if corrupted state causes loop crashes.

---

---

## 24. JANAUSHADHI PIPELINE INTEGRATION & SAVINGS CALCULATOR

A critical pillar of PharmaLens mission is directing users to affordable government generic medicines.

### 24.1 The `janaushadhi_drugs` Database Pre-computation
The table is populated via a 200MB CSV import. Because Indian drug generics are notoriously spelled differently (e.g. "Paracetamol" vs "Paracetamol IP"), the DB employs text normalization triggers on insert.

### 24.2 The Exact `calculateSavings()` Algorithm (Backend)
When the Edge Function identifies a drug, it must calculate if the user is being ripped off.
```typescript
interface JnaMatch { genericName: string; mrp: number; unitSize: string; drugCode: string; }

// After Stage 3 (AI Enrichment), the pipeline executes:
function findJanaushadhiAlternative(activeIngs: string[], brandMrp: number, brandStrength: string): JnaMatch | null {
   // 1. Join active ingredients: ["Amoxicillin", "Clavulanate Potassium"] -> "AMOXICILLIN CLAVULANATE"
   const q = activeIngs.map(i => i.toUpperCase()).join(' ');
   
   // 2. Query Postgres RPC
   const match = supabase.rpc('search_jna_drugs', { q_string: q, p_strength: brandStrength });
   
   // 3. Mathematical check
   if (match && match.mrp < brandMrp) {
     return match;
   }
   return null;
}
```

### 24.3 The Frontend Savings Banner UI
The Janaushadhi savings banner is rendered inline within the `<DrugDetails>` component (not as a separate `JanaushadhiBanner.tsx` file). It conditionally renders when `result.janaushadhiAlternative.found` is true, showing the green gradient savings card with the generic alternative name, price, and calculated percentage savings.

---

## 25. TELEMETRY & MONITORING

PharmaLens does NOT use a dedicated `useTelemetry` hook, PostHog, or Google Analytics custom event tracking. There is NO hidden `/admin` dashboard route.

**Actual monitoring consists of:**
1. **Sentry** (crash reporting + performance tracing): Configured in `main.tsx`. Captures JS errors, component stack traces, page load timing, and bundle parse time.
2. **Sentry Custom Metrics**: Three metrics are tracked:
   - `pharmalens.app.session_start` (count): Incremented once per app load.
   - `pharmalens.page.load_time_ms` (gauge): Real page load time from Navigation Timing API.
   - `pharmalens.app.bundle_parse_ms` (distribution): JS parse + execute time.
3. **Supabase Edge Function Logs**: Available via Supabase dashboard; not custom instrumented.
4. **`monitoring-system` Edge Function**: Exists in `supabase/functions/monitoring-system/` — a backend health-check function.

---

## 26. THE BUILD & DEPLOYMENT PIPELINE

How does the source code turn into a deployment on pharmalens.tech?

### 26.1 Build Command
- Defined in `netlify.toml`: `command = "npm run build"`, `publish = "dist"`.
- Netlify auto-deploys on push to the connected Git branch.
- Node version pinned via `.nvmrc` (Node 20).
- Build environment set in `netlify.toml`: `NODE_VERSION = "20.19.2"`.

### 26.2 No CI/CD Pipeline
**There is NO `.github/workflows/` directory.** PharmaLens does NOT use GitHub Actions for CI/CD. Deployment is handled entirely by Netlify's Git integration (auto-deploy on push).

### 26.3 Edge Function Deployment
Supabase Edge Functions are deployed manually via the Supabase CLI:
- `supabase functions deploy <function-name>` for protected endpoints.
- `supabase functions deploy <function-name> --no-verify-jwt` for public endpoints (e.g., `razorpay-webhook`).
- A setup script `setup-supabase-cli.ps1` exists for initializing the CLI on new machines.
- Several test scripts exist: `test-payment.ps1`, `test-subscription-manager.ps1`, `test-complete-flow.ps1`.

### 26.4 Utility Scripts in Project Root
The project root contains several PowerShell/batch utility scripts:
- `deploy-drug-identification-fixes.ps1`: Deploys identification-related edge functions.
- `create-app-icons.ps1` / `create-proper-icons.ps1`: Generate PWA/Android icon sets.
- `process-android-assets.ps1`: Processes assets for Capacitor Android build.
- `encrypt-docs.cjs` / `file-encrypt.cjs`: Document encryption utilities.
- `pharma.bat` / `docs.bat`: Quick-launch scripts.

---
> END OF SYSTEM BLUEPRINT.
> This document contains verified micro-details of the PharmaLens codebase, covering architecture, APIs, state management, edge-function flows, and deployment.
