// Test bcrypt password verification
const bcrypt = require("bcryptjs");

async function testPassword() {
  console.log("Testing bcrypt password verification...\n");

  const plainPassword = "password123";
  const hashedFromSeed =
    "$2b$10$8K1p/a0dL6Ra7x1XuL3Y1.nBKFx4JFaF7MZwzGpO0LrZFqYrNZkZe";

  console.log("Plain password:", plainPassword);
  console.log("Hash from seed file:", hashedFromSeed.substring(0, 30) + "...");

  // Test if the hash matches
  const isValid = await bcrypt.compare(plainPassword, hashedFromSeed);
  console.log("\n✅ Password match:", isValid);

  if (!isValid) {
    console.log("\n⚠️  The hash in seed-users.sql might be incorrect!");
    console.log("Generating correct hash for password123:\n");
    const correctHash = await bcrypt.hash("password123", 10);
    console.log("Use this hash instead:", correctHash);
  }
}

testPassword().catch(console.error);
