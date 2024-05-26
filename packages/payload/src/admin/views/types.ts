import type { ClientTranslationsObject } from '@payloadcms/translations'

import type { Permissions } from '../../auth/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Locale } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequestWithData } from '../../types/index.js'

type ComponentFn = <C>(
  C: C,
) => (C & { use_Component_helper_exported_from_payload_utilities: string }) | null

export const Component: ComponentFn = (c) => c as any

export type AdminViewConfig = {
  Component: AdminViewComponent //& { use_Component_helper_exported_from_payload_utilities: string }
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  path: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewProps = {
  initPageResult: InitPageResult
  params?: { [key: string]: string | string[] | undefined }
  searchParams: { [key: string]: string | string[] | undefined }
}

export type AdminViewComponent = React.ComponentType<AdminViewProps>

export type AdminView = AdminViewComponent | AdminViewConfig

export type EditViewProps = {
  collectionSlug?: string
  globalSlug?: string
}

export type VisibleEntities = {
  collections: SanitizedCollectionConfig['slug'][]
  globals: SanitizedGlobalConfig['slug'][]
}

export type InitPageResult = {
  collectionConfig?: SanitizedCollectionConfig
  cookies: Map<string, string>
  docID?: string
  globalConfig?: SanitizedGlobalConfig
  locale: Locale
  permissions: Permissions
  req: PayloadRequestWithData
  translations: ClientTranslationsObject
  visibleEntities: VisibleEntities
}

export type ServerSideEditViewProps = {
  initPageResult: InitPageResult
  params: { [key: string]: string | string[] | undefined }
  routeSegments: string[]
  searchParams: { [key: string]: string | string[] | undefined }
}
