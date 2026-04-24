/* eslint-disable prefer-template,complexity */
'use strict';

const svgShapesToPath = {
  rectToPath: svgShapesToPathRectToPath,
  polylineToPath: svgShapesToPathPolylineToPath,
  lineToPath: svgShapesToPathLineToPath,
  circleToPath: svgShapesToPathCircleToPath,
  polygonToPath: svgShapesToPathPolygonToPath,
};

module.exports = svgShapesToPath;

// Shapes helpers (should also move elsewhere)
function svgShapesToPathRectToPath(attributes) {
  const x = 'undefined' !== typeof attributes.x ? parseFloat(attributes.x) : 0;
  const y = 'undefined' !== typeof attributes.y ? parseFloat(attributes.y) : 0;
  const width =
    'undefined' !== typeof attributes.width ? parseFloat(attributes.width) : 0;
  const height =
    'undefined' !== typeof attributes.height
      ? parseFloat(attributes.height)
      : 0;
  const rx =
    'undefined' !== typeof attributes.rx
      ? parseFloat(attributes.rx)
      : 'undefined' !== typeof attributes.ry ? parseFloat(attributes.ry) : 0;
  const ry =
    'undefined' !== typeof attributes.ry ? parseFloat(attributes.ry) : rx;

  return (
    '' +
    // start at the left corner
    'M' +
    (x + rx) +
    ' ' +
    y +
    // top line
    'h' +
    (width - rx * 2) +
    // upper right corner
    (rx || ry ? 'a ' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry : '') +
    // Draw right side
    'v' +
    (height - ry * 2) +
    // Draw bottom right corner
    (rx || ry ? 'a ' + rx + ' ' + ry + ' 0 0 1 ' + rx * -1 + ' ' + ry : '') +
    // Down the down side
    'h' +
    (width - rx * 2) * -1 +
    // Draw bottom right corner
    (rx || ry
      ? 'a ' + rx + ' ' + ry + ' 0 0 1 ' + rx * -1 + ' ' + ry * -1
      : '') +
    // Down the left side
    'v' +
    (height - ry * 2) * -1 +
    // Draw bottom right corner
    (rx || ry ? 'a ' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry * -1 : '') +
    // Close path
    'z'
  );
}

function svgShapesToPathPolylineToPath(attributes) {
  return 'M' + attributes.points;
}

function svgShapesToPathLineToPath(attributes) {
  // Move to the line start
  return (
    '' +
    'M' +
    (parseFloat(attributes.x1) || 0).toString(10) +
    ' ' +
    (parseFloat(attributes.y1) || 0).toString(10) +
    ' ' +
    ((parseFloat(attributes.x1) || 0) + 1).toString(10) +
    ' ' +
    ((parseFloat(attributes.y1) || 0) + 1).toString(10) +
    ' ' +
    ((parseFloat(attributes.x2) || 0) + 1).toString(10) +
    ' ' +
    ((parseFloat(attributes.y2) || 0) + 1).toString(10) +
    ' ' +
    (parseFloat(attributes.x2) || 0).toString(10) +
    ' ' +
    (parseFloat(attributes.y2) || 0).toString(10) +
    'Z'
  );
}

function svgShapesToPathCircleToPath(attributes) {
  const cx = parseFloat(attributes.cx);
  const cy = parseFloat(attributes.cy);
  const rx =
    'undefined' !== typeof attributes.rx
      ? parseFloat(attributes.rx)
      : parseFloat(attributes.r);
  const ry =
    'undefined' !== typeof attributes.ry
      ? parseFloat(attributes.ry)
      : parseFloat(attributes.r);

  // use two A commands because one command which returns to origin is invalid
  return (
    '' +
    'M' +
    (cx - rx) +
    ',' +
    cy +
    'A' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    (cx + rx) +
    ',' +
    cy +
    'A' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    (cx - rx) +
    ',' +
    cy
  );
}

function svgShapesToPathPolygonToPath(attributes) {
  return 'M' + attributes.points + 'Z';
}
