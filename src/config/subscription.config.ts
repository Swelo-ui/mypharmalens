/**
 * Subscription Plan Configuration
 * 
 * Centralized configuration for all subscription-related constants.
 * This file defines plan IDs, usage limits, and other subscription parameters.
 */

// ============================================================================
// PLAN IDs
// ============================================================================

export const PLAN_IDS = {
    FREE: 'free-plan',
    SPECIAL: 'special-plan',
    LITE: 'lite',
    PRO: 'pro',
};

// ============================================================================
// USAGE LIMITS (Monthly Identifications)
// ============================================================================

export const IDENTIFICATION_LIMITS = {
    FREE: 5 as number,
    LITE: 39 as number,
    PRO: 101 as number,
    UNLIMITED: -1 as number, // Used for special access and unlimited plans
};

// ============================================================================
// GUEST USER LIMITS
// ============================================================================

export const GUEST_LIMITS = {
    IDENTIFICATIONS: 3 as number, // Number of free identifications for unauthenticated users
};

// ============================================================================
// DATABASE SEARCH LIMITS
// ============================================================================

export const DATABASE_SEARCH_LIMITS = {
    DEFAULT: 100 as number,
};

// ============================================================================
// SPECIAL ACCESS
// ============================================================================

/**
 * Get list of emails with special access from environment variables
 * @returns Array of email addresses with special access
 */
export const getSpecialAccessEmails = (): string[] => {
    const emailsEnv = import.meta.env.VITE_SPECIAL_ACCESS_EMAILS;
    if (!emailsEnv) return [];

    return emailsEnv
        .split(',')
        .map((email: string) => email.trim().toLowerCase())
        .filter((email: string) => email.length > 0);
};

/**
 * Check if an email has special access
 * @param email - Email address to check
 * @returns True if email has special access
 */
export const hasSpecialAccess = (email: string | undefined): boolean => {
    if (!email) return false;

    const specialEmails = getSpecialAccessEmails();
    return specialEmails.includes(email.toLowerCase());
};

// ============================================================================
// PLAN DETECTION HELPERS
// ============================================================================

/**
 * Determine the monthly identification limit based on plan ID and name
 * @param planId - The plan ID
 * @param planName - The plan name (fallback for detection)
 * @returns Monthly identification limit (-1 for unlimited)
 */
export const getMonthlyLimit = (planId: string, planName: string = ''): number => {
    // Check special plan
    if (planId === PLAN_IDS.SPECIAL) {
        return IDENTIFICATION_LIMITS.UNLIMITED;
    }

    // Check free plan
    if (planId === PLAN_IDS.FREE) {
        return IDENTIFICATION_LIMITS.FREE;
    }

    // Check lite plan by ID or name
    if (planId.toLowerCase().includes(PLAN_IDS.LITE) ||
        planName.toLowerCase().includes(PLAN_IDS.LITE)) {
        return IDENTIFICATION_LIMITS.LITE;
    }

    // Check pro plan by ID or name
    if (planId.toLowerCase().includes(PLAN_IDS.PRO) ||
        planName.toLowerCase().includes(PLAN_IDS.PRO)) {
        return IDENTIFICATION_LIMITS.PRO;
    }

    // Default to free tier for unknown plans
    console.warn('⚠️ Unknown plan, defaulting to free tier limits:', { planId, planName });
    return IDENTIFICATION_LIMITS.FREE;
};
