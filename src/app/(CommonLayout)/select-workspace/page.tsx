"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Stethoscope, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { toast } from "@/components/ui/use-toast";

interface WorkspaceOption {
  id: string;
  name: string;
  slug?: string;
  type: "PERSONAL" | "INSTITUTION";
  role?: string;
  membershipStatus?: string;
}

export default function SelectWorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<any>(API_ROUTES.WORKSPACES.LIST);
        const data: WorkspaceOption[] = res.data?.data || res.data || [];
        setWorkspaces(data);
        if (data.length === 0) {
          setError("No workspaces are available for this account.");
        }
      } catch (e: any) {
        setError(
          e?.response?.data?.message || "Failed to load your workspaces.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const choose = async (ws: WorkspaceOption) => {
    setSwitchingId(ws.id);
    try {
      await apiClient.post("/auth/switch-workspace", { workspaceId: ws.id });
      localStorage.setItem("activeWorkspaceId", ws.id);
      router.push("/dashboard");
    } catch (e: any) {
      toast({
        title: "Workspace Switch Error",
        description:
          e?.response?.data?.message || "Failed to switch workspace.",
        variant: "destructive",
      });
      setSwitchingId(null);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-surface">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-on-surface">
            Choose a workspace
          </h1>
          <p className="text-on-surface-variant">
            You have access to more than one workspace. Select the one you want
            to work in — you can switch again at any time from the sidebar.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading workspaces…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-error/20 bg-error-container/30 p-4 text-sm font-semibold text-error">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((ws) => {
            const Icon = ws.type === "INSTITUTION" ? Building2 : Stethoscope;
            const isBusy = switchingId === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => choose(ws)}
                disabled={switchingId !== null}
                className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary hover:bg-surface-container disabled:opacity-60"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isBusy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-on-surface">
                    {ws.name}
                  </span>
                  <span className="block text-xs capitalize text-on-surface-variant">
                    {ws.type?.toLowerCase()}
                    {ws.role ? ` · ${ws.role.toLowerCase()}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
