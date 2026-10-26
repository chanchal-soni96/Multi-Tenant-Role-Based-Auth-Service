
const {
  hashPassword,
  verifyPassword,
} = require("../utils/password");

async function runTests() {
  const password = "MyStrongPassword@123";

  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  console.assert(hash1 !== password, "Password must not be stored in plaintext");
  console.assert(hash1 !== hash2, "Hashes should differ due to random salts");

  console.assert(
    await verifyPassword(hash1, password),
    "Correct password should verify"
  );

  console.assert(
    !(await verifyPassword(hash1, "WrongPassword@123")),
    "Incorrect password should fail"
  );

  console.log("Password hashing tests completed.");
}

runTests().catch(console.error);
