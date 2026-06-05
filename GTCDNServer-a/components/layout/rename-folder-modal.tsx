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

type RenameFolderModalProps = {
  open: boolean
  currentName: string
  nextName: string
  renameError: string | null
  renaming: boolean
  onOpenChange: (open: boolean) => void
  onNextNameChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => Promise<void> | void
}

export default function RenameFolderModal({
  open,
  currentName,
  nextName,
  renameError,
  renaming,
  onOpenChange,
  onNextNameChange,
  onSubmit,
}: RenameFolderModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <div className="space-y-2">
            <ModalTitle>Rename folder</ModalTitle>
            <ModalDescription>
              Change the folder name for "{currentName}".
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
              <label
                htmlFor="rename-folder-name"
                className="block text-sm font-medium text-foreground"
              >
                New folder name
              </label>
              <input
                id="rename-folder-name"
                type="text"
                required
                value={nextName}
                onChange={(event) => onNextNameChange(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50"
                placeholder="example-folder"
                disabled={renaming}
              />
            </div>

            {renameError ? (
              <p className="text-sm text-destructive">{renameError}</p>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button type="submit" disabled={renaming}>
              {renaming ? "Renaming folder..." : "Rename folder"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
