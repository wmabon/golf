import { seedAirports } from "./airports";
import { seedCourses } from "./courses";

async function main() {
  console.log("Starting seed...\n");

  try {
    await seedAirports();
    await seedCourses();

    console.log("\nSeed complete.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
