"use client"

import { GooeyToaster, gooeyToast } from "goey-toast"
import type { GooeyToasterProps } from "goey-toast"
import "goey-toast/styles.css"

export const goeyToast = gooeyToast
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
} from "goey-toast"

function GoeyToaster(props: GooeyToasterProps) {
  return (
    <>
      <GooeyToaster position="top-center" {...props} />
      <style jsx global>{`
        .gooey-timestamp {
          display: none !important;
        }

        [data-sonner-toast][data-x-position="left"] .gooey-description {
          width: 100%;
          text-align: left !important;
        }

        [data-sonner-toast][data-x-position="center"] .gooey-description {
          width: 100%;
          text-align: center !important;
        }

        [data-sonner-toast][data-x-position="right"] .gooey-description {
          width: 100%;
          text-align: right !important;
        }
      `}</style>
    </>
  );
}

export { GoeyToaster }
