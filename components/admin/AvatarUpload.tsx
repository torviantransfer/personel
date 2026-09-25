"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { removeAvatar, uploadAvatar, type ActionState } from "@/app/(app)/admin/actions";
import { FormMessage } from "@/components/admin/Form";
import { Avatar } from "@/components/ui";

const SIZE = 512;

/** Seçilen fotoğrafı ortadan kare kırpıp 512px JPEG'e küçültür (hızlı yükleme, sabit boyut). */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.86));
}

export default function AvatarUpload({ id, name, src }: { id: string; name: string; src: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();
  const [removeState, removeAction, removing] = useActionState(removeAvatar, null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    startTransition(async () => {
      try {
        const blob = await toSquareJpeg(file);
        setPreview(URL.createObjectURL(blob));
        const fd = new FormData();
        fd.set("id", id);
        fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        setState(await uploadAvatar(null, fd));
      } catch {
        setState({ error: "Fotoğraf işlenemedi." });
      }
    });
  }

  const current = removeState?.success && !preview ? null : (preview ?? src);
  const busy = pending || removing;

  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="tap relative rounded-full" aria-label="Fotoğraf değiştir">
        <Avatar name={name} src={current} size="xl" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-primary text-white">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <div className="mt-3 flex items-center gap-4 text-[13px] font-semibold">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="text-primary">
          {current ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
        </button>
        {current && (
          <form
            action={(fd) => {
              setPreview(null);
              setState(null);
              removeAction(fd);
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={busy} className="flex items-center gap-1 text-rose-600">
              <Trash2 className="size-3.5" />
              Kaldır
            </button>
          </form>
        )}
      </div>
      {(state?.error || removeState?.error) && (
        <div className="mt-3 w-full">
          <FormMessage state={state?.error ? state : removeState} />
        </div>
      )}
    </div>
  );
}
