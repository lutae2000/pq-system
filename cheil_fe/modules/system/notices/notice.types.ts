export type NoticeRecord = {
  type: "system" | "bid_notice_changed" | string;
  active: boolean;
  content: string;
  exposureEndAt: string;
  exposureStartAt: string;
  id: string;
  important: boolean;
  publishAt: string;
  title: string;
  targetPath?: string | null;
};
