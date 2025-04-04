const fetch = require('node-fetch');

// Test device ID
const deviceId = 'test_device_id_12345';
const baseUrl = 'http://localhost:3001';

// Function to get current count
async function getCount() {
  try {
    const response = await fetch(`${baseUrl}/api/message-limit?deviceId=${deviceId}`);
    if (response.ok) {
      const data = await response.json();
      console.log('GET response:', data);
      return data;
    } else {
      console.error('GET failed:', await response.text());
    }
  } catch (error) {
    console.error('Error making GET request:', error);
  }
}

// Function to increment count
async function incrementCount() {
  try {
    const response = await fetch(`${baseUrl}/api/message-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('POST response:', data);
      return data;
    } else {
      console.error('POST failed:', await response.text());
    }
  } catch (error) {
    console.error('Error making POST request:', error);
  }
}

// Run tests
async function runTests() {
  console.log('Starting message limit API tests...');
  
  // Get initial count
  console.log('\n1. Checking initial count:');
  await getCount();
  
  // Increment count 10 times (should hit limit)
  console.log('\n2. Incrementing count 10 times:');
  for (let i = 1; i <= 10; i++) {
    console.log(`\n- Increment #${i}:`);
    const result = await incrementCount();
    
    if (result && result.limitReached) {
      console.log(`Limit reached after ${i} messages!`);
    }
  }
  
  // Check final count
  console.log('\n3. Checking final count:');
  const finalCount = await getCount();
  
  if (finalCount && finalCount.limitReached) {
    console.log('\nSUCCESS: Message limit functionality is working correctly!');
  } else {
    console.log('\nFAILURE: Message limit was not reached as expected');
  }
}

// Run the tests
runTests(); 