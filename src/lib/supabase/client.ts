import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Realtime Channel Subscriptions
export function subscribeToRealtimeTable(
  table: string,
  onPayload: (payload: any) => void
) {
  const channel = supabase
    .channel(`public:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => onPayload(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLeaderboardRealtime(onUpdate: (payload: any) => void) {
  return subscribeToRealtimeTable("leaderboard_scores", onUpdate);
}

export function subscribeToContestRealtime(onUpdate: (payload: any) => void) {
  return subscribeToRealtimeTable("contest_submissions", onUpdate);
}

export function subscribeToNotificationsRealtime(userId: string, onUpdate: (payload: any) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onUpdate(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToDiscussionsRealtime(onUpdate: (payload: any) => void) {
  return subscribeToRealtimeTable("discussion_posts", onUpdate);
}

export function subscribeToAnnouncementsRealtime(onUpdate: (payload: any) => void) {
  return subscribeToRealtimeTable("announcements", onUpdate);
}
