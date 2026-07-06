import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications.functions";
import { formatDistanceToNow } from "@/lib/format-time";

export function NotificationsBell() {
  const load = useServerFn(getMyNotifications);
  const markAll = useServerFn(markAllNotificationsRead);
  const markOne = useServerFn(markNotificationRead);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => load({ data: { limit: 20 } }),
    refetchInterval: 60_000,
  });

  const markAllMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOneMut = useMutation({
    mutationFn: (id: string) => markOne({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending}
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            items.map((n) => {
              const isUnread = !n.read_at;
              const content = (
                <div className="flex gap-2 px-3 py-2">
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      isUnread ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {formatDistanceToNow(n.created_at)}
                    </p>
                  </div>
                </div>
              );
              const cls = `block cursor-pointer border-b hover:bg-muted ${
                isUnread ? "bg-muted/40" : ""
              }`;
              return n.link ? (
                <Link
                  key={n.id}
                  to={n.link}
                  className={cls}
                  onClick={() => isUnread && markOneMut.mutate(n.id)}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  className={`${cls} w-full text-left`}
                  onClick={() => isUnread && markOneMut.mutate(n.id)}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
