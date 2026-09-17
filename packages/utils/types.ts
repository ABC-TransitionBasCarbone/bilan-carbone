import {
  Role,
  RoleMip,
} from '@abc-transitionbascarbone/db-common/enums'

export type RoleBcOrMip = Role | RoleMip

export type DeepPartial<T> = T extends Date
  ? T
  : T extends (infer Item)[]
    ? DeepPartial<Item>[]
    : T extends object
      ? { [Property in keyof T]?: DeepPartial<T[Property]> }
      : T