import { adminDb } from "./src/lib/firebase/admin";
import { COLLECTIONS } from "./src/lib/firebase/firestore";

async function check() {
  const pSnap = await adminDb.collection(COLLECTIONS.PROBLEMS).where("status", "==", "published").get();
  console.log("Published problems count:", pSnap.docs.length);
  for (const doc of pSnap.docs) {
    const data = doc.data();
    if (data.slug === "two-sum" || doc.id.includes("1") || data.title?.includes("Two Sum")) {
      console.log("\n=== Problem Doc ID:", doc.id);
      console.log("Title:", data.title);
      console.log("Slug:", data.slug);
      console.log("Starter codes:", JSON.stringify(data.starter_codes || data.starterCodes || [], null, 2));

      const tcSnap = await adminDb.collection(COLLECTIONS.TEST_CASES).where("problem_id", "==", doc.id).get();
      console.log(`Test cases count (${tcSnap.docs.length}):`);
      tcSnap.docs.forEach((tc, idx) => {
        const d = tc.data();
        console.log(` Case ${idx + 1}: input="${d.input}", expected="${d.expected_output || d.output}", isHidden=${d.is_hidden}`);
      });
    }
  }
}
check().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
