const ENABLE_TRACE = true;

interface QueryTrace {
  repository: string;
  collection: string;
  where?: [string, string, unknown][];
  orderBy?: [string, string][];
  limit?: number;
  cursor?: string;
}

export function traceQuery(def: QueryTrace) {
  if (!ENABLE_TRACE) return;
  console.group(`[Repository] ${def.repository} → ${def.collection}`);
  if (def.where?.length) console.log('  where:', def.where);
  if (def.orderBy?.length) console.log('  orderBy:', def.orderBy);
  if (def.limit) console.log('  limit:', def.limit);
  if (def.cursor) console.log('  cursor:', def.cursor);
  console.groupEnd();
}

export function traceQueryError(
  repository: string,
  collection: string,
  def: Record<string, unknown>,
  err: unknown,
) {
  console.error('[Firestore Query Failed]', {
    repository,
    collection,
    queryDefinition: def,
    error: (err as Error)?.message ?? String(err),
  });
}

export function traceMutation(repository: string, collection: string, operation: string) {
  if (!ENABLE_TRACE) return;
  console.log(`[Repository] ${repository} → ${operation} ${collection}`);
}
