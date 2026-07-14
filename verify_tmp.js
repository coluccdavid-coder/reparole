const { JSDOM } = require('jsdom');
const fs = require('fs');
const dom = new JSDOM('<!DOCTYPE html><body></body>', { url:'http://localhost/', runScripts:'dangerously' });
const s1 = dom.window.document.createElement('script');
s1.textContent = fs.readFileSync('js/exercises.js','utf8');
dom.window.document.body.appendChild(s1);
const s2 = dom.window.document.createElement('script');
s2.textContent = fs.readFileSync('js/exercises-new-types.js','utf8');
dom.window.document.body.appendChild(s2);
const B = dom.window.BANK;
console.log('association levels:', Object.keys(B.association.items).map(l=>B.association.items[l].length));
console.log('syntax levels:', Object.keys(B.syntax.items).map(l=>B.syntax.items[l].length));
let problems = 0;
['association','syntax'].forEach(type=>{
  [1,2,3].forEach(lvl=>{
    B[type].items[lvl].forEach(it=>{
      if(!it.choices.includes(it.answer)) { problems++; console.log('MISSING ANSWER', type, lvl, it.answer); }
      if(new Set(it.choices).size !== it.choices.length) { problems++; console.log('DUP CHOICE', type, lvl, it.answer); }
    });
  });
});
console.log('integrity problems:', problems);
