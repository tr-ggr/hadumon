"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal, TableButton } from "~/components/ui";
import { authClient } from "~/lib/auth-client";
import { api } from "~/trpc/react";

/**
 * Log out behind a confirm. Shared by the account bar and by the table, which
 * has no bar of its own.
 */
export function LogoutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const logOut = async () => {
    setFailed(false);
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
    } catch {
      setFailed(true);
      setPending(false);
      return;
    }
    onClose();
    await utils.invalidate();
    router.push("/login");
    router.refresh();
    setPending(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log out?"
      footer={
        <>
          <TableButton
            size="md"
            variant="secondary"
            data-autofocus
            disabled={pending}
            onClick={onClose}
          >
            Stay
          </TableButton>
          <TableButton
            size="md"
            variant="danger"
            disabled={pending}
            onClick={() => void logOut()}
          >
            {pending ? "Logging out…" : "Log out"}
          </TableButton>
        </>
      }
    >
      <p>
        A run in progress is saved. It will be where you left it when you log
        back in.
      </p>
      {failed ? (
        <p role="alert" className="mt-2 font-bold">
          That did not work. Try again.
        </p>
      ) : null}
    </Modal>
  );
}
