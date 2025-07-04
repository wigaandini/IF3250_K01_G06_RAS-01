// import { main as seedWilayahData } from "./seedWilayah";
import { main as seedUserData } from "./seedUsers";
import { main as seedCoAData } from "./seedCoA";

async function main() {
  console.log("🚀 Starting full seed...");
  // await seedWilayahData(); 
  await seedCoAData();
  await seedUserData();
  console.log("✅ All seeding completed!");
}

main().catch((err) => {
  console.error("❌ Error seeding:", err);
  process.exit(1);
});
