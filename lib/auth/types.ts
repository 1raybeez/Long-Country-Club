export const LCC_CAPABILITIES = [
  'commissioner',
  'war-room',
  'finance-admin',
  'governance-admin',
  'maintenance-admin',
  'post-draft-admin',
] as const;

export type LccCapability = (typeof LCC_CAPABILITIES)[number];

export interface AuthenticatedIdentity {
  readonly uid: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly picture: string | null;
}

export interface LccMemberIdentity {
  readonly memberId: string;
  readonly displayName: string;
  readonly teamName: string;
  readonly ownerId: string;
  readonly capabilities: readonly LccCapability[];
}

export interface LccMemberSession {
  readonly identity: AuthenticatedIdentity;
  readonly member: LccMemberIdentity | null;
}
