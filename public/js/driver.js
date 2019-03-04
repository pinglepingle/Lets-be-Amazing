/*jslint es5:true, indent: 2 */
/*global Vue, io */
/* exported vm */
'use strict';
var socket = io();
/*

  Data in a order

  {
  "fromLatLong": [
  59.8490512210841,
  17.600974144749024
  ],
  "destLatLong": [
  59.824273134566155,
  17.615737300325847
  ],
  "expressOrAlreadyProcessed": false,
  "orderDetails": {
  "pieces": 1,
  "spaceRequired": 3,
  "totalGrams": 5600,
  "driverInstructions":
  "Beware of the dog"
  },
  "orderId": 1004,
  "driverId": 1
  }

*/

var vm = new Vue({
    el: '#page',
    data: {
        map: null,
        driverId: null,
        driverLocation: null,
        maxCapacity: 30,
        usedCapacity: 0,
        orders: {},
        customerMarkers: {},
        baseMarker: null,
        visibility: 'visible'
    },
    created: function () {
        socket.on('initialize', function (data) {
            // add marker for home base in the map
            this.baseMarker = L.marker(data.base, {icon: this.baseIcon}).addTo(this.map);
            this.baseMarker.bindPopup("This is the dispatch and routing center");

            // Added for sending driver location to base
            this.driverLocation = L.marker(data.base, {icon: this.driverIcon}).addTo(this.map);
            socket.emit("addDriver", this.getDriverInfo());
            this.orders = data.orders;
        }.bind(this));
        socket.on('currentQueue', function (data) {
            this.orders = data.orders;
            for (let key in this.orders) {
                if (this.orders[key].driverId && this.orders[key].driverId == this.driverId) {
                    this.customerMarkers[this.orders[key].orderId] = this.putCustomerMarkers(this.orders[key]);
                }
            }
        }.bind(this));
        socket.on('orderPickedUp', function (order) {
            this.$set(this.orders, order.orderId, order);
        }.bind(this));
        socket.on('orderUpdated', function (order) {
            this.$set(this.orders, order.orderId, order);
        }.bind(this));
        socket.on('driverId', function(driverId) {
            this.driverId = driverId;
        }.bind(this));
        // these icons are not reactive
        this.driverIcon = L.icon({
            iconUrl: "img/driver.png",
            iconSize: [36,20],
            iconAnchor: [18,22]
        });
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
        this.map = L.map('my-map').setView([59.8415,17.648], 13);

        // create the tile layer with correct attribution
        var osmUrl='http://{s}.tile.osm.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            maxZoom: 18
        }).addTo(this.map);
        this.map.on('click', this.setDriverLocation);
    },
    beforeDestroy: function () {
        socket.emit('driverQuit', this.driverId);
    },
    methods: {
        getDriverInfo: function () {
            return  {
                latLong: this.driverLocation.getLatLng(),
                maxCapacity: this.maxCapacity,
                usedCapacity: this.usedCapacity
            };
        },
        setDriverLocation: function (event) {
            if (this.driverLocation === null) {
                this.driverLocation = L.marker([event.latlng.lat, event.latlng.lng], {icon: this.driverIcon, draggable: true}).addTo(this.map);
                this.driverLocation.on("drag", this.moveDriver);
                socket.emit("addDriver", this.getDriverInfo());
            }
            else {
                this.driverLocation.setLatLng(event.latlng);
                this.moveDriver(event);
            }
        },
        updateDriver: function () {
            socket.emit("updateDriver", this.getDriverInfo());
        },
        moveDriver: function (event) {
            socket.emit("moveDriver", this.getDriverInfo());
        },
        quit: function () {
            // TODO: This should perhaps only be possible when the driver is not assigned to any orders
            if (this.usedCapacity === 0) {
                this.map.removeLayer(this.driverLocation);
                this.driverLocation = null;
                socket.emit("driverQuit", this.driverId);
            }
            else
                alert("Can't quit, still have packages in your truck");
        },
        orderPickedUp: function (order) {
            var pickUp = this.orders.orderId;
            // this.orders
            // Update used capacity
            if (Number(this.usedCapacity) + Number(order.orderDetails.spaceRequired) > Number(this.maxCapacity))
                return;
            else {
                this.usedCapacity = Number(order.orderDetails.spaceRequired) + Number(this.usedCapacity);
                order.handled = true;
            }

            // TODO: Update polyline, remove last segment
            socket.emit("orderPickedUp", order);
        },

        orderDroppedOff: function (order) {
            console.log("orderDroppedOff");
            // Update used capacity
            this.usedCapacity -= Number(order.orderDetails.spaceRequired);

            Vue.delete(this.orders, order.orderId);
            this.map.removeLayer(this.customerMarkers[order.orderId].from);
            this.map.removeLayer(this.customerMarkers[order.orderId].dest);
            this.map.removeLayer(this.customerMarkers[order.orderId].line);
            Vue.delete(this.customerMarkers[order.orderId]);
            socket.emit('orderDroppedOff', order.orderId);
        },
        // TODO: express and processed need to be separated to properly represent a
        // non-express processed order (i.e. a regular order when going from the distribution
        // terminal to final destination)
        getPolylinePoints: function (order) {
            if (order.expressOrAlreadyProcessed) {
                return [order.fromLatLong, order.destLatLong];
            } else {
                return [order.fromLatLong, this.baseMarker.getLatLng()];
            }
        },
        putCustomerMarkers: function (order) {
            var fromMarker = L.marker(order.fromLatLong, {icon: this.fromIcon}).addTo(this.map);
            fromMarker.orderId = order.orderId;
            var destMarker = L.marker(order.expressOrAlreadyProcessed ? order.destLatLong : this.baseMarker.getLatLng()).addTo(this.map);
            destMarker.orderId = order.orderId;
            var connectMarkers = L.polyline(this.getPolylinePoints(order), {color: 'blue'}).addTo(this.map);
            return {from: fromMarker, dest: destMarker, line: connectMarkers};
        },
    },
    computed: {
        computeVisibility: function (event) {
            return this.visibility;
        }
    }
});
