export type NoticeRecord = {
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
