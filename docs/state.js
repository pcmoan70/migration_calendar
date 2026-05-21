/**
 * Persisted UI state for the Species Distribution & Migration Explorer.
 *
 * Stores language, last mode/week/threshold, last map view, and a list of
 * user-named saved locations in localStorage so the page restores on reload.
 * Exposed as window.GeoState (no module system; loaded via <script>).
 */
window.GeoState = (function () {
  "use strict";

  var KEY = "geomodel-explorer-v1";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function write(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
      /* storage unavailable / quota — non-fatal */
    }
  }

  // Merge a partial patch into the stored state.
  function save(patch) {
    var s = read();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) s[k] = patch[k];
    write(s);
    return s;
  }

  function get(key, fallback) {
    var s = read();
    return s[key] !== undefined ? s[key] : fallback;
  }

  function locations() {
    var s = read();
    return Array.isArray(s.locations) ? s.locations : [];
  }

  function addLocation(name, lat, lon) {
    var locs = locations();
    var id = "loc-" + Date.now();
    locs.push({ id: id, name: name, lat: lat, lon: lon });
    save({ locations: locs });
    return id;
  }

  function removeLocation(id) {
    save({ locations: locations().filter(function (l) { return l.id !== id; }) });
  }

  return {
    get: get,
    save: save,
    locations: locations,
    addLocation: addLocation,
    removeLocation: removeLocation,
  };
})();
