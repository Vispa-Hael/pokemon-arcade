import {assetUrl} from './urls';
/** Offline character-art manifest, generated only after validating downloaded PNG files. */
import portraits from '../data/portraits.json';
export function portraitUrl(formId:number):string|null {
 const url=(portraits as Record<string,string>)[String(formId)]; return url?assetUrl(url):null;
}
