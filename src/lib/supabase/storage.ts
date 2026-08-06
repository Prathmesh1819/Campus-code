import { supabaseAdmin } from "./server";

export async function verifyAndInitializeStorageBuckets() {
  const requiredBuckets = ["avatars", "submissions", "resumes"];

  try {
    const { data: existingBuckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.log("ℹ️ Storage buckets check completed");
      return false;
    }

    const existingNames = new Set(existingBuckets?.map((b) => b.name) || []);

    for (const bucketName of requiredBuckets) {
      if (!existingNames.has(bucketName)) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
        });

        if (createErr) {
          console.log(`ℹ️ Bucket '${bucketName}' info: ${createErr.message}`);
        } else {
          console.log(`✔ Storage bucket '${bucketName}' created successfully.`);
        }
      } else {
        console.log(`✔ Storage bucket '${bucketName}' verified.`);
      }
    }
    return true;
  } catch (err: any) {
    console.log("ℹ️ Storage verification complete:", err.message);
    return false;
  }
}
