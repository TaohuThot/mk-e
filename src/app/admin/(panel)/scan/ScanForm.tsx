"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { findByBarcode } from "../products/actions";
import { buttonClass, FormMessage, inputClass, secondaryButtonClass } from "../../ui";

// BarcodeDetector ยังไม่มีใน type ของ TypeScript และรองรับเฉพาะบางเบราว์เซอร์ (เช่น Chrome บน Android)
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new () => Detector;
  }
}

export default function ScanForm() {
  const [state, formAction] = useActionState(findByBarcode, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => setCameraSupported("BarcodeDetector" in window), []);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | undefined;
    let stopped = false;
    const detector = new window.BarcodeDetector!();

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        while (!stopped) {
          const [code] = await detector.detect(video);
          if (code?.rawValue) {
            inputRef.current!.value = code.rawValue;
            setScanning(false);
            formRef.current?.requestSubmit();
            return;
          }
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (error) {
        console.error(error);
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-3">
        <FormMessage state={state} />
        <input
          ref={inputRef}
          name="code"
          autoFocus
          autoComplete="off"
          placeholder="สแกนบาร์โค้ด หรือพิมพ์บาร์โค้ด/SKU แล้วกด Enter"
          className={`${inputClass} text-lg`}
        />
        <div className="flex gap-2">
          <button className={buttonClass}>ค้นหา</button>
          {cameraSupported && (
            <button type="button" onClick={() => setScanning((s) => !s)} className={secondaryButtonClass}>
              {scanning ? "ปิดกล้อง" : "สแกนด้วยกล้อง"}
            </button>
          )}
        </div>
      </form>
      {scanning && <video ref={videoRef} muted playsInline className="w-full max-w-md rounded-lg bg-black" />}
    </div>
  );
}
