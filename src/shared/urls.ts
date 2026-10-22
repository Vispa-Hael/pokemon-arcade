/** Resolve public assets under root hosting or a GitHub Pages repository path. */
export function assetUrl(value:string):string { return import.meta.env.BASE_URL+value.replace(/^\//,''); }
