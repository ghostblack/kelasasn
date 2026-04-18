function parseNum(s) {
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function extractNums(line) {
  return [...line.matchAll(/(\d{1,4}(?:[.,]\d{1,4})?)/g)]
    .map(m => parseNum(m[1]))
    .filter((n) => n !== null);
}

function extractNumsAfterKeyword(line, kwPattern) {
  const match = line.match(kwPattern);
  if (!match || match.index === undefined) return [];
  const afterText = line.slice(match.index + match[0].length);
  return extractNums(afterText);
}

const line1 = "1 1. Tes Wawasan Kebangsaan (TWK) 120";
console.log("TWK:", extractNumsAfterKeyword(line1, /wawasan kebangsaan|\(?TWK\)?/i));

const line2 = "2. Tes Intelegensia Umum (TIU) 165 483 87.818 35.127";
console.log("TIU:", extractNumsAfterKeyword(line2, /intelegensia umum|\(?TIU\)?/i));
