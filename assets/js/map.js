mapboxgl.accessToken = 'pk.eyJ1IjoiZGJhcmRlbCIsImEiOiJja2pwc2w2a3Y3OGZhMnNsZzZ3cWttZzZ0In0.Y9v5tnT7kvv0VqSEChF67g';


var firebaseConfig = {
    apiKey: "AIzaSyAufy9ngd3oVFnl0rsQZfMMm-wlmXcftck",
    authDomain: "einfach-38f90.firebaseapp.com",
    databaseURL: "https://einfach-38f90-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "einfach-38f90",
    storageBucket: "einfach-38f90.appspot.com",
    messagingSenderId: "14544561898",
    appId: "1:14544561898:web:4bfc9b37f8a6347b4cd993"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  var database = firebase.database();



var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dbardel/ckjv97ouw0fka17ofnx8bsz1z',
    center: [8.838050, 53.091250],
    zoom: 10,
});


var distanceContainer = document.getElementById('distance');

// GeoJSON object to hold our measurement features
var geojson = {
    'type': 'FeatureCollection',
    'features': []
};

// Used to draw a line between points
var linestring = {
    'type': 'Feature',
    'geometry': {
        'type': 'LineString',
        'coordinates': []
    }
};

map.on('load', function () {
    map.addSource('geojson', {
        'type': 'geojson',
        'data': geojson
    });

    // Add styles to the map
    map.addLayer({
        id: 'measure-points',
        type: 'circle',
        source: 'geojson',
        filter: ['in', '$type', 'Point']
    });
    map.addLayer({
        id: 'measure-lines',
        type: 'line',
        source: 'geojson',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#000',
            'line-width': 2.5
        },
        filter: ['in', '$type', 'LineString']
    });

    map.on('click', function (e) {
        console.log(geojson)
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
        });

        // Remove the linestring from the group
        // So we can redraw it based on the points collection
        if (geojson.features.length > 1) geojson.features.pop();

        // Clear the Distance container to populate it with a new value
        distanceContainer.innerHTML = '';

        // If a feature was clicked, remove it from the map
        if (features.length) {
            var id = features[0].properties.id;
            geojson.features = geojson.features.filter(function (point) {
                return point.properties.id !== id;
            });
        } else {
            var point = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [e.lngLat.lng, e.lngLat.lat]
                },
                'properties': {
                    'id': String(new Date().getTime())
                }
            };

            geojson.features.push(point);
            new mapboxgl.Marker ({
                color: "#FFF"
            }).setLngLat([e.lngLat.lng, e.lngLat.lat])
            .addTo(map);

            writeGeoData(point.properties.id, e.lngLat.lng, e.lngLat.lat)
        }

        if (geojson.features.length > 1) {
            linestring.geometry.coordinates = geojson.features.map(
                function (point) {
                    return point.geometry.coordinates;
                }
            );

            geojson.features.push(linestring);

            // Populate the distanceContainer with total distance
            var value = document.createElement('pre');
            value.textContent =
                'Total distance: ' +
                turf.length(linestring).toLocaleString() +
                'km';
            distanceContainer.appendChild(value);
        }

        map.getSource('geojson').setData(geojson);
    });
});



map.on('mousemove', function (e) {
    var features = map.queryRenderedFeatures(e.point, {
        layers: ['measure-points']
    });
    // UI indicator for clicking/hovering a point on the map
    map.getCanvas().style.cursor = features.length
        ? 'pointer'
        : 'crosshair';
});

function writeGeoData(id, lat, lng,) {
    firebase.database().ref('points/').push({
      id: id,
      lng: lng,
      lat : lat
    });
  }


  var GeoData = firebase.database().ref('points/');
  GeoData.on('child_added', (data) => {
        // add marker to map
        console.log("Neuer Punkt an "+data.val().lng+" und "+data.val().lat);
        console.log()
        new mapboxgl.Marker()
        .setLngLat([data.val().lat, data.val().lng])
        .addTo(map);
  });