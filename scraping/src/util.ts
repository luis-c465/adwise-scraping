export function reduceObject<T>(objects: T[]): T {
  return objects.reduce((o, i) => {
    const [key, value] = Object.entries(i)[0];
    return Object.assign(o, { [key]: value });
  }, {}) as T;
}

export function normalizeString(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
