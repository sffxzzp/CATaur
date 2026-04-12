import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';

console.log("pdfParse object keys:", Object.keys(pdfParse));
console.log("typeof pdfParse:", typeof pdfParse);
const isFunc = typeof pdfParse === 'function';
const hasDefault = 'default' in pdfParse && typeof (pdfParse as any).default === 'function';

console.log("isFunc:", isFunc, "hasDefault:", hasDefault);
