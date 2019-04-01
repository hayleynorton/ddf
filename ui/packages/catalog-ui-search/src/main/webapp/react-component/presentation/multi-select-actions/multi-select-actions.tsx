/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details. A copy of the GNU Lesser General Public License is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
import { hot } from 'react-hot-loader'
import * as React from 'react'
import { Button, buttonTypeEnum } from '../button'
import styled from '../../styles/styled-components'
import { transparentize, readableColor } from 'polished'
import plugin from 'plugins/multi-select-actions'

type Props = {
  handleExport: () => void
  isDisabled: boolean
}

const Root = styled.div`
  border-left: 1px solid
    ${props =>
      transparentize(0.9, readableColor(props.theme.backgroundContent))};
  display: inline-block;
`

const MultiSelectButton = styled(Button)`
  min-width: calc(2.5 * ${props => props.theme.minimumButtonSize});
  padding: 0px 5px 0px 5px;
`

const disabledStyle = {
  cursor: 'not-allowed',
  opacity: 0.3,
}

type MultiSelectActionProps = {
  isDisabled: Boolean
  onClick: (props: any) => void
  disabledTitle: string
  enabledTitle: string
  icon: string
  text: string
}

export const MultiSelectAction = (props: MultiSelectActionProps) => (
  <Root>
    <MultiSelectButton
      buttonType={buttonTypeEnum.neutral}
      style={props.isDisabled ? disabledStyle : {}}
      onClick={
        !props.isDisabled
          ? props.onClick
          : () => {
              return null
            }
      }
      title={props.isDisabled ? props.disabledTitle : props.enabledTitle}
    >
      <span style={{ paddingRight: '5px' }} className={props.icon} />
      <span>{props.text}</span>
    </MultiSelectButton>
  </Root>
)

const Export = (props: Props) => (
  <MultiSelectAction
    isDisabled={props.isDisabled}
    onClick={props.handleExport}
    disabledTitle="Select one or more results to export."
    enabledTitle="Export selected result(s)."
    icon="fa fa-share"
    text="Export"
  />
)

const buttons = plugin([Export])

const render = (props: Props) => {
  return (
    <>
      {buttons.map((Component: any, i: number) => (
        <Component key={i} {...props} />
      ))}
    </>
  )
}

export default hot(module)(render)
