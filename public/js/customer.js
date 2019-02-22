/*jslint es5:true, indent: 2 */
/*global Vue, io */
/* exported vm */
'use strict';
var socket = io();

var vm = new Vue({
    el: '#page',
    data: {
        status: null, // 0 is pickup, 1 is in car, 2 is in storage
        express: null,
        orderId: null,
        map: null,
        fromMarker: null,
        destMarker: null,
        baseMarker: null,
        origin: 0, // 0 is field, 1 is storage
        spaceRequired: 0,
        totalGrams: 0,
        driverInstructions: "",
        driverMarkers: {}
    },
    created: function () {
        socket.on('initialize', function (data) {
            // add marker for home base in the map
            this.baseMarker = L.marker(data.base, {icon: this.baseIcon}).addTo(this.map);
            this.baseMarker.bindPopup("This is the dispatch and routing center");
        }.bind(this));
        socket.on('orderId', function (orderId) {
            this.orderId = orderId;
        }.bind(this));

        // These icons are not reactive
        this.fromIcon = L.icon({
            iconUrl: "img/box.png",
            iconSize: [42,30],
            iconAnchor: [21,34]
        });
        this.baseIcon = L.icon({
            iconUrl: "img/base.png",
            iconSize: [40,40],
            iconAnchor: [20,20]
        });
    },
    mounted: function () {

        // set up the map
        // Set centering coordinates and zoom level (13)
        this.map = L.map('my-map').setView([59.8415,17.648], 13);

        // create the tile layer with correct attribution
        var osmUrl='http://{s}.tile.osm.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            maxZoom: 18
        }).addTo(this.map);
        this.map.on('click', this.handleClick);


        // This handles the search bar

        // useMapBounds: false <-- Enable to search for all
        var searchDestControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "Destination"}).addTo(this.map)
        var searchFromControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "From"}).addTo(this.map);

        // listen for the results event and add the result to the map
        searchDestControl.on("results", function(data) {
            // Ensure to only add one search to map
           if(this.destMarker === null) {
                this.destMarker = L.marker(data.latlng, {draggable: true}).addTo(this.map);
                this.destMarker.on("drag", this.moveMarker);
                searchFromControl.addTo(this.map);
            }
            else {
                alert("Can only pick up order from one place at a time");
            }

            // Check if one can draw the marker distance
            if(this.fromMarker !== null) {
                this.connectMarkers = L.polyline(this.getPolylinePoints(), {color: 'blue'}).addTo(this.map);
                // L.polyline([this.fromMarker.getLatLng(), this.destMarker.getLatLng()], {color: 'blue'}).addTo(this.map);
            }
        }.bind(this));

        // listen for the results event and add the result to the map
        searchFromControl.on("results", function(data) {
            // Ensure to add only one search
            if(this.fromMarker === null) {
                this.fromMarker = L.marker(data.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
                this.fromMarker.on("drag", this.moveMarker);
            }
            else {
                alert("Can only send order to one place at a time");
            }

            // Check if one can draw the marker distance
            if(this.destMarker !== null) {
                this.connectMarkers = L.polyline(this.getPolylinePoints(), {color: 'blue'}).addTo(this.map);
                // L.polyline([this.fromMarker.getLatLng(), this.destMarker.getLatLng()], {color: 'blue'}).addTo(this.map);
            }
        }.bind(this));

    },
    methods: {
        placeOrder: function() {
            socket.emit("placeOrder", {
                fromLatLong: [this.fromMarker.getLatLng().lat, this.fromMarker.getLatLng().lng],
                destLatLong: [this.destMarker.getLatLng().lat, this.destMarker.getLatLng().lng],
                expressOrAlreadyProcessed: this.express ? true : false,
                handled: false,
                orderDetails: {
                    pieces: 1,
                    spaceRequired: this.spaceRequired,
                    totalGrams: this.totalGrams,
                    driverInstructions: this.driverInstructions,
                    origin: this.origin,
                    status: 0,
                    express: this.express
                }
            });

        },
        getPolylinePoints: function() {
            if (this.status === 2) {
                return [this.fromMarker.getLatLng(), this.destMarker.getLatLng()];
            } else {
                return [this.fromMarker.getLatLng(), this.baseMarker.getLatLng(), this.destMarker.getLatLng()];
            }
        },
        handleClick: function (event) {
            // first click sets pickup location
            if (this.fromMarker === null) {
                this.fromMarker = L.marker(event.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
                this.fromMarker.on("drag", this.moveMarker);
            }
            // second click sets destination
            else if (this.destMarker === null) {
                this.destMarker = L.marker([event.latlng.lat, event.latlng.lng], {draggable: true}).addTo(this.map);
                this.destMarker.on("drag", this.moveMarker);
                this.connectMarkers = L.polyline(this.getPolylinePoints(), {color: 'blue'}).addTo(this.map);
            }
            // subsequent clicks assume moved markers
            else {
                this.moveMarker();
            }
        },
        moveMarker: function (event) {
            this.connectMarkers.setLatLngs(this.getPolylinePoints(), {color: 'blue'});

            // socket.emit("moveMarker", { orderId: event.target.orderId,
            //                           latLong: [event.target.getLatLng().lat, event.target.getLatLng().lng]
            //                           });
        },
        toggleExpress: function (event) {
            if (this.express == true) {
                this.express = false;
                return;
            }

            this.express == true;
        },
        swish: function(event) {
            document.getElementById('swish').style.display ='block';
            document.getElementById('creditCard').style.display ='none';
            document.getElementById('invoice').style.display ='none';
        },
        creditCard: function(event) {
            document.getElementById('creditCard').style.display ='block';
            document.getElementById('swish').style.display ='none';
            document.getElementById('invoice').style.display ='none';
        },
        invoice: function(event) {
            document.getElementById('invoice').style.display ='block';
            document.getElementById('swish').style.display ='none';
            document.getElementById('creditCard').style.display ='none';
        }
    }
});
