sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/message/Message",
    "sap/ui/core/date/UI5Date",
    "sap/ui/core/MessageType",
    "sap/ui/commons/Label"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, Message, UI5Date, MessageType, Label) {
        "use strict";

        var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.userAdmin", {
            onInit: function () {

                var oModel = new JSONModel({
                    busy: false,
                    title: this.getResourceBundle().getText("userAdmin")
                });
                this.getOwnerComponent().setModel(oModel, "viewModel");

                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();
                //set User Model
                var userModel = new JSONModel({
                    "username": "",
                    "full_name": "",
                    "password": "",
                    "email": "",
                    "disabled": false
                });
                oView.setModel(userModel, "userModel");
                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                // or just do it for the whole view
                oMessageManager.registerObject(oView, true);

                if (this.getRouter().getRoute("rtUserAdmin")) {
                    this.getRouter().getRoute("rtUserAdmin").attachPatternMatched(this.onMyRoutePatternMatched, this);
                }

            },
            getUsers: function (oEvent, UserType = "app") {

                this.setViewBusy(true);

                var oLoginModel = this.getLoginModel();
                var data = typeof this.getOwnerComponent().getModel() == 'undefined' ? new sap.ui.model.json.JSONModel() : this.getOwnerComponent().getModel();

                var settings = {
                    "url": oLoginModel.endpoint_backend + "users/get",
                    "method": "GET",
                    "timeout": 0,
                    "headers": {
                        "Authorization": "Bearer " + oLoginModel.token
                    },
                    "processData": false,
                    "contentType": false,
                    success: function (result) {

                        this.setViewBusy(false);

                        var tblUser = this.getView().byId('tblUser'),
                            UserValues = [];

                        tblUser.removeAllColumns();

                        if (result.length < 1) {
                            MessageToast.show(this.getResourceBundle().getText("noData"));
                            return;
                        }
                        //Crear columnas
                        var colDesc = Object.keys(result[0]);
                        for (var j = 0; j < colDesc.length; j++) {

                            tblUser.addColumn(new sap.ui.table.Column({
                                label: new sap.ui.commons.Label({ text: result[0][colDesc[j]] }),             // Creates an Header with value defined for the text attribute
                                template: new sap.ui.commons.TextField().bindProperty("value", colDesc[j]), // binds the value into the text field defined using JSON
                                sortProperty: colDesc[j],        // enables sorting on the column
                                filterProperty: colDesc[j],       // enables set filter on the column
                                width: "125px"                  // width of the column								
                            }));
                        }
                        //agregar columna
                        tblUser.addColumn(new sap.ui.table.Column({
                            label: new sap.ui.commons.Label({ text: this.getResourceBundle().getText("remove") }),             // Creates an Header with value defined for the text attribute
                            template: new sap.ui.commons.Button({
                                text: "",
                                icon: "sap-icon://decline",
                                enabled: true,
                                press: function (e) { }
                            }),
                            sortProperty: this.getResourceBundle().getText("remove"),        // enables sorting on the column
                            filterProperty: this.getResourceBundle().getText("remove"),       // enables set filter on the column
                            width: "125px"                  // width of the column								
                        }));

                        //enlazar datos
                        for (var j = 1; j < result.length; j++) {
                            UserValues.push(result[j])
                        }

                        data.setProperty("/UserValues", UserValues);
                        data.setProperty("/UserValuesCount", UserValues.length);
                        this.getOwnerComponent().setModel(data);
                        tblUser.setModel(data);
                        tblUser.bindRows("/UserValues");


                    }.bind(this),
                    error: function (e) {
                        this.setViewBusy(false);
                        if (typeof e.responseJSON !== 'undefined') {
                            this.showResponseMessages(e.responseJSON);
                        } else {
                            this.showResponseMessages(e);
                        }
                    }.bind(this)
                };

                var response = $.ajax(settings);

            },
            onSaveUser: function(event){
                this.setViewBusy(true);

                var oLoginModel = this.getLoginModel();
                var oView = this.getView();

                var token = $.ajax({
                    context: this,
                    url: oLoginModel.endpoint_backend + "users/create",
                    async: false,
                    method: 'POST',
                    timeout: 0,
                    headers: { 
                        'Content-Type': 'application/json',
                        "Authorization": "Bearer " + oLoginModel.token
                    },
                    data: JSON.stringify(oView.getModel("userModel").oData),
                    success: function(result) { 
                        this.setViewBusy(false);
                        this.oDialog.close();
                        this.getUsers();
                    },
                    error: function(e) { 
                        this.setViewBusy(false);
                        this.showResponseMessages(e.responseJSON) 
                    }.bind(this)
                });
            },
            onCreateUser: function (event) {
                // create dialog lazily
                if (!this.oMPDialog) {
                    this.oMPDialog = this.loadFragment({
                        name: "co.haina.datalakemanagerapp.view.newUser"
                    });
                }
                this.oMPDialog.then(function (oDialog) {
                    this.oDialog = oDialog;
                    this.oDialog.open();
                    this._oMessageManager.registerObject(this.oView.byId("formContainer"), true);

                }.bind(this));
            },
            onMyRoutePatternMatched: function (event) {

            },
            onMyRoutePatternMatchedVersion: function (oEvent) {

            }
        });
    });
