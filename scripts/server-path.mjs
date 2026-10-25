import {resolve,relative,sep} from 'node:path';
export function publicPath(root,pathname) {
 const target=resolve(root,`.${pathname}`);
 const path=relative(root,target).split(sep).join('/');
 // Check after normalization so encoded traversal cannot expose source or Git files.
 return /^(?:$|index\.html$|(?:company|privacy|terms)(?:\/index\.html)?$|assets\/(?!.*(?:^|\/)\.)[^?]+$|locales\/[\w-]+\.json$|(?:script|i18n)\.js$|styles\.css$)/.test(path)?target:null;
}
