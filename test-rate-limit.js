
const email = `rate-test-${Date.now()}@example.com`;

async function testRateLimit() {
  for (let i = 1; i <= 6; i++) {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "InvalidPassword123!",
      }),
    });

    const body = await response.text();

    console.log(
      `Attempt ${i}: HTTP ${response.status} - ${body}`
    );
  }
}

testRateLimit().catch(console.error);
