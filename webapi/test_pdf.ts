import * as pdfParseModule from 'pdf-parse';

let parsePdf: any = pdfParseModule;
if (typeof parsePdf !== 'function') {
    if (typeof parsePdf.default === 'function') {
        parsePdf = parsePdf.default;
    } else if (typeof parsePdf.PDFParse === 'function') {
        parsePdf = parsePdf.PDFParse;
    } else if (parsePdf.default && typeof parsePdf.default.PDFParse === 'function') {
        parsePdf = parsePdf.default.PDFParse;
    }
}

console.log("parsePdf is a function?", typeof parsePdf === 'function');
