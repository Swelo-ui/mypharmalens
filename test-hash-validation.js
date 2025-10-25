// Test script to validate PayU hash generation logic
// This will help identify the root cause of the recurring error

import crypto from 'crypto';

// PayU configuration from .env
const PAYU_MERCHANT_KEY = "tlDTvv";
const PAYU_MERCHANT_SALT = "RZshPeBAKOxaJZeROuMXy3g2tXBmlm16";

// Test data
const testData = {
  txnid: "TXN_1735737600000_abc123def",
  amount: "299.00",
  productinfo: "monthly-premium-plan - monthly",
  firstname: "John Doe",
  email: "john.doe@example.com"
};

console.log("=== PayU Hash Generation Test ===\n");

// Function 1: Hash generation from payu-payment (current implementation)
function generatePaymentHash(key, txnid, amount, productinfo, firstname, email, salt) {
  // Current implementation: key|txnid|amount|productinfo|firstname|email|||||||||||SALT
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  console.log("Payment Hash String:", hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
  return hash;
}

// Function 2: Hash generation from payu-config (alternative implementation)
function generateConfigHash(key, salt, txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '') {
  // Alternative implementation: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  console.log("Config Hash String:", hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
  return hash;
}

// Function 3: Response hash verification from webhook
function verifyResponseHash(salt, status, udf5 = '', udf4 = '', udf3 = '', udf2 = '', udf1 = '', email, firstname, productinfo, amount, txnid, key) {
  // Response hash: salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = `${salt}|${status}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  console.log("Response Hash String:", hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
  return hash;
}

// Test payment hash generation
console.log("1. Testing Payment Hash Generation:");
const paymentHash = generatePaymentHash(
  PAYU_MERCHANT_KEY,
  testData.txnid,
  testData.amount,
  testData.productinfo,
  testData.firstname,
  testData.email,
  PAYU_MERCHANT_SALT
);
console.log("Payment Hash:", paymentHash);
console.log();

// Test config hash generation
console.log("2. Testing Config Hash Generation:");
const configHash = generateConfigHash(
  PAYU_MERCHANT_KEY,
  PAYU_MERCHANT_SALT,
  testData.txnid,
  testData.amount,
  testData.productinfo,
  testData.firstname,
  testData.email
);
console.log("Config Hash:", configHash);
console.log();

// Test response hash verification (success scenario)
console.log("3. Testing Response Hash Verification (Success):");
const responseHashSuccess = verifyResponseHash(
  PAYU_MERCHANT_SALT,
  'success',
  '', '', '', '', '', // UDF fields
  testData.email,
  testData.firstname,
  testData.productinfo,
  testData.amount,
  testData.txnid,
  PAYU_MERCHANT_KEY
);
console.log("Response Hash (Success):", responseHashSuccess);
console.log();

// Compare hashes
console.log("=== Hash Comparison ===");
console.log("Payment Hash == Config Hash:", paymentHash === configHash);
console.log("Payment Hash:", paymentHash);
console.log("Config Hash:  ", configHash);
console.log();

// Identify the issue
console.log("=== Issue Analysis ===");
if (paymentHash !== configHash) {
  console.log("❌ CRITICAL ISSUE FOUND:");
  console.log("The hash generation in payu-payment and payu-config functions are different!");
  console.log("This will cause PayU to reject the payment with hash validation errors.");
  console.log();
  
  // Count pipe separators
  const paymentPipes = (PAYU_MERCHANT_KEY + "|" + testData.txnid + "|" + testData.amount + "|" + testData.productinfo + "|" + testData.firstname + "|" + testData.email + "|||||||||||" + PAYU_MERCHANT_SALT).split('|').length - 1;
  const configPipes = (PAYU_MERCHANT_KEY + "|" + testData.txnid + "|" + testData.amount + "|" + testData.productinfo + "|" + testData.firstname + "|" + testData.email + "|||||||" + PAYU_MERCHANT_SALT).split('|').length - 1;
  
  console.log("Payment hash has", paymentPipes, "pipe separators");
  console.log("Config hash has", configPipes, "pipe separators");
  console.log();
  console.log("PayU expects exactly 17 pipe separators in the hash string.");
  console.log("Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt");
} else {
  console.log("✅ Hash generation is consistent between functions.");
}

console.log("\n=== Recommended Fix ===");
console.log("Use the correct PayU hash format with exactly 5 UDF fields and 6 empty fields:");
console.log("key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt");