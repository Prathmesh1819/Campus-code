import fs from "fs";
const env = fs.readFileSync(".env.local", "utf8");
env.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

import { adminDb } from "../src/lib/firebase/admin";

async function main() {
  try {
    const snap = await adminDb.collection("problems").get();
    console.log("Firestore Total Problems:", snap.size);
    let published = 0;
    let archived = 0;
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "published" || data.status === "PUBLISHED" || data.isPublished === true) {
        published++;
      } else {
        archived++;
      }
    });
    console.log("Firestore Published Problems:", published);
    console.log("Firestore Archived Problems:", archived);
    if (snap.size > 0) {
      console.log("Sample Problem 0:", snap.docs[0].id, snap.docs[0].data().title);
    }
  } catch (err: any) {
    console.error("Firestore error:", err.message);
  }
}

main();
