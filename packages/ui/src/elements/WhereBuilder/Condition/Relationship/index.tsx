'use client'
/* eslint-disable @typescript-eslint/no-floating-promises */
import type { PaginatedDocs } from 'payload/database'

import React, { useCallback, useEffect, useReducer, useState } from 'react'

import type { Option } from '../../../ReactSelect/types.js'
import type { GetResults, Props, ValueWithRelation } from './types.js'

import { useDebounce } from '../../../../hooks/useDebounce.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import './index.scss'
import optionsReducer from './optionsReducer.js'

const baseClass = 'condition-value-relationship'

const maxResultsPerRequest = 10

export const RelationshipField: React.FC<Props> = (props) => {
  const { admin: { isSortable } = {}, disabled, hasMany, onChange, relationTo, value } = props

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const hasMultipleRelations = Array.isArray(relationTo)
  const [options, dispatchOptions] = useReducer(optionsReducer, [])
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1)
  const [lastLoadedPage, setLastLoadedPage] = useState(1)
  const [search, setSearch] = useState('')
  const [errorLoading, setErrorLoading] = useState('')
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const { i18n, t } = useTranslation()

  const addOptions = useCallback(
    (data, relation) => {
      const collection = collections.find((coll) => coll.slug === relation)
      dispatchOptions({ type: 'ADD', collection, data, hasMultipleRelations, i18n, relation })
    },
    [collections, hasMultipleRelations, i18n],
  )

  const getResults = useCallback<GetResults>(
    async ({
      lastFullyLoadedRelation: lastFullyLoadedRelationArg,
      lastLoadedPage: lastLoadedPageArg,
      search: searchArg,
      // eslint-disable-next-line @typescript-eslint/require-await
    }) => {
      let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1
      const lastFullyLoadedRelationToUse =
        typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1

      const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
      const relationsToFetch =
        lastFullyLoadedRelationToUse === -1
          ? relations
          : relations.slice(lastFullyLoadedRelationToUse + 1)

      let resultsFetched = 0

      if (!errorLoading) {
        relationsToFetch.reduce(async (priorRelation, relation) => {
          await priorRelation

          if (resultsFetched < 10) {
            const collection = collections.find((coll) => coll.slug === relation)
            const fieldToSearch = collection?.admin?.useAsTitle || 'id'
            const searchParam = searchArg ? `&where[${fieldToSearch}][like]=${searchArg}` : ''

            const response = await fetch(
              `${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPageToUse}&depth=0${searchParam}`,
              {
                credentials: 'include',
                headers: {
                  'Accept-Language': i18n.language,
                },
              },
            )

            if (response.ok) {
              const data: PaginatedDocs = await response.json()
              if (data.docs.length > 0) {
                resultsFetched += data.docs.length
                addOptions(data, relation)
                setLastLoadedPage(data.page)

                if (!data.nextPage) {
                  setLastFullyLoadedRelation(relations.indexOf(relation))

                  // If there are more relations to search, need to reset lastLoadedPage to 1
                  // both locally within function and state
                  if (relations.indexOf(relation) + 1 < relations.length) {
                    lastLoadedPageToUse = 1
                  }
                }
              }
            } else {
              setErrorLoading(t('error:unspecific'))
            }
          }
        }, Promise.resolve())
      }
    },
    [i18n, relationTo, errorLoading, collections, serverURL, api, addOptions, t],
  )

  const findOptionsByValue = useCallback((): Option | Option[] => {
    if (value) {
      if (hasMany) {
        if (Array.isArray(value)) {
          return value.map((val) => {
            if (hasMultipleRelations) {
              let matchedOption: Option

              options.forEach((opt) => {
                if (opt.options) {
                  opt.options.some((subOpt) => {
                    if (subOpt?.relationTo === val.relationTo && subOpt?.value === val.value) {
                      matchedOption = subOpt
                      return true
                    }

                    return false
                  })
                }
              })

              return matchedOption
            }

            return options.find((opt) => opt.value === val)
          })
        }

        return undefined
      }

      if (hasMultipleRelations) {
        let matchedOption: Option

        const valueWithRelation = value as ValueWithRelation

        options.forEach((opt) => {
          if (opt?.options) {
            opt.options.some((subOpt) => {
              if (
                subOpt?.relationTo === valueWithRelation.relationTo &&
                subOpt?.value === valueWithRelation.value
              ) {
                matchedOption = subOpt
                return true
              }
              return false
            })
          }
        })

        return matchedOption
      }

      return options.find((opt) => opt.value === value)
    }

    return undefined
  }, [hasMany, hasMultipleRelations, options, value])

  const handleInputChange = useCallback(
    (newSearch) => {
      if (search !== newSearch) {
        setSearch(newSearch)
      }
    },
    [search],
  )

  const addOptionByID = useCallback(
    async (id, relation) => {
      if (!errorLoading && id !== 'null' && ['number', 'string'].includes(typeof id) && relation) {
        const response = await fetch(`${serverURL}${api}/${relation}/${id}?depth=0`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        })
        if (response.ok) {
          const data = await response.json()
          addOptions({ docs: [data] }, relation)
        } else {
          // eslint-disable-next-line no-console
          console.error(t('error:loadingDocument', { id }))
        }
      }
    },
    [i18n, addOptions, api, errorLoading, serverURL, t],
  )

  // ///////////////////////////
  // Get results when search input changes
  // ///////////////////////////

  useEffect(() => {
    dispatchOptions({
      type: 'CLEAR',
      i18n,
      required: true,
    })

    setHasLoadedFirstOptions(true)
    setLastLoadedPage(1)
    setLastFullyLoadedRelation(-1)
    getResults({ search: debouncedSearch })
  }, [getResults, debouncedSearch, relationTo, i18n])

  // ///////////////////////////
  // Format options once first options have been retrieved
  // ///////////////////////////

  useEffect(() => {
    if (value && hasLoadedFirstOptions) {
      if (hasMany) {
        const matchedOptions = findOptionsByValue()
        ;((matchedOptions as Option[]) || []).forEach((option, i) => {
          if (!option) {
            if (hasMultipleRelations) {
              addOptionByID(value[i].value, value[i].relationTo)
            } else {
              addOptionByID(value[i], relationTo)
            }
          }
        })
      } else {
        const matchedOption = findOptionsByValue()

        if (!matchedOption) {
          if (hasMultipleRelations) {
            const valueWithRelation = value as ValueWithRelation
            addOptionByID(valueWithRelation.value, valueWithRelation.relationTo)
          } else {
            addOptionByID(value, relationTo)
          }
        }
      }
    }
  }, [
    addOptionByID,
    findOptionsByValue,
    hasMany,
    hasMultipleRelations,
    relationTo,
    value,
    hasLoadedFirstOptions,
  ])

  const classes = ['field-type', baseClass, errorLoading && 'error-loading']
    .filter(Boolean)
    .join(' ')

  const valueToRender = (findOptionsByValue() || value) as Option

  return (
    <div className={classes}>
      {!errorLoading && (
        <ReactSelect
          disabled={disabled}
          getOptionValue={(option) => {
            if (!option) return undefined
            return hasMany && Array.isArray(relationTo)
              ? `${option.relationTo}_${option.value}`
              : option.value
          }}
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={(selected) => {
            if (!selected) {
              onChange(null)
              return
            }
            if (hasMany) {
              onChange(
                selected
                  ? selected.map((option) => {
                      if (hasMultipleRelations) {
                        return {
                          relationTo: option?.relationTo,
                          value: option?.value,
                        }
                      }

                      return option?.value
                    })
                  : null,
              )
            } else if (hasMultipleRelations) {
              onChange({
                relationTo: selected?.relationTo,
                value: selected?.value,
              })
            } else {
              onChange(selected?.value)
            }
          }}
          onInputChange={handleInputChange}
          onMenuScrollToBottom={() => {
            getResults({ lastFullyLoadedRelation, lastLoadedPage: lastLoadedPage + 1 })
          }}
          options={options}
          placeholder={t('general:selectValue')}
          value={valueToRender}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}
