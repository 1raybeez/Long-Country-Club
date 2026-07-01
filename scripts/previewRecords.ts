import { loadAllRecords } from "../lib/history/records";

const records = loadAllRecords();

console.log("LCC Records Preview");
console.log("===================");
console.log(`Total Records: ${records.length}`);
console.log("");

records.slice(0, 25).forEach((record) => {
  console.log(
    `${record.category} | ${record.ownerId} | ${record.value}`
  );
});