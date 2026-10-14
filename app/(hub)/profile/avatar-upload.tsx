"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Notice } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads straight from the browser to Supabase Storage, then hands the public
 * URL to the surrounding form through a hidden input, so saving the profile
 * stays one ordinary form submit.
 */
export default function AvatarUpload({
  initialUrl,
  name,
}: {
  initialUrl: string | null;
  name: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 5 MB. Please choose a smaller one.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session has expired. Reload the page and try again.");
        return;
      }

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Cache-bust, or the browser keeps showing the previous photo.
      setUrl(`${publicUrl}?v=${Date.now()}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Your photo</span>
      <span className="text-muted mb-2 block text-xs">
        JPEG, PNG or WebP, up to 5 MB. Shown in the directory next to your name.
      </span>

      <input type="hidden" name={name} value={url ?? ""} />

      <div className="flex flex-wrap items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, no loader needed
          <img
            src={url}
            alt="Your profile photo"
            width={96}
            height={96}
            className="h-24 w-24 object-cover"
          />
        ) : (
          <div className="bg-accent-soft text-accent flex h-24 w-24 items-center justify-center text-3xl font-extrabold">
            ?
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            tone="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : url ? "Change photo" : "Choose a photo"}
          </Button>
          {url ? (
            <Button
              type="button"
              tone="secondary"
              disabled={busy}
              onClick={() => setUrl(null)}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
      <p className="text-muted mt-2 text-xs">
        The photo uploads straight away — remember to press Save profile to keep it.
      </p>
    </div>
  );
}
