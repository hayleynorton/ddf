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
const { Radio, RadioItem } = require('../radio')
const TextField = require('../text-field')
import {
  locationInputValidators,
  getLocationInputError,
  getErrorComponent,
} from '../utils/validation'
const { Units, Zone, Hemisphere, MinimumSpacing } = require('./common')

const {
  DmsLatitude,
  DmsLongitude,
} = require('../../component/location-new/geo-components/coordinates.js')
const DirectionInput = require('../../component/location-new/geo-components/direction.js')
const { Direction } = require('../../component/location-new/utils/dms-utils.js')

const PointRadiusLatLon = props => {
  const [latlonState, setLatLonState] = useState({
    error: false,
    message: '',
    defaultValue: '',
  })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  const { lat, lon, radius, radiusUnits, setState } = props
  function onBlurLatLon(key, value) {
    props.callback
    let { errorMsg, defaultCoord } = getLocationInputError(key, value)
    setLatLonState({
      error: value !== undefined && value.length == 0,
      message: errorMsg,
      defaultValue: defaultCoord,
    })
  }
  return (
    <div>
      <TextField
        type="number"
        label="Latitude"
        value={lat}
        onChange={lat => onChangeLatLon('lat', lat, setLatLonState, setState)}
        onBlur={() => onBlurLatLon('lat', lat)}
        onFocus={() => {
          setLatLonState({ error: false, message: '', defaultValue: '' })
        }}
        addon="°"
      />
      <TextField
        type="number"
        label="Longitude"
        value={lon}
        onChange={lon => onChangeLatLon('lon', lon, setLatLonState, setState)}
        onBlur={() => onBlurLatLon('lon', lon)}
        addon="°"
      />
      {getErrorComponent(latlonState)}
      <Units
        value={radiusUnits}
        onChange={radiusUnits => setState('radiusUnits', radiusUnits)}
      >
        <TextField
          type="number"
          min="0"
          label="Radius"
          value={radius}
          onChange={radius => onChangeRadius(radius, setRadiusError, setState)}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const usngs = require('usng.js')
const converter = new usngs.Converter()

const PointRadiusUsngMgrs = props => {
  const [error, setError] = useState({ error: false, message: '' })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  const { usng, radius, radiusUnits, setState } = props
  function testValidity(usng) {
    const result = converter.USNGtoLL(usng, true)
    setError({
      error: Number.isNaN(result.lat) || Number.isNaN(result.lon),
      message: 'Invalid USNG / MGRS coords',
    })
  }
  return (
    <div>
      <TextField
        label="USNG / MGRS"
        value={usng}
        onChange={usng => setState('usng', usng)}
        onBlur={() => testValidity(usng)}
      />
      {getErrorComponent(error)}
      <Units
        value={radiusUnits}
        onChange={radiusUnits => setState('radiusUnits', radiusUnits)}
      >
        <TextField
          label="Radius"
          value={radius}
          onChange={radius => onChangeRadius(radius, setRadiusError, setState)}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const PointRadiusUtmUps = props => {
  let {
    utmUpsEasting,
    utmUpsNorthing,
    utmUpsZone,
    utmUpsHemisphere,
    radius,
    radiusUnits,
    setState,
  } = props
  const [error, setError] = useState({ error: false, message: '' })
  const [radiusError, setRadiusError] = useState(false)
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
  function testValidity() {
    utmUpsZone = Number.parseInt(utmUpsZone)
    utmUpsHemisphere = utmUpsHemisphere.toUpperCase()
    if (utmUpsEasting !== undefined) {
      utmUpsEasting = letterRegex.test(utmUpsEasting)
        ? NaN
        : Number.parseFloat(utmUpsEasting)
      if (Number.isNaN(utmUpsEasting)) {
        setError({ error: true, message: 'Easting value is invalid' })
      }
    }
    if (utmUpsNorthing !== undefined) {
      utmUpsNorthing = letterRegex.test(utmUpsNorthing)
        ? NaN
        : Number.parseFloat(utmUpsNorthing)
      if (Number.isNaN(utmUpsNorthing)) {
        setError({ error: true, message: 'Northing value is invalid' })
      } else if (!Number.isNaN(utmUpsEasting)) {
        const northernHemisphere = utmUpsHemisphere === 'NORTHERN'
        const isUps = utmUpsZone === 0
        const utmUpsParts = {
          easting: utmUpsEasting,
          northing: utmUpsNorthing,
          zoneNumber: utmUpsZone,
          hemisphere: utmUpsHemisphere,
          northPole: northernHemisphere,
        }
        utmUpsParts.northing =
          isUps || northernHemisphere
            ? utmUpsNorthing
            : utmUpsNorthing - northingOffset
        if (
          isUps &&
          (!upsValidDistance(utmUpsNorthing) ||
            !upsValidDistance(utmUpsEasting))
        ) {
          setError({ error: true, message: 'Invalid UPS distance' })
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
          setError({ error: true, message: 'Invalid UTM/UPS coordinates' })
        } else {
          setError({ error: false, message: '' })
        }
      }
    }
  }
  return (
    <div>
      <TextField
        label="Easting"
        value={utmUpsEasting}
        onChange={value => setState('utmUpsEasting', value)}
        onBlur={() => testValidity()}
        addon="m"
      />
      <TextField
        label="Northing"
        value={utmUpsNorthing}
        onChange={value => setState('utmUpsNorthing', value)}
        onBlur={() => testValidity()}
        addon="m"
      />
      <Zone
        value={utmUpsZone}
        onChange={value => setState('utmUpsZone', value)}
        onBlur={() => testValidity()}
      />
      <Hemisphere
        value={utmUpsHemisphere}
        onChange={value => setState('utmUpsHemisphere', value)}
        onBlur={() => testValidity()}
      />
      {getErrorComponent(error)}
      <Units
        value={radiusUnits}
        onChange={value => setState('radiusUnits', value)}
      >
        <TextField
          label="Radius"
          value={String(radius)}
          onChange={value => setState('radius', value)}
          onBlur={() => setRadiusError(radius < 0.000001)}
        />
      </Units>
      {getErrorComponent({
        error: radiusError,
        message: 'Radius must be greater than 0.000001',
      })}
    </div>
  )
}

const PointRadiusDms = props => {
  const [latlonState, setLatLonState] = useState({
    error: false,
    message: '',
    defaultValue: '',
  })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  const {
    dmsLat,
    dmsLon,
    dmsLatDirection,
    dmsLonDirection,
    radius,
    radiusUnits,
    setState,
  } = props
  const latitudeDirections = [Direction.North, Direction.South]
  const longitudeDirections = [Direction.East, Direction.West]
  return (
    <div>
      <DmsLatitude
        label="Latitude"
        value={dmsLat}
        onChange={(dmsLat, type) =>
          onChangeDms('dmsLat', dmsLat, type, setLatLonState, setState)
        }
      >
        <DirectionInput
          options={latitudeDirections}
          value={dmsLatDirection}
          onChange={dmsLatDirection =>
            setState('dmsLatDirection', dmsLatDirection)
          }
        />
      </DmsLatitude>
      <DmsLongitude
        label="Longitude"
        value={dmsLon}
        onChange={(dmsLon, type) =>
          onChangeDms('dmsLon', dmsLon, type, setLatLonState, setState)
        }
      >
        <DirectionInput
          options={longitudeDirections}
          value={dmsLonDirection}
          onChange={dmsLonDirection =>
            setState('dmsLonDirection', dmsLonDirection)
          }
        />
      </DmsLongitude>
      {getErrorComponent(latlonState)}
      <Units
        value={radiusUnits}
        onChange={radiusUnits => setState('radiusUnits', radiusUnits)}
      >
        <TextField
          label="Radius"
          type="number"
          value={radius}
          onChange={radius => onChangeRadius(radius, setRadiusError, setState)}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const PointRadius = props => {
  const { setState, locationType } = props

  const inputs = {
    latlon: PointRadiusLatLon,
    dms: PointRadiusDms,
    usng: PointRadiusUsngMgrs,
    utmUps: PointRadiusUtmUps,
  }

  const Component = inputs[locationType] || null

  return (
    <div>
      <Radio
        value={locationType}
        onChange={locationType => setState('locationType', locationType)}
      >
        <RadioItem value="latlon">Lat / Lon (DD)</RadioItem>
        <RadioItem value="dms">Lat / Lon (DMS)</RadioItem>
        <RadioItem value="usng">USNG / MGRS</RadioItem>
        <RadioItem value="utmUps">UTM / UPS</RadioItem>
      </Radio>
      <MinimumSpacing />
      <div className="input-location">
        {Component !== null ? <Component {...props} /> : null}
      </div>
    </div>
  )
}

/*
**************
HELPER METHODS
**************
*/

function onChangeLatLon(key, value, setLatLonState, setState) {
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

function onChangeDms(key, value, type, setLatLonState, setState) {
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

function onChangeRadius(value, setRadiusError, setState) {
  let { errorMsg } = getLocationInputError('radius', value)
  setRadiusError({
    error: !locationInputValidators['radius'](value),
    message: errorMsg,
  })
  setState('radius', value)
}

module.exports = PointRadius
