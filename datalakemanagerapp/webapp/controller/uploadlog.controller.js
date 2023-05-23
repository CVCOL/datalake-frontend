sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/message/Message"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, Message) {
        "use strict";

        var version = "DEFAULT";	
	    var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.uploadlog", {
            onInit: function () {
                var oModelV = new JSONModel({
                    busy: false,
                    title: "",
                    versionStatus: ""//this.getResourceBundle().getText("status0")
                });
                this.setModel(oModelV, "modelView");

                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();

                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");

                // or just do it for the whole view
                oMessageManager.registerObject(oView, true);



                //var myRoute = this.getOwnerComponent().getRouter().getRoute("rtChCommodities");
                //myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);

                if (this.getRouter().getRoute("rtLogupload")) {
                    this.getRouter().getRoute("rtLogupload").attachPatternMatched(this.onMyRoutePatternMatched, this);
                }

            },
            onMyRoutePatternMatched: function (event) {
                var aFilter = [];

                this.getVersionStatus({
                    Version: version,
                    Modulo: cModule
                });
                //Cargar datos
                // this.getModel("modelView").setProperty("/title", (this.getView().getModel("i18n").getResourceBundle().getText("CommoditiesTitle") +
                //     ": " + version).toString());

                // aFilter.push(new Filter("Flag", FilterOperator.EQ, 'X'));

                // this.fnConsultaDetalleCommodities(version);
                // this.getView().byId("btnAdmin").setVisible(true);
                // this.getView().byId("cmbYear").setVisible(true);
                // this.Periodos = this.getPeriodos();

            },

            onMyRoutePatternMatchedVersion: function (oEvent) {
                this.initMessageManager();
                SelectVersion.init(this, cModule);
                SelectVersion.open();
                this.getView().byId("btnAdmin").setVisible(false);
                this.getView().byId("cmbYear").setVisible(false);
                this.Periodos = this.getPeriodos();
            },
            onShowVersion: function (oData) {
                var aFilter = [];
                version = oData.idVersion;

                this.getVersionStatus({
                    Version: version,
                    Modulo: cModule
                });
                this.getModel("modelView").setProperty("/title", (this.getView().getModel("i18n").getResourceBundle().getText("CommoditiesTitle") +
                    ": " + oData.nameVersion).toString());

                aFilter.push(new Filter("Version", FilterOperator.EQ, version));
                this.fnConsultaDetalleCommodities(version);
            }
        });
    });
