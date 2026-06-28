import { supabase } from '@/lib/supabase/client';

class QueryResult {
  docs: Array<{
    id: string;
    data: () => Record<string, unknown>;
    exists: () => boolean;
    ref: { id: string };
  }>;
  empty: boolean;
  size: number;

  constructor(docs: Array<Record<string, unknown>>) {
    this.empty = docs.length === 0;
    this.size = docs.length;
    this.docs = docs.map((doc) => ({
      id: String(doc.id),
      data: () => doc,
      exists: () => true,
      ref: { id: String(doc.id) },
    }));
  }

  forEach(callback: (doc: QueryResult['docs'][number]) => void) {
    this.docs.forEach((d) => callback(d));
  }
}

class SingleResult {
  id: string;
  _data: Record<string, unknown> | null;

  constructor(id: string, data: Record<string, unknown> | null) {
    this.id = id;
    this._data = data;
  }

  data() {
    return this._data;
  }

  exists() {
    return !!this._data;
  }
}

export function buildPath(_db: unknown, ...paths: string[]) {
  return paths;
}

export function buildQuery(collectionPath: unknown, ...constraints: unknown[]) {
  return { collectionPath, constraints };
}

export function filterBy(field: string, op: string, value: unknown) {
  return { type: 'where', field, op, value };
}

export function sortBy(field: string, direction = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limitTo(value: number) {
  return { type: 'limit', value };
}

async function applyQuery(collectionPath: string[], constraints: Array<Record<string, unknown>> = []) {
  let table = collectionPath[0];
  let isSubcollection = false;
  let parentId: string | null = null;

  if (collectionPath.length === 3) {
    table = collectionPath[2];
    parentId = collectionPath[1];
    isSubcollection = true;
  }

  let q = supabase.from(table).select('*');

  if (isSubcollection && parentId) {
    q = q.eq('school_id', parentId);
  }

  for (const c of constraints) {
    if (c.type === 'where') {
      if (c.op === '==') q = q.eq(String(c.field), c.value);
      if (c.op === '>=') q = q.gte(String(c.field), c.value);
      if (c.op === '<=') q = q.lte(String(c.field), c.value);
      if (c.op === '>') q = q.gt(String(c.field), c.value);
      if (c.op === '<') q = q.lt(String(c.field), c.value);
      if (c.op === 'in') q = q.in(String(c.field), c.value as string[]);
      if (c.op === 'array-contains') q = q.contains(String(c.field), [c.value]);
    } else if (c.type === 'orderBy') {
      q = q.order(String(c.field), { ascending: c.direction === 'asc' });
    } else if (c.type === 'limit') {
      q = q.limit(Number(c.value));
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error('Supabase query error:', error);
    return new QueryResult([]);
  }
  return new QueryResult((data as Array<Record<string, unknown>>) || []);
}

export async function fetchMany(queryOrPath: unknown) {
  if (Array.isArray(queryOrPath)) {
    return applyQuery(queryOrPath);
  }
  if (
    queryOrPath &&
    typeof queryOrPath === 'object' &&
    'collectionPath' in queryOrPath &&
    Array.isArray((queryOrPath as { collectionPath: string[] }).collectionPath)
  ) {
    const q = queryOrPath as { collectionPath: string[]; constraints?: Array<Record<string, unknown>> };
    return applyQuery(q.collectionPath, q.constraints ?? []);
  }
  return new QueryResult([]);
}

export async function fetchOne(docPath: string[]) {
  let table = docPath[0];
  let id = docPath[1];

  if (docPath.length === 4) {
    table = docPath[2];
    id = docPath[3];
  }

  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error || !data) {
    return new SingleResult(id, null);
  }
  return new SingleResult(id, data as Record<string, unknown>);
}

export async function upsertData(docPath: string[], data: Record<string, unknown>) {
  let table = docPath[0];
  let id = docPath[1];

  if (docPath.length === 4) {
    table = docPath[2];
    id = docPath[3];
    data.school_id = docPath[1];
  }

  data.id = id;
  const { error } = await supabase.from(table).upsert(data);
  if (error) throw error;
}

export async function insertData(collectionPath: string[], data: Record<string, unknown>) {
  let table = collectionPath[0];
  if (collectionPath.length === 3) {
    table = collectionPath[2];
    data.school_id = collectionPath[1];
  }

  const { data: res, error } = await supabase.from(table).insert(data).select().single();
  if (error) throw error;
  return { id: String(res.id) };
}

export async function patchData(docPath: string[], data: Record<string, unknown>) {
  let table = docPath[0];
  let id = docPath[1];

  if (docPath.length === 4) {
    table = docPath[2];
    id = docPath[3];
  }

  const { error } = await supabase.from(table).update(data).eq('id', id);
  if (error) throw error;
}

export async function removeData(docPath: string[]) {
  let table = docPath[0];
  let id = docPath[1];

  if (docPath.length === 4) {
    table = docPath[2];
    id = docPath[3];
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export function subscribeData(
  queryOrDoc: unknown,
  onNext: (value: unknown) => void,
  onError?: (err: unknown) => void,
) {
  const isDoc =
    Array.isArray(queryOrDoc) && (queryOrDoc.length === 2 || queryOrDoc.length === 4);

  if (isDoc) {
    fetchOne(queryOrDoc)
      .then((doc) => onNext(doc))
      .catch((e) => onError?.(e));
  } else {
    fetchMany(queryOrDoc)
      .then((snap) => onNext(snap))
      .catch((e) => onError?.(e));
  }

  return () => {};
}

export function getTimestamp() {
  return new Date().toISOString();
}

export function incrementValue(n: number) {
  return n;
}

export const db = {};
export const auth = {};
