import Draw from './L.PM.Draw';

import { getTranslation } from '../helpers';

Draw.Text = Draw.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Text';
    this.toolbarButtonName = 'drawText';
  },
  enable(options) {
    // TODO: Think about if these options could be passed globally for all
    // instances of L.PM.Draw. So a dev could set drawing style one time as some kind of config
    L.Util.setOptions(this, options);

    // change enabled state
    this._enabled = true;

    // create a marker on click on the map
    this._map.on('click', this._placeText, this);

    // toggle the draw button of the Toolbar in case drawing mode got enabled without the button
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, true);

    // this is the hintmarker on the mouse cursor
    this._hintMarker = L.marker([0, 0], this._getTextMarkerStyle('Text'));
    this._hintMarker._pmTempLayer = true;
    this._hintMarker.addTo(this._map);

    // add tooltip to hintmarker
    if (this.options.tooltips) {
      this._hintMarker
        .bindTooltip(getTranslation('tooltips.placeText'), {
          permanent: true,
          offset: L.point(0, 0),
          direction: 'top',

          opacity: 0.8,
        })
        .openTooltip();
    }

    // this is just to keep the snappable mixin happy
    this._layer = this._hintMarker;

    // sync hint marker with mouse cursor
    this._map.on('mousemove', this._syncHintMarker, this);

    // fire drawstart event
    this._map.fire('pm:drawstart', {
      shape: this._shape,
      workingLayer: this._layer,
    });
  },
  disable() {
    // cancel, if drawing mode isn't even enabled
    if (!this._enabled) {
      return;
    }

    // undbind click event, don't create a marker on click anymore
    this._map.off('click', this._placeText, this);

    // remove hint marker
    this._hintMarker.remove();

    // remove event listener to sync hint marker
    this._map.off('mousemove', this._syncHintMarker, this);

    // disable dragging and removing for all markers
    this._map.eachLayer(layer => {
      if (this.isRelevantMarker(layer)) {
        layer.pm.disable();
      }
    });

    // fire drawend event
    this._map.fire('pm:drawend', { shape: this._shape });

    // toggle the draw button of the Toolbar in case drawing mode got disabled without the button
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);

    // change enabled state
    this._enabled = false;
  },
  isRelevantMarker(layer) {
    return layer instanceof L.Marker && layer.pm && !layer._pmTempLayer;
  },
  enabled() {
    return this._enabled;
  },
  toggle(options) {
    if (this.enabled()) {
      this.disable();
    } else {
      this.enable(options);
    }
  },
  _getTextMarkerStyle(text) {
    return {
      text,
      icon: new L.DivIcon({
        className: 'text-marker',
        html: `<span class="" style="font-size: 24px;">${text}</span>`
      })
    };
  },
  _placeText(e) {
    if (!e.latlng) {
      return;
    }

    // assign the coordinate of the click to the hintMarker, that's necessary for
    // mobile where the marker can't follow a cursor
    if (!this._hintMarker._snapped) {
      this._hintMarker.setLatLng(e.latlng);
    }

    // get coordinate for new vertex by hintMarker (cursor marker)
    const latlng = this._hintMarker.getLatLng();

    // create marker
    const marker = new L.Marker(latlng, this._getTextMarkerStyle(this._hintMarker.options.text));

    // add marker to the map
    marker.addTo(this._map);

    // fire the pm:create event and pass shape and marker
    this._map.fire('pm:create', {
      shape: this._shape,
      marker, // DEPRECATED
      layer: marker,
    });

    this.disable();
    // this._addConfigPopup();
  },
  _addConfigPopup() {
    let formContent = `<label>Text:</label> <input type="text" value="${this._layer.options.text}" />`;
    formContent += '<label>Textgröße:</label> <input type="text" value="24" width="20" />';

    this._layer.bindPopup(formContent, {autoClose: false}).openPopup();
  },
  _syncHintMarker(e) {
    // move the cursor marker
    this._hintMarker.setLatLng(e.latlng);
  },
});
