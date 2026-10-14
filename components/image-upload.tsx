"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Notice } from "@/components/ui";

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads an image straight from the browser to a Supabase Storage bucket and
 * hands the public URL back to the surrounding form through a hidden input, so
 * saving stays one ordinary form submit. Which bucket, and whether the caller
 * may write to it, is decided by the storage policies — not by this component.
 */
export function ImageUpload({
  bucket,
  pathPrefix,
  name,
  initialUrl,
  label,
  hint,
  maxBytes = 2 * 1024 * 1024,
  accept = DEFAULT_TYPES,
  previewClassName = "h-16 w-auto max-w-[160px] object-contain",
}: {
  bucket: string;
  pathPrefix: string;
  name: string;
  initialUrl: string | null;
  label: string;
  hint?: string;
  maxBytes?: number;
  accept?: string[];
  previewClassName?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!accept.includes(file.type)) {
      setError("That file type is not supported.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`That image is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(publicUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {hint ? <span className="text-muted mb-2 block text-xs">{hint}</span> : null}

      <input type="hidden" name={name} value={url ?? ""} />

      <div className="flex flex-wrap items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, no loader needed
          <img src={url} alt="" className={previewClassName} />
        ) : (
          <div className="border-line text-muted flex h-16 w-24 items-center justify-center border border-dashed text-xs">
            none
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            tone="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : url ? "Change" : "Upload"}
          </Button>
          {url ? (
            <Button type="button" tone="secondary" disabled={busy} onClick={() => setUrl(null)}>
              Remove
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </div>
  );
}
