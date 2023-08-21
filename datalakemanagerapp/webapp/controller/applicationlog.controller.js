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

        return Controller.extend("co.haina.datalakemanagerapp.controller.applicationlog", {
            onInit: function () {
                //Asignar valores de fecha por defecto
                let date = new Date(),
                month = ("0" + (date.getMonth())).slice(-2),
                day = ("0" + date.getDate()).slice(-2),
                year = date.getFullYear();

                var oModel = new JSONModel({
                    busy: false,
                    title: this.getResourceBundle().getText("logapp"),
                    valueDateFrom: UI5Date.getInstance(year, month, '01'),
                    valueDateTo: UI5Date.getInstance(year, month, day)
                });
                this.getOwnerComponent().setModel(oModel, "viewModel");
                
                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();
                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                // or just do it for the whole view
                oMessageManager.registerObject(oView, true);

                if (this.getRouter().getRoute("rtLogapp")) {
                    this.getRouter().getRoute("rtLogapp").attachPatternMatched(this.onMyRoutePatternMatched, this);
                }

            },
            onMyRoutePatternMatched: function (event) {
                
            },
            onMyRoutePatternMatchedVersion: function (oEvent) {
                
            }            
        });
    });
