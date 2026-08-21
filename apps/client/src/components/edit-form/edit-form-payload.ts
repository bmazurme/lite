export type FormPayload = {
  title: string;
  type: string;
  preview: string;
  content: string;
  coverImage?: string;
  tags: string[];
  relatedNoteIds: number[];
  published: boolean;
  reviewedAt?: string | null;
};
