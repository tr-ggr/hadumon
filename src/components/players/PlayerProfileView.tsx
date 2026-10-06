"use client";

import { Mirror, ProfileFrame } from "~/components/profile/Profile";
import { When } from "~/components/runs/When";
import {
  Board,
  BoardSkeleton,
  Skeleton,
  TableButton,
  TableLink,
} from "~/components/ui";
import { api } from "~/trpc/react";

import {
  AchievementsBoard,
  RecentRunsBoard,
  ShareButton,
  StatsBoard,
} from "./PlayerBoards";

/**
 * A player's profile as anyone sees it, at `/players/<handle>`: their hadu,
 * their record, their achievements and, if they show them, their runs. The
 * player looking at their own has the way to dress it.
 */
export function PlayerProfileView({ handle }: { handle: string }) {
  const profile = api.players.profile.useQuery(
    { handle },
    { refetchOnMount: "always", retry: 1 },
  );

  if (profile.isPending) return <PlayerSkeleton />;
  if (profile.error) {
    const missing = profile.error.data?.code === "NOT_FOUND";
    return (
      <ProfileFrame title="Player" aside={null}>
        <Board title={missing ? "Nobody by that name" : "Nobody is home"}>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm">
              {missing
                ? `There is no player called ${handle}. The link may be old.`
                : `This profile could not be loaded: ${profile.error.message}`}
            </p>
            {missing ? (
              <TableLink href="/players" size="md">
                Find a player
              </TableLink>
            ) : (
              <TableButton
                size="md"
                disabled={profile.isFetching}
                onClick={() => void profile.refetch()}
              >
                {profile.isFetching ? "Trying…" : "Try again"}
              </TableButton>
            )}
          </div>
        </Board>
      </ProfileFrame>
    );
  }

  const player = profile.data;
  const path = `/players/${player.handle}`;
  return (
    <ProfileFrame
      title={player.isSelf ? "Your profile" : player.name}
      aside={
        <Mirror name={player.name} look={player.look} own={player.isSelf}>
          <p className="text-ink-soft text-xs font-bold">
            Joined <When date={player.joinedAt} />
          </p>
          <div className="flex flex-wrap gap-2">
            <ShareButton path={path} />
            {player.isSelf ? (
              <TableLink href="/profile" size="sm">
                Dress your hadu
              </TableLink>
            ) : null}
          </div>
        </Mirror>
      }
    >
      <StatsBoard stats={player.stats} />
      <RecentRunsBoard
        runs={player.recentRuns}
        allHref={`${path}/runs`}
        name={player.name}
        isSelf={player.isSelf}
      />
      <AchievementsBoard held={player.achievements} />
    </ProfileFrame>
  );
}

function PlayerSkeleton() {
  return (
    <ProfileFrame
      title="Player"
      aside={
        <div
          role="status"
          aria-busy="true"
          className="mat flex w-full items-center gap-4 p-5 lg:flex-col"
        >
          <span className="sr-only">Loading the profile…</span>
          <Skeleton className="h-32 w-32 lg:h-40 lg:w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
      }
    >
      <BoardSkeleton title="Record" lines={2} />
      <BoardSkeleton title="Runs" lines={4} />
      <BoardSkeleton title="Achievements" lines={4} />
    </ProfileFrame>
  );
}
