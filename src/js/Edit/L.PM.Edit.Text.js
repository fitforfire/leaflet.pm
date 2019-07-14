import Edit from './L.PM.Edit';

Edit.Text = Edit.Marker.extend({
  initialize(layer) {
    // layer is a marker in this case :-)
    this._layer = layer;
    this._enabled = false;
  },
  enable(
    options = {}
  ) {
    L.Util.setOptions(this, options);

    this._map = this._layer._map;

    if (this.enabled()) {
      return;
    }
    this._enabled = true;

    this._initMarkers();
    this._initButtons();
  },
  _initMarkers() {
    const map = this._map;

    // cleanup old ones first
    if (this._helperLayers) {
      this._helperLayers.clearLayers();
    }

    // add markerGroup to map, markerGroup includes regular and middle markers
    this._helperLayers = new L.LayerGroup();
    this._helperLayers._pmTempLayer = true;
    this._helperLayers.addTo(map);

  },
  _initButtons() {
    this._editButtons = document.createElement('div');
    this._editButtons.className = 'leaflet-text-editcontrols';

    const buttonDecreaseFontsize = document.createElement('a');
    buttonDecreaseFontsize.dataset.type = 'fontsizeDecrease';
    buttonDecreaseFontsize.innerText = '-';

    const buttonIncreaseFontsize = document.createElement('a');
    buttonIncreaseFontsize.dataset.type = 'fontsizeIncrease';
    buttonIncreaseFontsize.innerText = '+';

    const buttonChangeText = document.createElement('a');
    buttonChangeText.dataset.type = 'changetext';
    buttonChangeText.innerText = 'text';

    this._editButtons.appendChild(buttonDecreaseFontsize);
    this._editButtons.appendChild(buttonIncreaseFontsize);
    this._editButtons.appendChild(buttonChangeText);

    const marker = new L.Marker(this._layer.getLatLng(), {
      draggable: false,
      icon: L.divIcon({
        className: 'text-edit-buttons',
        html: this._editButtons.outerHTML
      }),
    });

    marker.on('click', this._editButtonClick);
    marker._marker = this._layer;
    marker._markerIcon = this._layer.options.icon;
    marker._pmTempLayer = true;

    this._helperLayers.addLayer(marker);
  },
  _editButtonClick(e) {
    const originalTarget = e.originalEvent.target;

    switch (originalTarget.dataset.type) {
      case 'fontsizeIncrease':
        e.target._markerIcon.fontsizeIncrease();
        break;
      case 'fontsizeDecrease':
        e.target._markerIcon.fontsizeDecrease();
        break;
      case 'changetext':
        const newText = prompt('Neuer Text', e.target._markerIcon.options.text);
        if (newText) {
          e.target._markerIcon.setText(newText);
        }
        break;
      default:
        console.error(`No action found for type: ${originalTarget.dataset.type}`);
        break;
    }

    e.target._marker.feature.properties.customElement = e.target._markerIcon.options;
  },
  disable() {
    this._enabled = false;

    if (this._helperLayers) {
      this._helperLayers.clearLayers();
    }

    if (this._layerEdited) {
      this._layer.fire('pm:update', {});
    }
    this._layerEdited = false;
  },
});
