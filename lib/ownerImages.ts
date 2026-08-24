import { LCC_BRAND } from "@/lib/lccBrand";

export const DEFAULT_OWNER_IMAGE = LCC_BRAND.assets.headerBadge;

const OWNER_IMAGE_ID_OVERRIDES: Record<string, string> = {
  jay: "jay-g",
  "jay-g": "jay-g",
  junior: "junior-dukes",
  "junior-duke": "junior-dukes",
  "junior-dukes": "junior-dukes",
};

export function getOwnerImageId(ownerId: string): string {
  const normalizedOwnerId = ownerId.trim().toLowerCase();

  return OWNER_IMAGE_ID_OVERRIDES[normalizedOwnerId] ?? normalizedOwnerId;
}

export function getOwnerImagePath(ownerId: string): string {
  const ownerImageId = getOwnerImageId(ownerId);

  return ownerImageId ? `/owners/${ownerImageId}.png` : DEFAULT_OWNER_IMAGE;
}
