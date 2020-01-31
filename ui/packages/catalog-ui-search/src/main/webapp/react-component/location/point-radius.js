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
import { getErrorComponent, validateGeo } from '../utils/validation'
const { Units, Zone, Hemisphere, MinimumSpacing } = require('./common')
const {
  DmsLatitude,
  DmsLongitude,
} = require('../../component/location-new/geo-components/coordinates.js')
const DirectionInput = require('../../component/location-new/geo-components/direction.js')
const { Direction } = require('../../component/location-new/utils/dms-utils.js')

const PointRadiusLatLonDd = props => {
  const { lat, lon, radius, radiusUnits, setState } = props
  const [ddError, setDdError] = useState({
    error: false,
    message: '',
    defaultValue: '',
  })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  return (
    <div>
      <TextField
        type="number"
        label="Latitude"
        value={lat !== undefined ? String(lat) : lat}
        onChange={value => {
          const { error, message, defaultValue } = validateGeo('lat', value)
          setDdError({ error, message, defaultValue })
          defaultValue
            ? setState('lat', defaultValue)
            : setState('lat', value)
        }}
        onFocus={() => {
          setDdError({ error: false, message: '', defaultValue: '' })
        }}
        onBlur={() => setDdError(validateGeo('lat', lat))}
        addon="°"
      />
      <TextField
        type="number"
        label="Longitude"
        value={lon !== undefined ? String(lon) : lon}
        onChange={value => {
          const { error, message, defaultValue } = validateGeo('lon', value)
          setDdError({ error, message, defaultValue })
          defaultValue
            ? setState('lon', defaultValue)
            : setState('lon', value)
        }}
        onBlur={() => setDdError(validateGeo('lon', lon))}
        addon="°"
      />
      {getErrorComponent(ddError)}
      <Units
        value={radiusUnits}
        onChange={value => setState('radiusUnits', value)}
      >
        <TextField
          type="number"
          min="0"
          label="Radius"
          value={String(radius)}
          onChange={value => {
            setRadiusError(validateGeo('radius', value))
            setState('radius', value)
          }}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const PointRadiusLatLonDms = props => {
  const {
    dmsLat,
    dmsLon,
    dmsLatDirection,
    dmsLonDirection,
    radius,
    radiusUnits,
    setState,
  } = props
  const [dmsError, setDmsError] = useState({
    error: false,
    message: '',
    defaultValue: '',
  })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  const latitudeDirections = [Direction.North, Direction.South]
  const longitudeDirections = [Direction.East, Direction.West]

  function validate(key, type, value) {
    const { error, message, defaultValue } = validateGeo(key, value)
    setDmsError({
      error:
        type === 'blur' ? value !== undefined && value.length === 0 : error,
      message,
      defaultValue,
    })
    defaultValue
      ? setState(key, defaultValue)
      : setState(key, value)
  }

  return (
    <div>
      <DmsLatitude
        label="Latitude"
        value={dmsLat}
        onChange={(value, type) => validate('dmsLat', type, value)}
      >
        <DirectionInput
          options={latitudeDirections}
          value={dmsLatDirection}
          onChange={value => setState('dmsLatDirection', value)}
        />
      </DmsLatitude>
      <DmsLongitude
        label="Longitude"
        value={dmsLon}
        onChange={(value, type) => validate('dmsLon', type, value)}
      >
        <DirectionInput
          options={longitudeDirections}
          value={dmsLonDirection}
          onChange={value => setState('dmsLonDirection', value)}
        />
      </DmsLongitude>
      {getErrorComponent(dmsError)}
      <Units
        value={radiusUnits}
        onChange={value => setState('radiusUnits', value)}
      >
        <TextField
          label="Radius"
          type="number"
          value={String(radius)}
          onChange={value => {
            setRadiusError(validateGeo('radius', value))
            setState('radius', value)
          }}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const PointRadiusUsngMgrs = props => {
  const { usng, radius, radiusUnits, setState } = props
  const [usngError, setUsngError] = useState({ error: false, message: '' })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })
  return (
    <div>
      <TextField
        label="USNG / MGRS"
        value={usng}
        onChange={value => setState('usng', value)}
        onBlur={() => setUsngError(validateGeo('usng', usng))}
      />
      {getErrorComponent(usngError)}
      <Units
        value={radiusUnits}
        onChange={value => setState('radiusUnits', value)}
      >
        <TextField
          label="Radius"
          value={String(radius)}
          onChange={value => {
            setRadiusError(validateGeo('radius', value))
            setState('radius', value)
          }}
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
  const [utmError, setUtmError] = useState({ error: false, message: '' })
  const [radiusError, setRadiusError] = useState({ error: false, message: '' })

  return (
    <div>
      <TextField
        label="Easting"
        value={
          utmUpsEasting !== undefined ? String(utmUpsEasting) : utmUpsEasting
        }
        onChange={value => setState('utmUpsEasting', value)}
        onBlur={() =>
          setUtmError(
            validateGeo(
              'utm',
              utmUpsEasting,
              utmUpsNorthing,
              utmUpsZone,
              utmUpsHemisphere
            )
          )
        }
        addon="m"
      />
      <TextField
        label="Northing"
        value={
          utmUpsNorthing !== undefined ? String(utmUpsNorthing) : utmUpsNorthing
        }
        onChange={value => setState('utmUpsNorthing', value)}
        onBlur={() =>
          setUtmError(
            validateGeo(
              'utm',
              utmUpsEasting,
              utmUpsNorthing,
              utmUpsZone,
              utmUpsHemisphere
            )
          )
        }
        addon="m"
      />
      <Zone
        value={utmUpsZone}
        onChange={value => setState('utmUpsZone', value)}
        onBlur={() =>
          setUtmError(
            validateGeo(
              'utm',
              utmUpsEasting,
              utmUpsNorthing,
              utmUpsZone,
              utmUpsHemisphere
            )
          )
        }
      />
      <Hemisphere
        value={utmUpsHemisphere}
        onChange={value => setState('utmUpsHemisphere', value)}
        onBlur={() =>
          setUtmError(
            validateGeo(
              'utm',
              utmUpsEasting,
              utmUpsNorthing,
              utmUpsZone,
              utmUpsHemisphere
            )
          )
        }
      />
      {getErrorComponent(utmError)}
      <Units
        value={radiusUnits}
        onChange={value => setState('radiusUnits', value)}
      >
        <TextField
          label="Radius"
          value={String(radius)}
          onChange={value => {
            setRadiusError(validateGeo('radius', value))
            setState('radius', value)
          }}
        />
      </Units>
      {getErrorComponent(radiusError)}
    </div>
  )
}

const PointRadius = props => {
  const { setState, locationType } = props

  const inputs = {
    dd: PointRadiusLatLonDd,
    dms: PointRadiusLatLonDms,
    usng: PointRadiusUsngMgrs,
    utmUps: PointRadiusUtmUps,
  }

  const Component = inputs[locationType] || null

  return (
    <div>
      <Radio
        value={locationType}
        onChange={value => setState('locationType', value)}
      >
        <RadioItem value="dd">Lat / Lon (DD)</RadioItem>
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

module.exports = PointRadius
