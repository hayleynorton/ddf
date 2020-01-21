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
import React, { useState } from 'react'

const Group = require('../group')
const Label = require('./label')
const TextField = require('../text-field')
const { Radio, RadioItem } = require('../radio')

const { Zone, Hemisphere, MinimumSpacing } = require('./common')

const {
  DmsLatitude,
  DmsLongitude,
} = require('../../component/location-new/geo-components/coordinates.js')
const DirectionInput = require('../../component/location-new/geo-components/direction.js')
const { Direction } = require('../../component/location-new/utils/dms-utils.js')
import {
  locationInputValidators,
  getLocationInputError,
  getErrorComponent,
} from '../utils/validation'

const minimumDifference = 0.0001

const BoundingBoxLatLon = props => {
  const [latlonState, setLatLonState] = useState({
    error: false,
    message: '',
    defaultValue: '',
  })
  const { north, east, south, west, setState } = props

  const { mapEast, mapWest, mapSouth, mapNorth } = props

  const westMax = parseFloat(mapEast) - minimumDifference
  const eastMin = parseFloat(mapWest) + minimumDifference
  const northMin = parseFloat(mapSouth) + minimumDifference
  const southMax = parseFloat(mapNorth) - minimumDifference
  function onChangeLatLon(key, value) {
    let { errorMsg, defaultCoord } = getLocationInputError(key, value)
    setLatLonState({
      error: !locationInputValidators[key](value),
      message: errorMsg,
      defaultValue: defaultCoord || '',
    })
    if (defaultCoord && defaultCoord.length != 0) {
      value = defaultCoord
    }
    setState(key, value)
  }
  function onBlurLatLon(key, value) {
    let { errorMsg, defaultCoord } = getLocationInputError(key, value)
    setLatLonState({
      error: value !== undefined && value.length == 0,
      message: errorMsg,
      defaultValue: defaultCoord,
    })
  }
  return (
    <div className="input-location">
      <TextField
        label="West"
        value={west}
        onChange={west => onChangeLatLon('west', west)}
        onBlur={() => onBlurLatLon('west', west)}
        type="number"
        step="any"
        min={-180}
        max={westMax || 180}
        addon="°"
      />
      <TextField
        label="South"
        value={south}
        onChange={south => onChangeLatLon('south', south)}
        onBlur={() => onBlurLatLon('south', south)}
        type="number"
        step="any"
        min={-90}
        max={southMax || 90}
        addon="°"
      />
      <TextField
        label="East"
        value={east}
        onChange={east => onChangeLatLon('east', east)}
        onBlur={() => onBlurLatLon('east', east)}
        type="number"
        step="any"
        min={eastMin || -180}
        max={180}
        addon="°"
      />
      <TextField
        label="North"
        value={north}
        onChange={north => onChangeLatLon('north', north)}
        onBlur={() => onBlurLatLon('north', north)}
        type="number"
        step="any"
        min={northMin || -90}
        max={90}
        addon="°"
      />
      {getErrorComponent(latlonState)}
    </div>
  )
}

const usngs = require('usng.js')
const converter = new usngs.Converter()

const BoundingBoxUsngMgrs = props => {
  const [error, setError] = useState({ error: false, message: '' })
  const { usngbbUpperLeft, usngbbLowerRight, setState } = props
  function testValidity(usng) {
    try {
      const result = converter.USNGtoLL(usng, true)
      setError({
        error: Number.isNaN(result.lat) || Number.isNaN(result.lon),
        message: 'Invalid USNG / MGRS coords',
      })
    } catch (err) {
      setError({ error: true, message: '' })
    }
  }
  return (
    <div className="input-location">
      <TextField
        label="Upper Left"
        style={{ minWidth: 200 }}
        value={usngbbUpperLeft}
        onChange={usngbbUpperLeft =>
          setState('usngbbUpperLeft', usngbbUpperLeft)
        }
        onBlur={() => testValidity(usngbbUpperLeft)}
      />
      <TextField
        label="Lower Right"
        style={{ minWidth: 200 }}
        value={usngbbLowerRight}
        onChange={usngbbLowerRight =>
          setState('usngbbLowerRight', usngbbLowerRight)
        }
        onBlur={() => testValidity(usngbbLowerRight)}
      />
      {getErrorComponent(error)}
    </div>
  )
}

const BoundingBoxUtmUps = props => {
  const {
    utmUpsUpperLeftEasting,
    utmUpsUpperLeftNorthing,
    utmUpsUpperLeftZone,
    utmUpsUpperLeftHemisphere,
    utmUpsLowerRightEasting,
    utmUpsLowerRightNorthing,
    utmUpsLowerRightZone,
    utmUpsLowerRightHemisphere,
    setState,
  } = props
  const [upperLeftErrorMessage, setUpperLeftErrorMessage] = useState()
  const [lowerRightErrorMessage, setLowerRightErrorMessage] = useState()
  const letterRegex = /[a-z]/i
  const northingOffset = 10000000
  function upsValidDistance(distance) {
    return distance >= 800000 && distance <= 3200000
  }
  function isLatLonValid(lat, lon) {
    lat = parseFloat(lat)
    lon = parseFloat(lon)
    return lat > -90 && lat < 90 && lon > -180 && lon < 180
  }
  function testUtmUpsValidity(
    easting,
    northing,
    zoneNumber,
    hemisphere,
    setErrorMessage
  ) {
    zoneNumber = Number.parseInt(zoneNumber)
    hemisphere = hemisphere.toUpperCase()
    if (easting !== undefined) {
      easting = letterRegex.test(easting) ? NaN : Number.parseFloat(easting)
      if (Number.isNaN(easting)) {
        setErrorMessage('Easting value is invalid')
      }
    }
    if (northing !== undefined) {
      northing = letterRegex.test(northing) ? NaN : Number.parseFloat(northing)
      if (Number.isNaN(northing)) {
        setErrorMessage('Northing value is invalid')
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
          (!upsValidDistance(northing) || !upsValidDistance(easting))
        ) {
          setErrorMessage('Invalid UPS distance')
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
          setErrorMessage('Invalid UTM/UPS coordinates')
        } else {
          setErrorMessage('')
        }
      }
    }
  }
  function testValidity() {
    testUtmUpsValidity(
      utmUpsUpperLeftEasting,
      utmUpsUpperLeftNorthing,
      utmUpsUpperLeftZone,
      utmUpsUpperLeftHemisphere,
      setUpperLeftErrorMessage
    )
    testUtmUpsValidity(
      utmUpsLowerRightEasting,
      utmUpsLowerRightNorthing,
      utmUpsLowerRightZone,
      utmUpsLowerRightHemisphere,
      setLowerRightErrorMessage
    )
  }
  return (
    <div>
      <div className="input-location">
        <Group>
          <Label>Upper-Left</Label>
          <div>
            <TextField
              label="Easting"
              value={utmUpsUpperLeftEasting}
              onChange={value => setState('utmUpsUpperLeftEasting', value)}
              onBlur={() => testValidity()}
              addon="m"
            />
            <TextField
              label="Northing"
              value={utmUpsUpperLeftNorthing}
              onChange={value => ('utmUpsUpperLeftNorthing', value)}
              onBlur={() => testValidity()}
              addon="m"
            />
            <Zone
              value={utmUpsUpperLeftZone}
              onChange={value => setState('utmUpsUpperLeftZone', value)}
              onBlur={() => testValidity()}
            />
            <Hemisphere
              value={utmUpsUpperLeftHemisphere}
              onChange={value => setState('utmUpsUpperLeftHemisphere', value)}
              onBlur={() => testValidity()}
            />
          </div>
        </Group>
        {upperLeftErrorMessage ? (
          <Invalid>
            <WarningIcon className="fa fa-warning" />
            <span>{ upperLeftErrorMessage }</span>
          </Invalid>
        ) : null}}
      </div>
      <div className="input-location">
        <Group>
          <Label>Lower-Right</Label>
          <div>
            <TextField
              label="Easting"
              value={utmUpsLowerRightEasting}
              onChange={value => setState('utmUpsLowerRightEasting', value)}
              onBlur={() => testValidity()}
              addon="m"
            />
            <TextField
              label="Northing"
              value={utmUpsLowerRightNorthing}
              onChange={value => setState('utmUpsLowerRightNorthing', value)}
              onBlur={() => testValidity()}
              addon="m"
            />
            <Zone
              value={utmUpsLowerRightZone}
              onChange={value => setState('utmUpsLowerRightZone', value)}
              onBlur={() => testValidity()}
            />
            <Hemisphere
              value={utmUpsLowerRightHemisphere}
              onChange={value => setState('utmUpsLowerRightHemisphere', value)}
              onBlur={() => testValidity()}
            />
          </div>
        </Group>
        {lowerRightErrorMessage ? (
          <Invalid>
            <WarningIcon className="fa fa-warning" />
            <span>{ lowerRightErrorMessage }</span>
          </Invalid>
        ) : null}
      </div>
    </div>
  )
}

const BoundingBoxDms = props => {
  const [latlonState, setLatLonState] = useState({
    error: false,
    errorMsg: '',
    defaultValue: '',
  })
  const {
    dmsSouth,
    dmsNorth,
    dmsWest,
    dmsEast,

    dmsSouthDirection,
    dmsNorthDirection,
    dmsWestDirection,
    dmsEastDirection,

    setState,
  } = props

  const latitudeDirections = [Direction.North, Direction.South]
  const longitudeDirections = [Direction.East, Direction.West]

  function onChangeLatLon(key, value, type) {
    let { errorMsg, defaultCoord } = getLocationInputError(key, value)
    setLatLonState({
      error:
        type == 'blur'
          ? value !== undefined && value.length == 0
          : !locationInputValidators[key](value),
      message: errorMsg,
      defaultValue: defaultCoord || '',
    })
    if (defaultCoord && defaultCoord.length != 0) {
      value = defaultCoord
    }
    setState(key, value)
  }
  return (
    <div className="input-location">
      <DmsLongitude
        label="West"
        value={dmsWest}
        onChange={(dmsWest, type) => onChangeLatLon('dmsWest', dmsWest, type)}
      >
        <DirectionInput
          options={longitudeDirections}
          value={dmsWestDirection}
          onChange={dmsWestDirection =>
            setState('dmsWestDirection', dmsWestDirection)
          }
        />
      </DmsLongitude>
      <DmsLatitude
        label="South"
        value={dmsSouth}
        onChange={(dmsSouth, type) =>
          onChangeLatLon('dmsSouth', dmsSouth, type)
        }
      >
        <DirectionInput
          options={latitudeDirections}
          value={dmsSouthDirection}
          onChange={dmsSouthDirection =>
            setState('dmsSouthDirection', dmsSouthDirection)
          }
        />
      </DmsLatitude>
      <DmsLongitude
        label="East"
        value={dmsEast}
        onChange={(dmsEast, type) => onChangeLatLon('dmsEast', dmsEast, type)}
      >
        <DirectionInput
          options={longitudeDirections}
          value={dmsEastDirection}
          onChange={dmsEastDirection =>
            setState('dmsEastDirection', dmsEastDirection)
          }
        />
      </DmsLongitude>
      <DmsLatitude
        label="North"
        value={dmsNorth}
        onChange={(dmsNorth, type) =>
          onChangeLatLon('dmsNorth', dmsNorth, type)
        }
      >
        <DirectionInput
          options={latitudeDirections}
          value={dmsNorthDirection}
          onChange={dmsNorthDirection =>
            setState('dmsNorthDirection', dmsNorthDirection)
          }
        />
      </DmsLatitude>
      {getErrorComponent(latlonState)}
    </div>
  )
}

const BoundingBox = props => {
  const { cursor, locationType } = props

  const inputs = {
    latlon: BoundingBoxLatLon,
    usng: BoundingBoxUsngMgrs,
    utmUps: BoundingBoxUtmUps,
    dms: BoundingBoxDms,
  }

  const Component = inputs[locationType] || null

  return (
    <div>
      <Radio value={locationType} onChange={cursor('locationType')}>
        <RadioItem value="latlon">Lat/Lon (DD)</RadioItem>
        <RadioItem value="dms">Lat/Lon (DMS)</RadioItem>
        <RadioItem value="usng">USNG / MGRS</RadioItem>
        <RadioItem value="utmUps">UTM / UPS</RadioItem>
      </Radio>
      <MinimumSpacing />
      {Component !== null ? <Component {...props} /> : null}
    </div>
  )
}

module.exports = BoundingBox
