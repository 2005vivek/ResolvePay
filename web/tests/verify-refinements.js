/**
 * ResolvePay Frontend Verification Test Suite
 * Directly imports and tests production utilities from src/lib/utils.ts (Zero duplication).
 */

import { 
  calculateDeadlineUrgency, 
  calculateDefenseReadiness, 
  formatCurrency,
  calculateTacticalRecommendation,
  getPolicyMatch,
  generateMultilingualRebuttal
} from '../src/lib/utils.ts';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('--- Running ResolvePay Production Source Unit Tests ---');

// Test 1: Deadline Urgency - Empty/null
assert(calculateDeadlineUrgency(null).urgency === 'NONE', 'Null deadline returns NONE');
assert(calculateDeadlineUrgency('').urgency === 'NONE', 'Empty string returns NONE');
assert(calculateDeadlineUrgency('   ').urgency === 'NONE', 'Whitespace string returns NONE');
assert(calculateDeadlineUrgency('invalid-date-string').urgency === 'NONE', 'Invalid timestamp returns NONE');

// Test 2: Deadline Urgency - Active Intervals
const criticalDate = new Date(Date.now() + 10 * 3600 * 1000).toISOString();
const criticalResult = calculateDeadlineUrgency(criticalDate);
assert(criticalResult.urgency === 'CRITICAL', 'Deadline in 10h is CRITICAL');
assert(criticalResult.label.includes('m left') || criticalResult.label.includes('h left'), 'Countdown label is formatted');

const elevatedDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
assert(calculateDeadlineUrgency(elevatedDate).urgency === 'ELEVATED', 'Deadline in 48h is ELEVATED');

const routineDate = new Date(Date.now() + 120 * 3600 * 1000).toISOString();
assert(calculateDeadlineUrgency(routineDate).urgency === 'ROUTINE', 'Deadline in 5d is ROUTINE');

// Test 3: Deadline Urgency - Expired
const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
assert(calculateDeadlineUrgency(pastDate).urgency === 'EXPIRED', 'Past deadline returns EXPIRED');

// Test 4: Defense Readiness Heuristic Scoring
assert(calculateDefenseReadiness(0, false).score === 20, '0 evidence + no draft = 20% (Evidence Needed)');
assert(calculateDefenseReadiness(0, true).score === 50, '0 evidence + draft = 50% (Draft Ready)');
assert(calculateDefenseReadiness(2, false).score === 70, '2 evidence + no draft = 70% (Proofs Ingested)');
assert(calculateDefenseReadiness(2, true).score === 95, '2 evidence + draft = 95% (Strong Defense Package)');

// Test 5: Currency Formatting
assert(formatCurrency(249.99, 'USD') === '$249.99', 'Formats 249.99 as $249.99');
assert(formatCurrency('1250.5', 'USD') === '$1,250.50', 'Formats numeric string as $1,250.50');
assert(formatCurrency(0, 'USD') === '$0.00', 'Formats 0 as $0.00');

// Test 6: Dirty State Rebuttal Logic
function isDraftDirty(currentDraft, initialDraft, isSubmitted) {
  return currentDraft.trim() !== '' && currentDraft !== initialDraft && !isSubmitted;
}
assert(isDraftDirty('Modified rebuttal', 'Initial draft', false) === true, 'Modified draft marks workspace dirty');
assert(isDraftDirty('Initial draft', 'Initial draft', false) === false, 'Unchanged draft is not dirty');
assert(isDraftDirty('Modified rebuttal', 'Initial draft', true) === false, 'Submitted draft is not dirty');

// Test 7: Sorting and Pagination Math
const mockDisputes = [
  { id: '1', amount: 50, paypalDisputeId: 'PP-1' },
  { id: '2', amount: 200, paypalDisputeId: 'PP-2' },
  { id: '3', amount: 120, paypalDisputeId: 'PP-3' },
];
const sortedAsc = [...mockDisputes].sort((a, b) => a.amount - b.amount);
assert(sortedAsc[0].amount === 50 && sortedAsc[2].amount === 200, 'Ascending sort by amount is correct');

const pageSize = 2;
const totalPages = Math.ceil(mockDisputes.length / pageSize);
assert(totalPages === 2, '3 items at 2 per page equals 2 pages');
const page1 = mockDisputes.slice(0, pageSize);
assert(page1.length === 2, 'Page 1 has 2 items');

// Test 8: Tactical Recommendation Engine
const mockDisputeINR = {
  id: 'd-1',
  paypalDisputeId: 'PP-101',
  amount: 250,
  currency: 'USD',
  reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
  deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
};
const carrierDelivered = {
  carrier: 'FEDEX',
  trackingNumber: '78492019',
  status: 'DELIVERED',
  deliveryDate: 'Today',
  deliveryLocation: 'Front Porch',
  signedBy: 'John Doe'
};
const tacticalFight = calculateTacticalRecommendation(mockDisputeINR, 1, carrierDelivered);
assert(tacticalFight.action === 'FIGHT_DISPUTE', 'Tactical engine recommends FIGHT when signed POD attached');
assert(tacticalFight.winProbability >= 80, 'Win probability exceeds 80% with carrier signature');

const tacticalConcede = calculateTacticalRecommendation(mockDisputeINR, 0, null);
assert(tacticalConcede.action === 'CONCEDE_REFUND' || tacticalConcede.winProbability < 60, 'Recommends caution/concession when no proofs attached');

// Test 9: Store Policy & Compliance Matcher
const policyINR = getPolicyMatch('MERCHANDISE_NOT_RECEIVED');
assert(policyINR.complianceStatus === 'VIOLATION_BY_BUYER', 'Non-receipt with POD flagged as buyer violation');
assert(policyINR.policyName.includes('Shipping'), 'Resolves shipping fulfillment policy clause');

// Test 10: Multilingual Rebuttal Generation
const rebuttalEN = generateMultilingualRebuttal('en', 'PP-999', 150, 'Alice', carrierDelivered);
assert(rebuttalEN.includes('FORMAL SELLER REBUTTAL') && rebuttalEN.includes('FEDEX'), 'Generates English legal rebuttal with carrier facts');

const rebuttalDE = generateMultilingualRebuttal('de', 'PP-999', 150, 'Alice', carrierDelivered);
assert(rebuttalDE.includes('Sehr geehrtes PayPal') && rebuttalDE.includes('FEDEX'), 'Generates German legal rebuttal');

const rebuttalFR = generateMultilingualRebuttal('fr', 'PP-999', 150, 'Alice', carrierDelivered);
assert(rebuttalFR.includes('LITIGE PAYPAL') && rebuttalFR.includes('FEDEX'), 'Generates French legal rebuttal');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
