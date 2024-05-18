import type { Payload } from 'payload'
import type { Field, PayloadRequestWithData } from 'payload/types'

import type { PostgresAdapter } from '../../../types.js'
import type { DocsToResave } from '../types.js'

import { upsertRow } from '../../../upsertRow/index.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  collectionSlug?: string
  db: PostgresAdapter
  debug: boolean
  docsToResave: DocsToResave
  dryRun: boolean
  fields: Field[]
  globalSlug?: string
  isVersions: boolean
  payload: Payload
  req: PayloadRequestWithData
  tableName: string
}

export const fetchAndResave = async ({
  collectionSlug,
  db,
  debug,
  docsToResave,
  dryRun,
  fields,
  globalSlug,
  isVersions,
  payload,
  req,
  tableName,
}: Args) => {
  for (const [id, rows] of Object.entries(docsToResave)) {
    if (collectionSlug) {
      const collectionConfig = payload.collections[collectionSlug].config

      if (collectionConfig) {
        if (isVersions) {
          const { docs } = await payload.findVersions({
            collection: collectionSlug,
            depth: 0,
            fallbackLocale: null,
            limit: 0,
            locale: 'all',
            showHiddenFields: true,
            where: {
              parent: {
                equals: id,
              },
            },
          })

          if (debug) {
            payload.logger.info(
              `${docs.length} collection "${collectionConfig.slug}" versions will be migrated`,
            )
          }

          for (const doc of docs) {
            traverseFields({
              doc,
              fields,
              path: '',
              rows,
            })

            if (!dryRun) {
              try {
                await upsertRow({
                  id: doc.id,
                  adapter: db,
                  data: doc,
                  db: db.drizzle,
                  fields,
                  operation: 'update',
                  req,
                  tableName,
                })
              } catch (err) {
                payload.logger.error(
                  `"${collectionConfig.slug}" version with ID ${doc.id} FAILED TO MIGRATE`,
                )

                throw err
              }
            }

            if (debug) {
              payload.logger.info(
                `"${collectionConfig.slug}" version with ID ${doc.id} migrated successfully!`,
              )
            }
          }
        } else {
          const doc = await payload.findByID({
            id,
            collection: collectionSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
          })

          if (debug) {
            payload.logger.info(
              `The collection "${collectionConfig.slug}" with ID ${doc.id} will be migrated`,
            )
          }

          traverseFields({
            doc,
            fields,
            path: '',
            rows,
          })

          if (!dryRun) {
            try {
              await upsertRow({
                id: doc.id,
                adapter: db,
                data: doc,
                db: db.drizzle,
                fields,
                operation: 'update',
                req,
                tableName,
              })
            } catch (err) {
              payload.logger.error(
                `The collection "${collectionConfig.slug}" with ID ${doc.id} has FAILED TO MIGRATE`,
              )

              throw err
            }
          }

          if (debug) {
            payload.logger.info(
              `The collection "${collectionConfig.slug}" with ID ${doc.id} has migrated successfully!`,
            )
          }
        }
      }
    }

    if (globalSlug) {
      const globalConfig = payload.config.globals?.find((global) => global.slug === globalSlug)

      if (globalConfig) {
        if (isVersions) {
          const { docs } = await payload.findGlobalVersions({
            slug: globalSlug,
            depth: 0,
            fallbackLocale: null,
            limit: 0,
            locale: 'all',
            showHiddenFields: true,
          })

          if (debug) {
            payload.logger.info(`${docs.length} global "${globalSlug}" versions will be migrated`)
          }

          for (const doc of docs) {
            traverseFields({
              doc,
              fields,
              path: '',
              rows,
            })

            if (!dryRun) {
              try {
                await upsertRow({
                  id: doc.id,
                  adapter: db,
                  data: doc,
                  db: db.drizzle,
                  fields,
                  operation: 'update',
                  req,
                  tableName,
                })
              } catch (err) {
                payload.logger.error(`"${globalSlug}" version with ID ${doc.id} FAILED TO MIGRATE`)

                throw err
              }
            }

            if (debug) {
              payload.logger.info(
                `"${globalSlug}" version with ID ${doc.id} migrated successfully!`,
              )
            }
          }
        } else {
          const doc = await payload.findGlobal({
            slug: globalSlug,
            depth: 0,
            fallbackLocale: null,
            locale: 'all',
            showHiddenFields: true,
          })

          traverseFields({
            doc,
            fields,
            path: '',
            rows,
          })

          if (!dryRun) {
            try {
              await upsertRow({
                id: doc.id,
                adapter: db,
                data: doc,
                db: db.drizzle,
                fields,
                operation: 'update',
                req,
                tableName,
              })
            } catch (err) {
              payload.logger.error(`The global "${globalSlug}" has FAILED TO MIGRATE`)

              throw err
            }
          }

          if (debug) {
            payload.logger.info(`The global "${globalSlug}" has migrated successfully!`)
          }
        }
      }
    }
  }
}