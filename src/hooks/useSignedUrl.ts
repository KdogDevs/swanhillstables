import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Given a storage path like "signed-documents/user-id/file.pdf" or just "user-id/file.ext",
 * returns a signed URL. Handles both "bucket/path" and bare path formats.
 */
export function useSignedUrl(storagePath: string | null, bucket?: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      return;
    }

    let resolvedBucket = bucket;
    let resolvedPath = storagePath;

    // If path starts with a known bucket name, split it
    if (!resolvedBucket) {
      if (storagePath.startsWith("signed-documents/")) {
        resolvedBucket = "signed-documents";
        resolvedPath = storagePath.replace("signed-documents/", "");
      } else if (storagePath.startsWith("care-log-photos/")) {
        resolvedBucket = "care-log-photos";
        resolvedPath = storagePath.replace("care-log-photos/", "");
      } else {
        // Fallback: treat the whole thing as a URL (legacy public URLs)
        setUrl(storagePath);
        return;
      }
    }

    const getSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from(resolvedBucket!)
        .createSignedUrl(resolvedPath, 3600); // 1 hour expiry

      if (error) {
        console.error("Error creating signed URL:", error);
        setUrl(null);
      } else {
        setUrl(data.signedUrl);
      }
    };

    getSignedUrl();
  }, [storagePath, bucket]);

  return url;
}

/**
 * Imperative version for use outside of React components.
 */
export async function getSignedUrl(
  storagePath: string,
  bucket?: string
): Promise<string | null> {
  let resolvedBucket = bucket;
  let resolvedPath = storagePath;

  if (!resolvedBucket) {
    if (storagePath.startsWith("signed-documents/")) {
      resolvedBucket = "signed-documents";
      resolvedPath = storagePath.replace("signed-documents/", "");
    } else if (storagePath.startsWith("care-log-photos/")) {
      resolvedBucket = "care-log-photos";
      resolvedPath = storagePath.replace("care-log-photos/", "");
    } else {
      return storagePath; // legacy URL
    }
  }

  const { data, error } = await supabase.storage
    .from(resolvedBucket)
    .createSignedUrl(resolvedPath, 3600);

  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }

  return data.signedUrl;
}
