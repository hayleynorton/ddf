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
import { InvalidSearchFormMessage } from '../../../component/announcement/CommonMessages'
import styled from 'styled-components'
const announcement = require('../../../component/announcement/index.jsx')
const {
  validateInput,
} = require('../../../component/location-new/utils/dms-utils')
const usngs = require('usng.js')
const converter = new usngs.Converter()

interface ErrorState {
  error: boolean
  message: string
}

export function showErrorMessages(errors: any) {
  if (errors.length === 0) {
    return
  }
  let searchErrorMessage = JSON.parse(JSON.stringify(InvalidSearchFormMessage))
  if (errors.length > 1) {
    let msg = searchErrorMessage.message
    searchErrorMessage.title =
      'Your search cannot be run due to multiple errors'
    const formattedErrors = errors.map(
      (error: any) => `\u2022 ${error.title}: ${error.body}`
    )
    searchErrorMessage.message = msg.concat(formattedErrors)
  } else {
    const error = errors[0]
    searchErrorMessage.title = error.title
    searchErrorMessage.message = error.body
  }
  announcement.announce(searchErrorMessage)
}

export function getFilterErrors(filters: any) {
  const errors = new Set()
  let geometryErrors = new Set<string>()
  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i]
    getGeometryErrors(filter).forEach(function(msg) {
      geometryErrors.add(msg)
    })
  }
  geometryErrors.forEach(function(err) {
    errors.add({
      title: 'Invalid geometry filter',
      body: err,
    })
  })
  return Array.from(errors)
}

function getGeometryErrors(filter: any): Set<string> {
  const geometry = filter.geojson && filter.geojson.geometry
  const bufferWidth =
    filter.geojson.properties.buffer && filter.geojson.properties.buffer.width
  const errors = new Set<string>()
  if (!geometry) {
    return errors
  }
  switch (filter.geojson.properties.type) {
    case 'Polygon':
      if (geometry.coordinates[0].length < 4) {
        errors.add(
          'Polygon coordinates must be in the form [[x,y],[x,y],[x,y],[x,y], ... ]'
        )
      }
      break
    case 'LineString':
      if (geometry.coordinates.length < 2) {
        errors.add('Line coordinates must be in the form [[x,y],[x,y], ... ]')
      }
      if (!bufferWidth || bufferWidth == 0) {
        errors.add('Line buffer width must be greater than 0.000001')
      }
      break
    case 'Point':
      if (!bufferWidth || bufferWidth < 0.000001) {
        errors.add('Radius must be greater than 0.000001')
      }
      if (
        geometry.coordinates.some(
          (coord: any) => !coord || coord.toString().length == 0
        )
      ) {
        errors.add('Coordinates must not be empty')
      }
      break
    case 'BoundingBox':
      const box = filter.geojson.properties
      if (!box.east || !box.west || !box.north || !box.south) {
        errors.add('Bounding Box must have valid values')
      }
      break
  }
  return errors
}

export function validateGeo(
  key: string,
  value: string,
  value1?: any,
  value2?: any,
  value3?: any
) {
  switch (key) {
    case 'lat':
    case 'north':
    case 'south':
      return validateDDLatLon('latitude', 90, value)
    case 'lon':
    case 'west':
    case 'east':
      return validateDDLatLon('longitude', 180, value)
    case 'dmsLat':
    case 'dmsNorth':
    case 'dmsSouth':
      return validateDmsLatLon('latitude', value)
    case 'dmsLon':
    case 'dmsEast':
    case 'dmsWest':
      return validateDmsLatLon('longitude', value)
    case 'usng':
      return validateUsng(value)
    case 'utm':
      return validateUtmUps(value, value1, value2, value3)
    case 'radius':
    case 'lineWidth':
      return validateRadiusLineBuffer(key, value)
    default:
  }
}

function validateDDLatLon(label: string, defaultCoord: number, value: string) {
  let message = ''
  let defaultValue
  if (value !== undefined && value.length === 0) {
    message = `${label.replace(/^\w/, c => c.toUpperCase())} cannot be empty`
    return { error: true, message, defaultValue }
  }
  if (Number(value) > defaultCoord || Number(value) < -1 * defaultCoord) {
    defaultValue = Number(value) > 0 ? defaultCoord : -1 * defaultCoord
    message = `${value.replace(
      /_/g,
      '0'
    )} is not an acceptable ${label} value. Defaulting to ${defaultValue}`
    return { error: true, message, defaultValue }
  }
  return { error: false, message, defaultValue }
}

function validateDmsLatLon(label: string, value: string) {
  let message = ''
  let defaultValue
  const validator = label === 'latitude' ? 'dd°mm\'ss.s"' : 'ddd°mm\'ss.s"'
  if (value !== undefined && value.length === 0) {
    message = `${label.replace(/^\w/, c => c.toUpperCase())} cannot be empty`
    return { error: true, message, defaultValue }
  }
  if (validateInput(value, validator) !== value) {
    defaultValue = validateInput(value, validator)
    message = `${value.replace(
      /_/g,
      '0'
    )} is not an acceptable ${label} value. Defaulting to ${defaultValue}`
    return { error: true, message, defaultValue }
  }
  return { error: false, message, defaultValue }
}

function validateUsng(value: string) {
  if (value === '') {
    return { error: true, message: 'USNG / MGRS coordinates cannot be empty' }
  }
  const result = converter.USNGtoLL(value, true)
  const isInvalid = Number.isNaN(result.lat) || Number.isNaN(result.lon)
  return {
    error: isInvalid,
    message: isInvalid ? 'Invalid USNG / MGRS coordinates' : '',
  }
}

const letterRegex = /[^0-9.]/i
const northingOffset = 10000000

function upsValidDistance(distance: number) {
  return distance >= 800000 && distance <= 3200000
}
function isLatLonValid(lat: string, lon: string) {
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)
  return latitude > -90 && latitude < 90 && longitude > -180 && longitude < 180
}

function validateUtmUps(
  utmUpsEasting: string,
  northing: any,
  zoneNumber: any,
  hemisphere: any
) {
  let error = { error: false, message: '' }
  zoneNumber = Number.parseInt(zoneNumber)
  hemisphere = hemisphere.toUpperCase()
  let easting = NaN
  if (utmUpsEasting !== undefined) {
    easting = letterRegex.test(utmUpsEasting)
      ? NaN
      : Number.parseFloat(utmUpsEasting)
    if (Number.isNaN(easting)) {
      error = { error: true, message: 'Easting value is invalid' }
    }
  }
  if (northing !== undefined) {
    northing = letterRegex.test(northing) ? NaN : Number.parseFloat(northing)
    if (Number.isNaN(northing)) {
      error = { error: true, message: 'Northing value is invalid' }
    } else if (!Number.isNaN(easting)) {
      const northernHemisphere = hemisphere === 'NORTHERN'
      const isUps = zoneNumber === 0
      const utmUpsParts = {
        easting,
        northing,
        zoneNumber,
        hemisphere,
        northPole: northernHemisphere,
      }
      utmUpsParts.northing =
        isUps || northernHemisphere ? northing : northing - northingOffset
      if (
        isUps &&
        (!upsValidDistance(northing) || !upsValidDistance(northing))
      ) {
        error = { error: true, message: 'Invalid UPS distance' }
      }
      let { lat, lon } = converter.UTMUPStoLL(utmUpsParts)
      lon = lon % 360
      if (lon < -180) {
        lon = lon + 360
      }
      if (lon > 180) {
        lon = lon - 360
      }
      if (!isLatLonValid(lat, lon)) {
        error = { error: true, message: 'Invalid UTM/UPS coordinates' }
      }
    }
  }
  return error
}

function validateRadiusLineBuffer(key: string, value: string) {
  const label = key === 'lineWidth' ? 'buffer' : 'radius'
  if ((value !== undefined && value.length === 0) || Number(value) < 0.000001) {
    return {
      error: true,
      message: `${label.replace(/^\w/, c =>
        c.toUpperCase()
      )} cannot be less than 0.000001`,
    }
  }
  return { error: false, message: '' }
}

const Invalid = styled.div`
  background-color: ${props => props.theme.negativeColor};
  height: 100%;
  display: block;
  overflow: hidden;
  color: white;
`

const WarningIcon = styled.span`
  padding: ${({ theme }) => theme.minimumSpacing};
`
export function getErrorComponent(errorState: ErrorState) {
  return errorState.error ? (
    <Invalid>
      <WarningIcon className="fa fa-warning" />
      <span>{errorState.message}</span>
    </Invalid>
  ) : null
}
