sap.ui.define([
    "./BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/date/UI5Date",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/ui/commons/Label"
], function(BaseController, MessageBox, Filter, FilterOperator, JSONModel, UI5Date, Message, MessageType, Label) {
	"use strict";
    const date = new Date();
	var that = this;
		

	return BaseController.extend("co.haina.datalakemanagerapp.controller.readingMonitor", {	

		handleRouteMatched: function(oEvent) {
			
		},
		onInit: function() {
			//this.getOwnerComponent().getModel("ProfileValuesModel").metadataLoaded().then(this._onMetadataLoaded.bind(this));
			
			//Asignar valores de fecha por defecto
			let date = new Date(),
			 	month = ("0" + (date.getMonth())).slice(-2),
			 	day = ("0" + date.getDate()).slice(-2),
			 	year = date.getFullYear();
			
			var oModel = new JSONModel({
				busy: false,
				valueDateFrom: UI5Date.getInstance(year, month, '01'),
				valueDateTo: UI5Date.getInstance(year, month, day)
			});
			this.setModel(oModel, "viewModel");			
			this._getCompleteProfileValues();
			this._getMissingReading();
		},
		
		_getMissingReading: function (){
			
			var dateTo="".concat(this.getView().byId('dtToM').getValue()),
				dateFrom = "".concat(this.getView().byId('dtFromM').getValue());	

			var oLoginModel = this.getLoginModel();
			var data =  typeof this.getOwnerComponent().getModel() == 'undefined' ? new sap.ui.model.json.JSONModel() : this.getOwnerComponent().getModel();

			var settings = {
							"url": oLoginModel.endpoint_backend+"getMissingReading?date_from="+dateFrom+"&date_to="+dateTo,
							"method": "GET",
							"timeout": 0,
							"headers": {								
								"Authorization": "Bearer "+oLoginModel.token
							},
							"processData": false,
							"contentType": false,							
							success: function(result) { 
								var tblMissing = this.getView().byId('tblMissing'),
									missingValues = [];
								if (result.length < 1)
									return;
								//Crear columnas
								var colDesc= Object.keys(result[0]);
								for (var j = 0; j < colDesc.length; j++) {
																	
									tblMissing.addColumn(new sap.ui.table.Column({
										label: new sap.ui.commons.Label({text: result[0][colDesc[j]]}),             // Creates an Header with value defined for the text attribute
										template: new sap.ui.commons.TextField().bindProperty("value", colDesc[j] ), // binds the value into the text field defined using JSON
										sortProperty: colDesc[j],        // enables sorting on the column
										filterProperty: colDesc[j],       // enables set filter on the column
										width: "125px"                  // width of the column								
									}));
								}

								//enlazar datos
								for (var j = 1; j < result.length; j++) {
									missingValues.push(result[j])	
								}
																
								data.setProperty("/MissingProfileValues", missingValues);
								data.setProperty("/MissingProfileValuesCount", missingValues.length);
								this.getOwnerComponent().setModel(data);
								tblMissing.setModel(data);
								tblMissing.bindRows("/MissingProfileValues");


							}.bind(this),
							error: function(e) { console.log(e.message); }
							};

			var response = $.ajax(settings);

		},
		_getCompleteProfileValues: function (){
			var oModel = this.getOwnerComponent().getModel("ProfileValuesModel"),
				oFilter = [],
				dateTo="".concat(this.getView().byId('dtTo').getValue(),"T00:00:00.001"),
				dateFrom = "".concat(this.getView().byId('dtFrom').getValue(),"T00:00:00.001");					
			
		    var data =  typeof this.getOwnerComponent().getModel() == 'undefined' ? new sap.ui.model.json.JSONModel() : this.getOwnerComponent().getModel();
			
			oFilter.push(new Filter({
				path: "ProfDate",
				operator: FilterOperator.BT,
				value1: Date.parse(dateFrom),
				value2: Date.parse(dateTo)
			 }));

			oFilter.push(new Filter("Profile", FilterOperator.EQ, this.getView().byId('inpProfile').getValue()));
			oFilter.push(new Filter("ValueStatus", FilterOperator.EQ, 'EX01'));
			oFilter.push(new Filter("TimeZone", FilterOperator.EQ, "UTC-4".toString() ));
			 			 
			oModel.read("/ProfilesValueRelatedSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					
					data.setProperty("/CompleteProfileValues", oData.results);
					data.setProperty("/CompleteProfileValuesCount", oData.results.length);
					this.getOwnerComponent().setModel(data);					

				}.bind(this),
				error: function (oError) {
					
					data.setProperty("/CompleteProfileValues", []);
					data.setProperty("/CompleteProfileValuesCount", 0);
					this.getOwnerComponent().setModel(data);

					if (oError.statusCode.toString() !== "504") {
						this.showGeneralError({
							oDataError: oError
						});
						this.addMessage(new Message({
							message: this.getView().getModel("i18n").getResourceBundle().getText("ImportErrorSend"),
							description: oError.responseText,
							type: MessageType.Error
						}));
					}
				}.bind(this)
			});
		},
	});
}, /* bExport= */ true);
