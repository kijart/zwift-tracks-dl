#!/usr/bin/env node

import { routes, segments } from 'zwift-data';
import fs from 'fs';
import path from 'path';

const fetchStravaSegment = async (stravaSegmentId) => {
  const response = await fetch(
    `https://www.strava.com/stream/segments/${stravaSegmentId}?streams[]=latlng&streams[]=altitude`
  );

  if (response.status !== 200) {
    return Promise.reject(`Could not fetch segment '${stravaSegmentId}'`);
  }

  return await response.json();
};

const buildGPX = ({ segmentData, latlngList, altitudeList }) => {
  const name = `${segmentData.name} (${segmentData.world})`;
  const distance = `${segmentData.distance}km`;
  const link = `${segmentData.stravaSegmentUrl}`;
  const trkptList = latlngList.map(
    ([lat, lng], index) => `
      <trkpt lat="${lat}" lon="${lng}">
        <ele>${altitudeList[index]}</ele>
      </trkpt>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="kijart:zwift-tracks-dl" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">
  <trk>
    <name>${name}</name>
    <desc>${distance}</desc>
    <link href="${link}">
      <type>Strava segment</type>
    </link>
    <trkseg>${trkptList}
    </trkseg>
  </trk>
</gpx>`;
};

const exportTrack = async (segmentData, trackDir) => {
  try {
    const { altitude, latlng } = await fetchStravaSegment(segmentData.stravaSegmentId);
    const filename = `zwift-${segmentData.world}-${segmentData.slug}-${segmentData.distance}km-${segmentData.stravaSegmentId}.gpx`;
    const buildGPXOutput = buildGPX({
      segmentData,
      latlngList: latlng,
      altitudeList: altitude,
    });

    fs.writeFileSync(`${trackDir}/${filename}`, buildGPXOutput);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

const cli = async () => {
  const BASE_DIR = path.resolve(process.cwd(), 'tracks');
  const ROUTES_DIR = path.resolve(BASE_DIR, 'routes');
  const SEGMENTS_DIR = path.resolve(BASE_DIR, 'segments');
  const filteredRoutes = routes.filter((route) => route.stravaSegmentId !== undefined);
  const filteredSegments = segments.filter((route) => route.stravaSegmentId !== undefined);

  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
  }

  if (!fs.existsSync(ROUTES_DIR)) {
    fs.mkdirSync(ROUTES_DIR);
  }

  if (!fs.existsSync(SEGMENTS_DIR)) {
    fs.mkdirSync(SEGMENTS_DIR);
  }

  await Promise.all(
    filteredRoutes.map(async (segmentData) => await exportTrack(segmentData, ROUTES_DIR)),
    filteredSegments.map(async (segmentData) => await exportTrack(segmentData, SEGMENTS_DIR))
  );

  console.info(`Total tracks generated: ${filteredRoutes.length + filteredSegments.length}`);
  console.info(`Routes generated: ${filteredRoutes.length}`);
  console.info(`Segments generated: ${filteredSegments.length}`);
};

// run
cli();
