// Test script to verify the Edge Function returns proper responses
const testEdgeFunction = async () => {
  try {
    // Create a simple test image (1x1 pixel base64 image)
    const testImageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A";
    
    console.log("Testing Edge Function with test image...");
    
    const response = await fetch('http://localhost:54321/functions/v1/identify-drug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        imageBase64: testImageBase64,
        blurryMode: false
      })
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Response body:", responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log("Parsed JSON:", responseJson);
      
      if (response.status === 200) {
        console.log("✅ Edge Function returned HTTP 200");
        if (responseJson.success !== undefined) {
          console.log("✅ Response has success field:", responseJson.success);
        } else {
          console.log("❌ Response missing success field");
        }
      } else {
        console.log("❌ Edge Function returned non-200 status:", response.status);
      }
    } catch (parseError) {
      console.log("❌ Failed to parse response as JSON:", parseError.message);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

// Test with missing image data
const testMissingImage = async () => {
  try {
    console.log("\nTesting Edge Function with missing image data...");
    
    const response = await fetch('http://localhost:54321/functions/v1/identify-drug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        blurryMode: false
      })
    });
    
    console.log("Response status:", response.status);
    const responseText = await response.text();
    console.log("Response body:", responseText);
    
    if (response.status === 200) {
      console.log("✅ Edge Function returned HTTP 200 for missing image");
      try {
        const responseJson = JSON.parse(responseText);
        if (responseJson.success === false) {
          console.log("✅ Proper error response with success: false");
        } else {
          console.log("❌ Expected success: false for missing image");
        }
      } catch (parseError) {
        console.log("❌ Failed to parse error response as JSON");
      }
    } else {
      console.log("❌ Edge Function returned non-200 status for missing image:", response.status);
    }
    
  } catch (error) {
    console.error("❌ Missing image test failed:", error.message);
  }
};

// Run tests
testEdgeFunction().then(() => testMissingImage());