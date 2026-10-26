import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source = await readFile(new URL('../theme-init.js', import.meta.url), 'utf8');
test('theme bootstrap handles stored choice, system fallback and unavailable storage', () => {
 for (const [saved, systemDark, blocked, expected] of [
  ['dark', false, false, 'dark'], ['light', true, false, 'light'],
  ['system', true, false, 'dark'], [null, false, false, 'light'],
  ['invalid', true, false, 'dark'], [null, true, true, 'dark'],
 ]) {
  const root = {dataset:{}};
  const meta = {};
  runInNewContext(source, {
   document: {documentElement:root, querySelector:()=>meta},
   localStorage:{getItem:()=>{if(blocked)throw new Error('Denied');return saved;}},
   matchMedia:()=>({matches:systemDark}),
  });
  assert.equal(root.dataset.theme, expected);
  assert.equal(meta.content, expected==='dark'?'#171c16':'#f5f5ef');
 }
});
