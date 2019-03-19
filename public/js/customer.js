'use strict';
var socket = io();


var vm = new Vue({
    el: '#main',
    data: {
        status: null, // 1 is in car
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
        senderFirstName: "",
        senderLastName: "",
        senderAddress: "",
        senderZipcode: "",
        senderCity: "",
        senderNumber: "",
        senderEmail: "",
        senderAddress: "",
        receverFirstName: "",
        receverLastName: "",
        receverAddress: "",
        receverZipcode: "",
        receverCity: "",
        receverNumber: "",
        receverEmail: "",
        receverAddress: "",
        ccname: "",
        ccnumber: "",
        ccexpiration: "",
        cccvv: "",
        driverMarkers: {}
    },
    created: function () {
        socket.on('initialize', function (data) {

        }.bind(this));
        socket.on('orderId', function (orderId) {
            this.orderId = orderId;
        }.bind(this));
    },
    methods: {
        placeOrder: function (event) {
            {
                socket.emit("placeOrder", {
                    fromLatLong: [59.8490512210841, 17.600974144749024],
                    destLatLong: [59.8490512210841, 17.600974144749024],
                    expressOrAlreadyProcessed: this.express ? true : false,
                    handled: false,
                    orderDetails: {
                        pieces: 1,
                        spaceRequired:      this.spaceRequired,
                        totalGrams:         this.totalGrams,
                        driverInstructions: this.driverInstructions,
                        origin:             this.origin,
                        status:             0,
                        express:            this.express,
                        senderFirstName:    this.senderFirstName,
                        senderLastName:     this.senderLastName,
                        senderAddress:       this.senderAdress,
                        senderZipcode:      this.senderZipcode,
                        senderAddress:      this.senderAddress,
                        senderCity:         this.senderCity,
                        senderNumber:       this.senderNumber,
                        senderEmail:        this.senderEmail,
                        receverFirstName:   this.receverFirstName,
                        receverLastName:    this.receverLastName,
                        receverAddress:     this.receverAddress,
                        receverZipcode:     this.receverZipcode,
                        receverCity:        this.receverCity,
                        receverNumber:      this.receverNumber,
                        receverAddress:     this.senderAddress,
                        receverEmail:       this.receverEmail,
                        ccname:             this.ccname,
                        ccnumber:           this.ccnumber,
                        ccexpiration:       this.ccexpiration,
                        cccvv:              this.cccvv
                    }
                });
            }
        },
        toggleExpress: function (event) {
            if (this.express == true) {
                this.express = false;
                return;
            }

            this.express == true;
        },
        swish: function (event) {
            document.getElementById('swish').style.display = 'block';
            document.getElementById('creditCard').style.display = 'none';
            document.getElementById('invoice').style.display = 'none';
        },
        creditCard: function (event) {
            document.getElementById('creditCard').style.display = 'block';
            document.getElementById('swish').style.display = 'none';
            document.getElementById('invoice').style.display = 'none';
        },
        invoice: function (event) {
            document.getElementById('invoice').style.display = 'block';
            document.getElementById('swish').style.display = 'none';
            document.getElementById('creditCard').style.display = 'none';
        },

        SelectPackage: function (event) {

        },
    },
});
