/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
const React = require('react')
const Group = require('../../../react-component/group/index.js')
const MaskedInput = require('react-text-mask').default
const CustomElements = require('../../../js/CustomElements.js')
const Component = CustomElements.registerReact('text-field')

class MaskedTextField extends React.Component {

  padDecimalWithZeros(value) {
    const decimal = value.toString().split('\'')
    const decimalParts = decimal[1].toString().split('.')
    const decimalEnd = decimalParts[1].replace('\"', '')
    if (decimalParts.length > 1) {
      return `${decimal[0]}'${decimalParts[0]}.${decimalEnd.padEnd(3, '0')}"`
    }
    return value
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    const { label, addon, onChange, ...args } = this.props
    const value = this.padDecimalWithZeros(this.props.value)
    return (
      <Component>
        <Group>
          {label != null ? (
            <span className="input-group-addon">
              {label}
              &nbsp;
            </span>
          ) : null}
          <MaskedInput
            value={value}
            
            onChange={e => {
              this.props.onChange(e.target.value)
            }}
            render={(setRef, { defaultValue, ...props }) => {
              return (
                <input
                  ref={ref => {
                    setRef(ref)
                    this.ref = ref
                  }}
                  value={defaultValue || ''}
                  {...props}
                />
              )
            }}
            {...args}
          />
          {addon != null ? (
            <label className="input-group-addon">{addon}</label>
          ) : null}
        </Group>
      </Component>
    )
  }
}

module.exports = MaskedTextField
