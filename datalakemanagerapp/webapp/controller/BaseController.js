/*global history */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/Dialog",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/Core",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, History, Dialog, JSONModel, MessageToast, Core, MessageBox, Export, ExportTypeCSV, Message, MessageType, Filter,
	FilterOperator) {
	"use strict";

	const cNumberDecimal = 5,
		  cDefaultNumValue = "0.00000",
		  cBaseurl = "http://localhost:8002/";//"https://dev-polaris-api.egehaina.com/";

	return Controller.extend("co.haina.datalakemanagerapp.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		registerMessageManager: function(){
			this._oMessageManager = Core.getMessageManager();
			// Clear the old messages
			this._oMessageManager.removeAllMessages();
		},
		openApiLogin: function (){
			// create dialog lazily
			if (!this.oMPDialog) {
				this.oMPDialog = this.loadFragment({
					name: "co.haina.datalakemanagerapp.view.loginDataLake"
				});
			}
			this.oMPDialog.then(function (oDialog) {
				this.oDialog = oDialog;
				this.oDialog.open();
				this._oMessageManager.registerObject(this.oView.byId("formContainer"), true);
				
			}.bind(this));
		},
		apiLogin: function(){
			//inicializar el modelo de Login
			this.setViewBusy(true);

			var loginInfo = {
				user: this.getView().byId("user").getValue(),
				password: this.getView().byId("password").getValue(),
				endpoint_backend: cBaseurl
			};
			var oLoginModel = new JSONModel(loginInfo);
			this.getOwnerComponent().setModel(oLoginModel, "LoginModel");
			this.setModel(oLoginModel, "LoginModel");

			this.getToke("");
			this.closeApiLogin();
			this.setViewBusy(false);
			MessageToast.show(this.getResourceBundle().getText("userLogin"));
		},
		_getLog: function(oEvent,LogType="app"){
			
			this.setViewBusy(true);

			var dateTo="".concat(this.getView().byId('dtTo').getValue()),
				dateFrom = "".concat(this.getView().byId('dtFrom').getValue());                    

			var oLoginModel = this.getLoginModel();
			var data =  typeof this.getOwnerComponent().getModel() == 'undefined' ? new sap.ui.model.json.JSONModel() : this.getOwnerComponent().getModel();

			var settings = {
							"url": oLoginModel.endpoint_backend+"getLogs?date_from="+dateFrom+"&date_to="+dateTo+"&logType="+LogType,
							"method": "GET",
							"timeout": 0,
							"headers": {								
								"Authorization": "Bearer "+oLoginModel.token
							},
							"processData": false,
							"contentType": false,							
							success: function(result) { 
								
								this.setViewBusy(false);

								var tblLog = this.getView().byId('tblLog'),
									logValues = [];
								
								tblLog.removeAllColumns();

								if (result.length < 1){
									MessageToast.show(this.getResourceBundle().getText("noData"));
									return;
								}
								//Crear columnas
								var colDesc= Object.keys(result[0]);
								for (var j = 0; j < colDesc.length; j++) {
																	
									tblLog.addColumn(new sap.ui.table.Column({
										label: new sap.ui.commons.Label({text: result[0][colDesc[j]]}),             // Creates an Header with value defined for the text attribute
										template: new sap.ui.commons.TextField().bindProperty("value", colDesc[j] ), // binds the value into the text field defined using JSON
										sortProperty: colDesc[j],        // enables sorting on the column
										filterProperty: colDesc[j],       // enables set filter on the column
										width: "125px"                  // width of the column								
									}));
								}

								//enlazar datos
								for (var j = 1; j < result.length; j++) {
									logValues.push(result[j])	
								}
																
								data.setProperty("/LogValues", logValues);
								data.setProperty("/LogValuesCount", logValues.length);
								this.getOwnerComponent().setModel(data);
								tblLog.setModel(data);
								tblLog.bindRows("/LogValues");


							}.bind(this),
							error: function(e) { 
								this.setViewBusy(false);
								if ( typeof e.responseJSON !== 'undefined' ){
									this.showResponseMessages(e.responseJSON);
								}else{
									this.showResponseMessages(e);
								}
							 }.bind(this)
							};

			var response = $.ajax(settings);

		},            
		setViewBusy:function (state){
			//Consultar modelo			
			var oviewModel =  typeof this.getOwnerComponent().getModel("viewModel") == 'undefined' ? new JSONModel() : this.getOwnerComponent().getModel("viewModel");
			//actualizar propiedad en caso de que ya la tenga
			oviewModel.setProperty("/busy/", state);

            this.getOwnerComponent().setModel(oviewModel, "viewModel");	
		},
		closeApiLogin: function () {
			this.oDialog.close();
		},
		getLoginModel: function(){
			var oLoginModel = this.getOwnerComponent().getModel("LoginModel");			
			
			try{
				oLoginModel = oLoginModel.getData();
			}catch(error){
				
			}

			this.setModel(oLoginModel, "LoginModel");

			return oLoginModel;
		},
		getToke: function(iBaseurl) {
            
			var oLoginModel = this.getLoginModel();
			
			if( iBaseurl === "" ){
				iBaseurl = oLoginModel.endpoint_backend;
			}
			var url = iBaseurl + 'token';			
			

			var token = $.ajax({
				context: this,
				url: url,
				async: false,
				method: 'POST',
				timeout: 0,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				data: {
					"grant_type": "password",
					"username": oLoginModel.user,
					"password": oLoginModel.password,
					"token": ""
				},
				success: function(result) { },
				error: function(e) { 
					this.setViewBusy(false);
					this.showResponseMessages(e.responseJSON) 
				}.bind(this)
			});						
			if ( typeof token.responseJSON !== 'undefined' ) {
				oLoginModel.token = token.responseJSON.access_token;
				this.getOwnerComponent().setModel(oLoginModel, "LoginModel");
				this.oLoginModel = oLoginModel;	
			}else{
				oLoginModel.token = ""
			}

			return oLoginModel.token;
		},
		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			//	oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			//if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},

		/**
		@public
		Esta función es usada para abrir un diálogo cuando el usuario lo requiere
		*/
		crearFragment: function (data) {
			if (!this._Dialog) {
				this._Dialog = sap.ui.xmlfragment(data, this);
				this.getView().addDependent(this._Dialog);
			}
			// open value help dialog
			this._valueHelpDialog.open();
		},
		/**
		 * Abrir Fragment.
		 * @public
		 * @param {string} pFragment es Ruta.NombreFragment a abrir
		 */
		fnOpenDialog: function (pFragment) {
			this.oFragment = new Object();
			this.oFragment.view = null;

			this.fnLoadDialog(pFragment, this.oFragment);
			this.oFragment.view.open();
		},

		/**
		 * Cerrar el fragment
		 * @public
		 */
		fnCloseFragment: function () {
			this.fnCloseDialog(this.oFragment);
			delete this.oFragment;
		},

		/**
		 * Instanciar Fragment.
		 * @public
		 * @param {string} sRutaFragment es Ruta.NombreFragment a instanciar
		 * @param {object} objFragment Objeto global contenedor del fragment
		 * @returns {object}
		 */
		fnLoadDialog: function (sRutaFragment, objFragment) {
			if (objFragment.view) {
				return;
			}
			// associate controller with the fragment
			objFragment.view = sap.ui.xmlfragment(sRutaFragment, this);
			this.getView().addDependent(objFragment.view);
		},

		/**
		 * Cerrar Fragment.
		 * @public
		 * @param {object} objFragment Objeto global contenedor del fragment
		 */
		fnCloseDialog: function (objFragment) {
			objFragment.view.destroy();
		},
		formatDate: function (v) {
			jQuery.sap.require("sap.ui.core.format.DateFormat");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-YYYY"
			});
			return oDateFormat.format(new Date(v));
		},		
		showResponseMessages: function (oResponse, pMessageTitleError = this.getResourceBundle().getText("errorTitleMessageBox"),
			pMessageTitleOk = this.getResourceBundle().getText("SuccessTitle")) {

			var msgType = MessageType.Error,
				msg_json="",
				MessageTitle,
				oResponseJson;

			if (oResponse === undefined) {
				return false;
			}
			//Mensjae en formato general
			if (typeof oResponse.severity != 'undefined' && typeof oResponse.severity != 'message' ){
				oResponseJson = oResponse;
			}else if (typeof oResponse.headers == 'undefined' && typeof oResponse.statusText != 'undefined'){
				oResponseJson = JSON.parse('{"severity": "error", "message": "'+oResponse.statusText+'" }');
			}else if (typeof oResponse.headers == 'undefined' && typeof oResponse.detail != 'undefined' ){
				if (oResponse.detail.length > 0 ){
					oResponse.detail = oResponse.detail[0]
				}
				oResponseJson = JSON.parse('{"severity": "error", "message": "'+oResponse.detail+'" }' );
			}else if (typeof oResponse.headers == 'undefined' ){
				msg_json = JSON.stringify(oResponse).replace(/\\n/g, "\\n")
													.replace(/\\'/g, "\\'")
													.replace(/\\"/g, '\\"')
													.replace(/\\&/g, "\\&")
													.replace(/\\r/g, "\\r")
													.replace(/\\t/g, "\\t")
													.replace(/\\b/g, "\\b")
													.replace(/\\f/g, "\\f");
				oResponseJson = JSON.parse('{"severity": "error", "message": "'+msg_json+'" }');
			}

			if (typeof oResponseJson != 'undefined' ) {
				
				if (oResponseJson.severity === "info" || oResponseJson.severity === "successful" 
					|| oResponseJson.severity === "information") {
					msgType = MessageType.Success;
					MessageTitle = pMessageTitleOk;
				} else {
					MessageTitle = pMessageTitleError;
				}

				MessageBox.show(
					oResponseJson.message, {
						icon: oResponseJson.severity === "info" ? MessageBox.Icon.SUCCESS : MessageBox.Icon.ERROR,
						title: MessageTitle
					});

				this.addMessage(new Message({
					message: oResponseJson.message,
					type: msgType
				}));
				
				if ( typeof oResponseJson.details !== "undefined" ){
					for (var j = 0; j < oResponseJson.details.length; j++) {
						this.addMessage(new Message({
							message: oResponseJson.details[j].message,
							type: MessageType.Error
						}));
					}
				}

				return true;
			}

		},
		/**
		 * Mostrar mensajes de error
		 * @public
		 * @param {object} oParams Parametros del OData
		 */
		showGeneralError: function (oParams) {
			oParams = jQuery.extend({
				message: "",
				additionalData: "",
				oDataError: "",
				title: "",
				onClose: function () {}
			}, oParams);
			var sMessage = "",
				sAditionalData = "";
			if (oParams.message) {
				sMessage = oParams.message;
			} else {
				sMessage = this.getResourceBundle().getText("technicalError");
			}
			if (oParams.additionalData) {
				sAditionalData = oParams.additionalData;
			}
			if (oParams.oDataError) {
				try {
					var oResponse = jQuery.parseJSON(oParams.oDataError.responseText);
					if (oResponse.error.code.indexOf("ZMC_SIM") >= 0) {
						sMessage = oResponse.error.message.value;
						sAditionalData = "";
					} else {
						sAditionalData = oResponse.error.message.value;
					}
				} catch (oException) {
					sAditionalData = oParams.oDataError;
				}
			}
			jQuery.sap.log.error(sMessage);
			jQuery.sap.log.error(sAditionalData);
			var sTitleBox = oParams.title ? oParams.title : this.getResourceBundle().getText("errorTitleMessageBox");
			MessageBox.show(sMessage, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: sTitleBox,
				onClose: oParams.onClose,
				details: sAditionalData,
				actions: sap.m.MessageBox.Action.CLOSE
			});
		},
		/**
		 * Exportar a CSV
		 * @public
		 * @param {object} JSON oModel Modelo de la tabla
		 * @param {object} oColumns Estructura de la tabla
		 * @param {string} pPath Path del modelo
		 */
		cvsDataExport: function (oModel, oColumns, pPath = "/") {

			var oExport = new Export({

				exportType: new ExportTypeCSV({
					separatorChar: "	"
				}),

				models: oModel,

				rows: {
					path: pPath
				},
				columns: oColumns
			});

			oExport.saveFile().catch(function (oError) {
				this.showGeneralError({
					oDataError: oError
				});
			}).then(function () {
				oExport.destroy();
			});
		},
		isInitialNum: function (pNumber, pDecSeparator = ".") {
			if (pNumber !== undefined) {
				pNumber = pNumber.replace(pDecSeparator, "").replace(new RegExp("0", "g"), "").trim();
			}

			return pNumber;
		},
		csv_to_Json: function (pCsv, pSeparator, pWithHeaderName = false) {
			var lines = pCsv.split("\n");
			var result = [];
			var headers = lines[0].split(pSeparator);

			if (headers.length <= 1) {
				pSeparator = ",";
				headers = lines[0].split(pSeparator);
			}

			if (headers.length <= 1) {
				pSeparator = "	";
				headers = lines[0].split(pSeparator);
			}

			if (headers.length <= 1) {
				this.addMessage(new Message({
					message: this.getResourceBundle().getText("IncorrectFileFormat"),
					type: MessageType.Error
				}));
			} else {
				for (var i = 1; i < lines.length; i++) {
					var obj = {};
					var currentline = lines[i].split(pSeparator);
					for (var j = 0; j < headers.length; j++) {
						if (pWithHeaderName === false) {
							obj[j] = currentline[j];
						} else {
							obj[headers[j]] = currentline[j];
						}
					}
					result.push(obj);
				}
				var oStringResult = JSON.stringify(result);
				var oFinalResult = JSON.parse(oStringResult.replace(/\\r/g, "")); //OBJETO JSON para guardar
			}
			return oFinalResult;
		},
		//################ Private APIs ###################
		initMessageManager() {
			sap.ui.getCore().getMessageManager().removeAllMessages();

			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(this.oMessageManager.getMessageModel(), "message");
			this.oMessageManager.registerObject(this.getView(), true);
		},
		addMessage(oMessage) {

			oMessage.target = "/Dummy";
			oMessage.processor = this.getView().getModel();
			sap.ui.getCore().getMessageManager().addMessages(oMessage);
		},
		
		formatNumberOut: function (pNumber) {
			return pNumber !== undefined ? Number(pNumber.toString().replace(".", ".")).toFixed(cNumberDecimal) : "";
		},
		formatNumberIn: function (pNumber) {
			var numberData = pNumber;
			//ajustar numero cuando se carga desde archivo CSV
			if (numberData !== undefined && numberData.toString().split(".").length > 2) {
				numberData = numberData.toString().split(".").join("");
				if (numberData.length > 5) {
					numberData = numberData.toString().replace(".", "");
					numberData = numberData.toString().substring(0, (numberData.length - 5)) + "." + numberData.toString().substring((numberData.length -
						5), numberData.length);
				}
			}

			numberData = numberData !== undefined ? Number(numberData).toFixed(cNumberDecimal) : cDefaultNumValue;
			numberData = isNaN(numberData) ? cDefaultNumValue : numberData.toString().replace(",", ".");
			return numberData;
		},
		checkNumericValue: function (pValue, pMaterial, pPlant) {
			var description = "";

			if (isNaN(Number(pValue))) {

				if (pMaterial !== undefined) {
					description = "Material: " + pMaterial + " " + this.getResourceBundle().getText("Plant") + ": " + pPlant;
				}
				this.addMessage(new Message({
					message: this.getResourceBundle().getText("ErrorNoNum") + ": " + pValue,
					description: description,
					type: MessageType.Error
				}));
				return false;
			}

			return true;
		}
	});

});