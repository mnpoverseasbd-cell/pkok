import { NotImplementedError } from "@/core/errors";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationService = {
  async list(_userId: string): Promise<AppNotification[]> {
    return [];
  },
  async markRead(_userId: string, _ids: string[]): Promise<void> {
    throw new NotImplementedError("notificationService.markRead");
  },
};
