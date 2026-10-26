import {resolve,relative,sep} from 'node:path';
export function publicPath(root,pathname) {
 const target=resolve(root,`.${pathname}`);
 const path=relative(root,target).split(sep).join('/');
 if(path.split('/').some(segment=>segment.startsWith('.')))return null;
 // Check after normalization so encoded traversal cannot expose source or Git files.
 return /^(?:$|index\.html$|(?:company|privacy|terms)(?:\/index\.html)?$|assets\/(?!.*(?:^|\/)\.)[^?]+$|locales\/[\w-]+\.json$|(?:script|theme-init|i18n)\.js$|styles\.css$)/.test(path)?target:null;
}
