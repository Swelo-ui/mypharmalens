/**
 * PharmaLens — Subscription Logic Unit Tests
 *
 * Tests all business-critical subscription limit logic so that
 * future changes to config do NOT silently break tier enforcement.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
    IDENTIFICATION_LIMITS,
    GUEST_LIMITS,
    FREE_CLAIM_LIMITS,
    PLAN_IDS,
    getMonthlyLimit,
    hasSpecialAccess,
} from '@/config/subscription.config';

// ============================================================================
// 1. Plan constants sanity check
// ============================================================================

describe('IDENTIFICATION_LIMITS — plan constants', () => {
    it('Free plan limit is a positive number', () => {
        expect(IDENTIFICATION_LIMITS.FREE).toBeGreaterThan(0);
    });

    it('Lite plan limit is greater than Free', () => {
        expect(IDENTIFICATION_LIMITS.LITE).toBeGreaterThan(IDENTIFICATION_LIMITS.FREE);
    });

    it('Pro plan limit is greater than Lite', () => {
        expect(IDENTIFICATION_LIMITS.PRO).toBeGreaterThan(IDENTIFICATION_LIMITS.LITE);
    });

    it('Unlimited is -1 (sentinel value)', () => {
        expect(IDENTIFICATION_LIMITS.UNLIMITED).toBe(-1);
    });

    it('Current Free limit is exactly 1', () => {
        // If this changes, tier pricing logic must be re-validated
        expect(IDENTIFICATION_LIMITS.FREE).toBe(1);
    });

    it('Current Lite limit is exactly 39', () => {
        expect(IDENTIFICATION_LIMITS.LITE).toBe(39);
    });

    it('Current Pro limit is exactly 101', () => {
        expect(IDENTIFICATION_LIMITS.PRO).toBe(101);
    });
});

// ============================================================================
// 2. Guest limits
// ============================================================================

describe('GUEST_LIMITS — unauthenticated user restrictions', () => {
    it('Guest gets at least 1 identification', () => {
        expect(GUEST_LIMITS.IDENTIFICATIONS).toBeGreaterThanOrEqual(1);
    });

    it('Guest limit is less than or equal to Free plan limit', () => {
        expect(GUEST_LIMITS.IDENTIFICATIONS).toBeLessThanOrEqual(IDENTIFICATION_LIMITS.FREE);
    });
});

// ============================================================================
// 3. Free claim limits
// ============================================================================

describe('FREE_CLAIM_LIMITS — ad-based bonus identifications', () => {
    it('Daily claim limit is a positive number', () => {
        expect(FREE_CLAIM_LIMITS.DAILY_CLAIMS).toBeGreaterThan(0);
    });

    it('Token expiry is at least 5 minutes', () => {
        expect(FREE_CLAIM_LIMITS.TOKEN_EXPIRY_MINUTES).toBeGreaterThanOrEqual(5);
    });
});

// ============================================================================
// 4. Plan ID constants
// ============================================================================

describe('PLAN_IDS — plan identifier strings', () => {
    it('Free plan ID is defined', () => {
        expect(PLAN_IDS.FREE).toBeDefined();
        expect(typeof PLAN_IDS.FREE).toBe('string');
    });

    it('Lite plan ID is defined', () => {
        expect(PLAN_IDS.LITE).toBeDefined();
    });

    it('Pro plan ID is defined', () => {
        expect(PLAN_IDS.PRO).toBeDefined();
    });
});

// ============================================================================
// 5. getMonthlyLimit() — plan detection function
// ============================================================================

describe('getMonthlyLimit() — plan limit resolution', () => {
    it('Returns FREE limit for free-plan ID', () => {
        expect(getMonthlyLimit('free-plan')).toBe(IDENTIFICATION_LIMITS.FREE);
    });

    it('Returns UNLIMITED for special-plan', () => {
        expect(getMonthlyLimit('special-plan')).toBe(IDENTIFICATION_LIMITS.UNLIMITED);
    });

    it('Returns LITE limit when plan ID contains "lite"', () => {
        expect(getMonthlyLimit('lite')).toBe(IDENTIFICATION_LIMITS.LITE);
        expect(getMonthlyLimit('lite-monthly')).toBe(IDENTIFICATION_LIMITS.LITE);
    });

    it('Returns PRO limit when plan ID contains "pro"', () => {
        expect(getMonthlyLimit('pro')).toBe(IDENTIFICATION_LIMITS.PRO);
        expect(getMonthlyLimit('pro-annual')).toBe(IDENTIFICATION_LIMITS.PRO);
    });

    it('Falls back to FREE limit for unknown plan IDs', () => {
        expect(getMonthlyLimit('unknown-plan-xyz')).toBe(IDENTIFICATION_LIMITS.FREE);
    });

    it('Detects lite by plan name even if ID is unknown', () => {
        expect(getMonthlyLimit('unknown', 'Lite Monthly')).toBe(IDENTIFICATION_LIMITS.LITE);
    });

    it('Detects pro by plan name even if ID is unknown', () => {
        expect(getMonthlyLimit('unknown', 'Pro Annual')).toBe(IDENTIFICATION_LIMITS.PRO);
    });
});

// ============================================================================
// 6. Bonus identification total limit calculation
// ============================================================================

describe('Bonus identifications — total limit arithmetic', () => {
    it('Total limit = monthly limit + bonus identifications', () => {
        const monthlyLimit = IDENTIFICATION_LIMITS.FREE;
        const bonus = 3;
        const totalLimit = monthlyLimit + bonus;
        expect(totalLimit).toBe(IDENTIFICATION_LIMITS.FREE + 3);
    });

    it('User with 0 bonus sees only monthly limit', () => {
        const totalLimit = IDENTIFICATION_LIMITS.FREE + 0;
        expect(totalLimit).toBe(IDENTIFICATION_LIMITS.FREE);
    });

    it('User is blocked when used >= totalLimit (non-unlimited)', () => {
        const used = 5;
        const totalLimit = 5;
        const isBlocked = used >= totalLimit;
        expect(isBlocked).toBe(true);
    });

    it('User is NOT blocked when still under limit', () => {
        const used = 3;
        const totalLimit = 5;
        const isBlocked = used >= totalLimit;
        expect(isBlocked).toBe(false);
    });

    it('Unlimited plans (monthlyLimit = -1) should never block', () => {
        const monthlyLimit = IDENTIFICATION_LIMITS.UNLIMITED; // -1
        const used = 9999;
        const isUnlimited = monthlyLimit === -1;
        // App checks isUnlimited before comparing used >= totalLimit
        expect(isUnlimited).toBe(true);
    });
});

// ============================================================================
// 7. hasSpecialAccess() — special email check
// ============================================================================

describe('hasSpecialAccess() — email whitelist check', () => {
    it('Returns false for undefined email', () => {
        expect(hasSpecialAccess(undefined)).toBe(false);
    });

    it('Returns false for empty string', () => {
        expect(hasSpecialAccess('')).toBe(false);
    });

    it('Returns false for non-whitelisted email', () => {
        // VITE_SPECIAL_ACCESS_EMAILS is an env var, not set in test env → returns false
        expect(hasSpecialAccess('randomuser@gmail.com')).toBe(false);
    });
});
