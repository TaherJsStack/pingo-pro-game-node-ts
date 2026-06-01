import { Schema } from 'mongoose';
import { invalidateIfDuplicate } from '../helpers/uniqueness';

interface UniquePerBranchOptions {
  path: string;
  scope?: string;
  message: string;
}

type UniqueScopeDocument = {
  _id: unknown;
  isModified(path: string): boolean;
  invalidate(path: string, message: string): void;
  [key: string]: unknown;
};

export function uniquePerBranch(schema: Schema, options: UniquePerBranchOptions): void {
  const scope = options.scope ?? 'brancheId';

  schema.pre('validate', async function (next) {
    const doc = this as UniqueScopeDocument;

    if (!doc.isModified(options.path) && !doc.isModified(scope)) {
      return next();
    }

    const model = doc.constructor as any;
    await invalidateIfDuplicate({
      model,
      filter: {
        [options.path]: doc[options.path],
        [scope]: doc[scope],
      },
      currentId: doc._id,
      invalidate: doc.invalidate.bind(doc),
      path: options.path,
      message: options.message,
    });

    next();
  });
}
