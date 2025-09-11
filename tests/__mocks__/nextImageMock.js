import React from 'react';

module.exports = {
  __esModule: true,
  default: (props) => {
    const React = require('react');
    const { src = '', alt = '', fill, ...rest } = props || {};
    return React.createElement('img', { src: typeof src === 'string' ? src : '', alt, ...rest });
  },
};
