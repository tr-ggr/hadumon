"use client";

import { Profile, ProfileFrame } from "~/components/profile/Profile";
import { ProfileSkeleton } from "~/components/profile/ProfileSkeleton";
import { Board, TableButton } from "~/components/ui";
import { api } from "~/trpc/react";

/**
 * The profile, a room in the tower: the player's hadu and everything it can
 * wear. Once the profile has come it is `Profile`'s to show; until then the
 * page keeps its shape in blanks, or says what went wrong and asks again.
 */
export function ProfileView() {
  // Coins and pieces are gained on other pages, so ask again on arriving.
  const profile = api.profile.get.useQuery(undefined, {
    refetchOnMount: "always",
    retry: 1,
  });

  if (profile.data) return <Profile profile={profile.data} />;
  if (!profile.error) return <ProfileSkeleton />;

  return (
    <ProfileFrame aside={null}>
      <Board title="Nobody is home">
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm">
            Your profile could not be loaded: {profile.error.message}
          </p>
          <TableButton
            size="md"
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
          >
            {profile.isFetching ? "Trying…" : "Try again"}
          </TableButton>
        </div>
      </Board>
    </ProfileFrame>
  );
}
