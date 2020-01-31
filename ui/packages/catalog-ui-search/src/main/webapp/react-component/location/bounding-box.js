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
import { Invalid, WarningIcon } from '../utils/validation'

const usngs = require('usng.js')
const converter = new usngs.Converter()

const minimumDifference = 0.0001

const BoundingBoxLatLon = props => {
  const { north, east, south, west, setState } = props

  const { mapEast, mapWest, mapSouth, mapNorth } = props

  const westMax = parseFloat(mapEast) - minimumDifference
  const eastMin = parseFloat(mapWest) + minimumDifference
  const northMin = parseFloat(mapSouth) + minimumDifference
  const southMax = parseFloat(mapNorth) - minimumDifference

  return (
    <div className="input-location">
      <TextField
        label="West"
        value={west}
        onChange={value => setState('west', value)}
        type="number"
        step="any"
        min={-180}
        max={westMax || 180}
        addon="°"
      />
      <TextField
        label="South"
        value={south}
        onChange={value => setState('south', value)}
        type="number"
        step="any"
        min={-90}
        max={southMax || 90}
        addon="°"
      />
      <TextField
        label="East"
        value={east}
        onChange={value => setState('east', value)}
        type="number"
        step="any"
        min={eastMin || -180}
        max={180}
        addon="°"
      />
      <TextField
        label="North"
        value={north}
        onChange={value => setState('north', value)}
        type="number"
        step="any"
        min={northMin || -90}
        max={90}
        addon="°"
      />
    </div>
  )
}

const BoundingBoxUsngMgrs = props => {
  const { usngbbUpperLeft, usngbbLowerRight, setState } = props
  const [error, setError] = useState(false)
  function testValidity() {
    if (usngbbUpperLeft !== undefined && usngbbLowerRight !== undefined) {
      const { north, west } = converter.USNGtoLL(usngbbUpperLeft)
      const { south, east } = converter.USNGtoLL(usngbbLowerRight)
      setError(
        Number.isNaN(Number.parseFloat(north)) ||
          Number.isNaN(Number.parseFloat(south)) ||
          Number.isNaN(Number.parseFloat(east)) ||
          Number.isNaN(Number.parseFloat(west))
      )
    }
  }
  return (
    <div className="input-location">
      <TextField
        label="Upper Left"
        style={{ minWidth: 200 }}
        value={usngbbUpperLeft}
        onChange={value => setState('usngbbUpperLeft', value)}
        onBlur={() => testValidity()}
      />
      <TextField
        label="Lower Right"
        style={{ minWidth: 200 }}
        value={usngbbLowerRight}
        onChange={value => setState('usngbbLowerRight', value)}
        onBlur={() => testValidity()}
      />
      {error ? (
        <Invalid>
          <WarningIcon className="fa fa-warning" />
          <span>Invalid USNG / MGRS coords</span>
        </Invalid>
      ) : null}
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

  function testUtmUpsValidity(easting, northing, zoneNumber, hemisphere, setErrorMessage) {
    zoneNumber = Number.parseInt(zoneNumber)
    hemisphere = hemisphere.toUpperCase()
    if(easting !== undefined) {
      easting = letterRegex.test(easting) ? NaN : Number.parseFloat(easting)
      if(Number.isNaN(easting)) {
        setErrorMessage('Easting value is invalid')
      }
    }
    if(northing !== undefined) {
      northing = letterRegex.test(northing) ? NaN : Number.parseFloat(northing)
      if(Number.isNaN(northing)) {
        setErrorMessage('Northing value is invalid')
      } else if(!Number.isNaN(easting)) {
        const northernHemisphere = hemisphere === 'NORTHERN'
        const isUps = zoneNumber === 0
        const utmUpsParts = {
          easting,
          northing,
          zoneNumber,
          hemisphere,
          northPole: northernHemisphere,
        }
        utmUpsParts.northing = isUps || northernHemisphere ? northing : northing - northingOffset
        if (isUps && (!upsValidDistance(northing) || !upsValidDistance(easting))) {
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
        if(!isLatLonValid(lat, lon)) {
          setErrorMessage('Invalid UTM/UPS coordinates')
        } else {
          setErrorMessage('')
        }
      }
    }
  }

  function testValidity() {
    testUtmUpsValidity(utmUpsUpperLeftEasting, utmUpsUpperLeftNorthing, utmUpsUpperLeftZone, utmUpsUpperLeftHemisphere, setUpperLeftErrorMessage)
    testUtmUpsValidity(utmUpsLowerRightEasting, utmUpsLowerRightNorthing, utmUpsLowerRightZone, utmUpsLowerRightHemisphere, setLowerRightErrorMessage)
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
        ) : null}
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
              onChange={value => setState('utmUpsLowerRightHemisphere',value)}
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

  return (
    <div className="input-location">
      <DmsLongitude label="West" value={dmsWest} onChange={value => setState('dmsWest', value)}>
        <DirectionInput
          options={longitudeDirections}
          value={dmsWestDirection}
          onChange={value => setState('dmsWestDirection', value)}
        />
      </DmsLongitude>
      <DmsLatitude label="South" value={dmsSouth} onChange={value => ('dmsSouth', value)}>
        <DirectionInput
          options={latitudeDirections}
          value={dmsSouthDirection}
          onChange={value => setState('dmsSouthDirection', value)}
        />
      </DmsLatitude>
      <DmsLongitude label="East" value={dmsEast} onChange={value => setState('dmsEast', value)}>
        <DirectionInput
          options={longitudeDirections}
          value={dmsEastDirection}
          onChange={value => setState('dmsEastDirection', value)}
        />
      </DmsLongitude>
      <DmsLatitude label="North" value={dmsNorth} onChange={value => setState('dmsNorth', value)}>
        <DirectionInput
          options={latitudeDirections}
          value={dmsNorthDirection}
          onChange={value => setState('dmsNorthDirection', value)}
        />
      </DmsLatitude>
    </div>
  )
}

const BoundingBox = props => {
  const { setState, locationType } = props

  const inputs = {
    latlon: BoundingBoxLatLon,
    usng: BoundingBoxUsngMgrs,
    utmUps: BoundingBoxUtmUps,
    dms: BoundingBoxDms,
  }

  const Component = inputs[locationType] || null

  return (
    <div>
      <Radio value={locationType} onChange={value => setState('locationType', value)}>
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
