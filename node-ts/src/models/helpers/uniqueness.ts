import { Model } from 'mongoose';

interface DuplicateCheckConfig<TSchema> {
  model: Model<TSchema>;
  filter: Record<string, unknown>;
  currentId: unknown;
  invalidate: (path: string, errorMsg: string) => void;
  path: string;
  message: string;
}

export async function invalidateIfDuplicate<TSchema>({
  model,
  filter,
  currentId,
  invalidate,
  path,
  message,
}: DuplicateCheckConfig<TSchema>): Promise<void> {
  const existing = await model.findOne(filter).select('_id').lean<{ _id?: unknown } | null>();

  if (!existing?._id) {
    return;
  }

  if (String(existing._id) !== String(currentId)) {
    invalidate(path, message);
  }
}
