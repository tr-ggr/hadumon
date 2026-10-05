"use client";

import { useRouter } from "next/navigation";

import { Modal, TableButton } from "~/components/ui";
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
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      onClose();
      await utils.invalidate();
      router.push("/login");
      router.refresh();
    },
  });

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
            disabled={logout.isPending}
            onClick={onClose}
          >
            Stay
          </TableButton>
          <TableButton
            size="md"
            variant="danger"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {logout.isPending ? "Logging out…" : "Log out"}
          </TableButton>
        </>
      }
    >
      <p>
        A run in progress is saved. It will be where you left it when you log
        back in.
      </p>
      {logout.error ? (
        <p role="alert" className="text-coral mt-2 font-semibold">
          That did not work. Try again.
        </p>
      ) : null}
    </Modal>
  );
}
