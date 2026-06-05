"use client"

import { motion } from "framer-motion"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import CustomSelect from "@/components/ui/custom-select"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal"
import type { FolderOption } from "@/lib/storage"

type UploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderOption[]
  uploadDestination: string
  onUploadDestinationChange: (value: string) => void
  uploading: boolean
  uploadQueue: File[]
  uploadProgress: number
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (file: File) => void
  onSubmit: (event: React.FormEvent) => Promise<void> | void
  formatFolderLabel: (folder: FolderOption) => string
  formatBytes: (bytes: number) => string
}

export default function UploadModal({
  open,
  onOpenChange,
  folders,
  uploadDestination,
  onUploadDestinationChange,
  uploading,
  uploadQueue,
  uploadProgress,
  fileInputRef,
  onFileChange,
  onRemoveFile,
  onSubmit,
  formatFolderLabel,
  formatBytes,
}: UploadModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <div className="space-y-2">
            <ModalTitle>Upload files</ModalTitle>
            <ModalDescription>
              Choose files, then select which folder should receive them before
              starting the upload.
            </ModalDescription>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </ModalHeader>

        <form onSubmit={onSubmit}>
          <ModalBody>
            <div className="space-y-2">
              <p className="block text-sm font-medium text-foreground">
                Destination folder
              </p>
              <CustomSelect
                value={uploadDestination}
                onValueChange={onUploadDestinationChange}
                triggerClassName="h-10 rounded-xl px-3 text-sm"
                disabled={uploading}
                options={folders.map((folder) => ({
                  label: formatFolderLabel(folder),
                  value: folder.key.slice(0, -1),
                }))}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="upload-files"
                className="block text-sm font-medium text-foreground"
              >
                Files
              </label>
              <input
                id="upload-files"
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground"
                disabled={uploading}
              />
              {uploadQueue.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadQueue.length} file
                    {uploadQueue.length === 1 ? "" : "s"} selected
                  </p>
                  <div className="upload-queue-scroll max-h-40 space-y-2 overflow-auto pr-1">
                    {uploadQueue.map((file) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="flex items-center justify-between gap-3 rounded-md bg-background/70 px-2 py-1.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-foreground">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => onRemoveFile(file)}
                          disabled={uploading}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {uploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Uploading</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              disabled={uploading || uploadQueue.length === 0}
            >
              {uploading ? "Uploading..." : "Continue Upload"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
