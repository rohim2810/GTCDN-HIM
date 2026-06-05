"use client"

import { Button } from "@/components/ui/button"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal"

type UploadConflictModalProps = {
  open: boolean
  fileName: string
  suggestedName: string
  onReplace: () => void
  onRename: () => void
  onCancel: () => void
}

export default function UploadConflictModal({
  open,
  fileName,
  suggestedName,
  onReplace,
  onRename,
  onCancel,
}: UploadConflictModalProps) {
  return (
    <Modal open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <div className="space-y-2">
            <ModalTitle>File already exists</ModalTitle>
            <ModalDescription>
              A file named "{fileName}" already exists in this folder.
            </ModalDescription>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Close
          </Button>
        </ModalHeader>

        <ModalBody>
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Choose whether to replace the existing file or upload the new file
            as "{suggestedName}".
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={onRename}>
            Rename new file
          </Button>
          <Button type="button" onClick={onReplace}>
            Replace existing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
