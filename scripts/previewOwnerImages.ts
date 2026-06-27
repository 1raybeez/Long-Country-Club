import { existsSync, readdirSync } from "fs";
import { basename, extname, join } from "path";

import { ALL_LCC_OWNERS } from "../lib/lccOwners";
import { getOwnerImageId, getOwnerImagePath } from "../lib/ownerImages";

const OWNER_IMAGE_DIR = join(process.cwd(), "public", "owners");
const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

type OwnerImageRecord = {
  ownerId: string;
  imageId: string;
  displayName: string;
  publicPath: string;
};

const ownerImageRecords: OwnerImageRecord[] = ALL_LCC_OWNERS.map((owner) => {
  const imageId = getOwnerImageId(owner.id);

  return {
    ownerId: owner.id,
    imageId,
    displayName: owner.displayName,
    publicPath: getOwnerImagePath(owner.id),
  };
});

const imageFiles = existsSync(OWNER_IMAGE_DIR)
  ? readdirSync(OWNER_IMAGE_DIR).filter((file) =>
      IMAGE_EXTENSIONS.has(extname(file).toLowerCase())
    )
  : [];

const imageFilesById = new Map(
  imageFiles.map((file) => [basename(file, extname(file)), file])
);
const expectedImageIds = new Set(
  ownerImageRecords.map((record) => record.imageId)
);

const ownersWithImages = ownerImageRecords.filter((record) =>
  imageFilesById.has(record.imageId)
);
const ownersMissingImages = ownerImageRecords.filter(
  (record) => !imageFilesById.has(record.imageId)
);
const imageFilesWithoutOwners = imageFiles.filter(
  (file) => !expectedImageIds.has(basename(file, extname(file)))
);

printOwnerImageReport();

if (ownersMissingImages.length || imageFilesWithoutOwners.length) {
  process.exitCode = 1;
}

function printOwnerImageReport() {
  printSection(
    `Owner IDs with images found (${ownersWithImages.length})`,
    ownersWithImages.map(formatOwnerImageRecord)
  );
  printSection(
    `Owner IDs missing images (${ownersMissingImages.length})`,
    ownersMissingImages.map(formatOwnerImageRecord)
  );
  printSection(
    `Image files with no matching owner ID (${imageFilesWithoutOwners.length})`,
    imageFilesWithoutOwners
  );
}

function printSection(title: string, lines: readonly string[]) {
  console.log(title);

  if (!lines.length) {
    console.log("- None");
    return;
  }

  lines.forEach((line) => console.log(`- ${line}`));
}

function formatOwnerImageRecord(record: OwnerImageRecord) {
  const ownerLabel =
    record.ownerId === record.imageId
      ? record.ownerId
      : `${record.ownerId} -> ${record.imageId}`;

  return `${ownerLabel} (${record.displayName}): ${record.publicPath}`;
}
