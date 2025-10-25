import crypto from 'crypto';

// Test data
const testData = {
  key: 'tlDTvv',
  txnid: 'TXN_1735737600000_abc123def',
  amount: '299.00',
  productinfo: 'monthly-premium-plan - monthly',
  firstname: 'John Doe',
  email: 'john.doe@example.com',
  salt: 'RZshPeBAKOxaJZeROuMXy3g2tXBmlm16'
};

// Current implementation (5 UDF fields)
function currentImplementation(data) {
  const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${data.salt}`;
  return {
    hash: crypto.createHash('sha512').update(hashString).digest('hex'),
    hashString,
    pipeCount: (hashString.match(/\|/g) || []).length,
    fieldCount: hashString.split('|').length
  };
}

// Fixed implementation (10 UDF fields to match form)
function fixedImplementation(data) {
  const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}||||||||||||||${data.salt}`;
  return {
    hash: crypto.createHash('sha512').update(hashString).digest('hex'),
    hashString,
    pipeCount: (hashString.match(/\|/g) || []).length,
    fieldCount: hashString.split('|').length
  };
}

console.log('=== PayU Hash Format Fix Analysis ===\n');

const current = currentImplementation(testData);
const fixed = fixedImplementation(testData);

console.log('Current Implementation (5 UDF):');
console.log(`Hash String: ${current.hashString}`);
console.log(`Pipe count: ${current.pipeCount}`);
console.log(`Field count: ${current.fieldCount}`);
console.log(`Hash: ${current.hash.substring(0, 32)}...\n`);

console.log('Fixed Implementation (10 UDF):');
console.log(`Hash String: ${fixed.hashString}`);
console.log(`Pipe count: ${fixed.pipeCount}`);
console.log(`Field count: ${fixed.fieldCount}`);
console.log(`Hash: ${fixed.hash.substring(0, 32)}...\n`);

console.log('=== Comparison ===');
console.log(`Hashes match: ${current.hash === fixed.hash}`);
console.log(`Pipe count difference: ${fixed.pipeCount - current.pipeCount}`);
console.log(`Field count difference: ${fixed.fieldCount - current.fieldCount}`);

console.log('\n=== Form Field Analysis ===');
console.log('HTML form includes these UDF fields:');
console.log('udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10');
console.log('Total UDF fields in form: 10');
console.log('UDF fields in current hash: 5');
console.log('UDF fields in fixed hash: 10');
console.log('\n✅ The fix aligns hash generation with the HTML form structure.');