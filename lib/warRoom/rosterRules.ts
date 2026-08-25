export const WAR_ROOM_ROSTER_RULES = {
  normal: 20,
  reserve: 3,
  taxi: 5,
} as const;

export type WarRoomRosterRuleKey = keyof typeof WAR_ROOM_ROSTER_RULES;

export function capacityDelta(current: number, limit: number): number {
  return current - limit;
}
