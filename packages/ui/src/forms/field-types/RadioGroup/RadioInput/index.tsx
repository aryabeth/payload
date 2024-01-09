'use client'
import React from 'react'
import { useTranslation } from '../../../../providers/Translation'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import './index.scss'

const baseClass = 'radio-input'

const RadioInput: React.FC<Props> = (props) => {
  const { isSelected, onChange, option, path } = props
  const { i18n } = useTranslation()

  const classes = [baseClass, isSelected && `${baseClass}--is-selected`].filter(Boolean).join(' ')

  const id = `field-${path}-${option.value}`

  return (
    <label htmlFor={id}>
      <div className={classes}>
        <input
          checked={isSelected}
          id={id}
          onChange={() => (typeof onChange === 'function' ? onChange(option.value) : null)}
          type="radio"
        />
        <span className={`${baseClass}__styled-radio`} />
        <span className={`${baseClass}__label`}>{getTranslation(option.label, i18n)}</span>
      </div>
    </label>
  )
}

export default RadioInput