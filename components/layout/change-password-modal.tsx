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

type ChangePasswordModalProps = {
  open: boolean
  newPassword: string
  changingPassword: boolean
  passwordError: string | null
  onOpenChange: (open: boolean) => void
  onNewPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => Promise<void> | void
}

export default function ChangePasswordModal({
  open,
  newPassword,
  changingPassword,
  passwordError,
  onOpenChange,
  onNewPasswordChange,
  onSubmit,
}: ChangePasswordModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} dismissible>
      <ModalContent>
        <ModalHeader>
          <div className="space-y-2">
            <ModalTitle>Change password</ModalTitle>
            <ModalDescription>
              Set a new password for your account.
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
                htmlFor="new-password"
                className="block text-sm font-medium text-foreground"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50"
                placeholder="Enter a new password"
              />
            </div>

            {passwordError ? (
              <p className="text-sm text-destructive">{passwordError}</p>
            ) : null}
          </ModalBody>

          <ModalFooter className="justify-end">
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Updating password..." : "Update password"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
