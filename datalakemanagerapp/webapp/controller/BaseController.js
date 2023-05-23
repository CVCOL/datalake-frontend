/*global history */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, History, Dialog, Button, MessageToast, Text, MessageBox, Export, ExportTypeCSV, Message, MessageType, Filter,
	FilterOperator) {
	"use strict";

	const cNumberDecimal = 5,
		cDefaultNumValue = "0.00000";

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
		f_crear_fargment: function (data) {
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(data, this);
				this.getView().addDependent(this._valueHelpDialog);
			}
			// open value help dialog
			this._valueHelpDialog.open();
		},

		/**
		 * Consumir servicio READ
		 * @public
		 * @param {object} pModel Modelo del Servicio Web
		 * @param {string} pEntidad Nombre de la entidad a consumir
		 * @param {object} pFilters Objeto con los filtros definidos
		 */
		fnReadEntity: function (pModelo, pEntidad, pFilters) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.read(pEntidad, null, pFilters, false, fnSucess, fnError);

			return oMensaje;
		},

		/**
		 * Obtener sólo Un registro de la Entidad
		 * @public
		 * @param {object} pModel Modelo del Servicio Web
		 * @param {string} pEntidad Nombre de la entidad a consumir
		 * @param {object} pFilters Objeto con los filtros definidos
		 */
		fnGetEntity: function (pModelo, pEntidad, pFilters) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = response;
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.read(pEntidad, null, pFilters, false, fnSucess, fnError);

			return oMensaje;
		},

		/**
		 * Abrir Fragment.
		 * @public
		 * @param {string} pFragment es Ruta.NombreFragment a abrir
		 */
		fnOpenDialog: function (sRutaFragment) {
			this.oFragment = new Object();
			this.oFragment.view = null;

			this.fnLoadDialog(sRutaFragment, this.oFragment);
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

		/**
		 * Consumir servicio CREATE.
		 * @public
		 * @param {object} pModelo hace referencia al modelo del servicio
		 * @param {string} pEntidad hace referencia a la entidad que se va a consumir
		 * @param {object} pDatoEndidad hace referencia a los dato a enviar a la entidad
		 * @returns {string} mensaje
		 */
		fnCreateEntity: function (pModelo, pEntidad, pDatoEndidad) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
				oMensaje.response = response;
			};
			var fnError = function (e) {
				vMensaje = e.response.body;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.create(pEntidad, pDatoEndidad, null, fnSucess, fnError, false);

			return oMensaje;
		},

		/**
		 * Dialogo de confirmación
		 * @public
		 * @param {string} p_text_msj hace referencia al modelo del servicio
		 * @param {object} p_funcion_si Función que se ejecutará cuando el usuario presione Si
		 * @returns {object} Dialogo
		 */
		f_onApproveDialog: function (p_text_msj, p_funcion_si, p_funcion_no, p_obj_contexto) {
			var dialog = new Dialog({
				title: 'Confirmación',
				type: 'Message',
				content: new Text({
					text: p_text_msj
				}),
				beginButton: new Button({
					text: 'Si',
					press: [null, p_funcion_si, p_obj_contexto]
				}),
				endButton: new Button({
					text: 'No',
					press: [null, p_funcion_no, p_obj_contexto]
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			//dialog.open();
			return dialog;
		},

		/**
		 * Consumir servicio UPDATE.
		 * @public
		 * @param {object} pModelo hace referencia al modelo del servicio
		 * @param {string} pEntidad hace referencia a la entidad que se va a consumir
		 * @param {object} pDatoEndidad hace referencia a los dato a enviar a la entidad
		 * @returns {string} mensaje
		 */
		fnUpdateEntity: function (pModelo, pEntidad, pDatoEndidad) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.response = response;
				oMensaje.datos = data;
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.update(pEntidad, pDatoEndidad, null, fnSucess, fnError, false);

			return oMensaje;
		},

		/**
		 * Consumir servicio Delete.
		 * @public
		 * @param {object} pModelo hace referencia al modelo del servicio
		 * @param {string} pEntidad hace referencia a la entidad que se va a consumir
		 * @param {object} pDatoEndidad hace referencia a los dato a enviar a la entidad
		 * @returns {string} mensaje
		 */
		fnRemoveEntity: function (pModelo, pEntidad) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.response = response;
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.remove(pEntidad, null, fnSucess, fnError, false);

			return oMensaje;
		},

		formatDate: function (v) {
			jQuery.sap.require("sap.ui.core.format.DateFormat");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-YYYY"
			});
			return oDateFormat.format(new Date(v));
		},

		/**
		 * Consumir servicio CREATE.
		 * @public
		 * @param {object} pModelo hace referencia al modelo del servicio
		 * @param {string} pEntidad hace referencia a la entidad que se va a consumir
		 * @param {object} pDatoEndidad hace referencia a los dato a enviar a la entidad
		 * @returns {string} mensaje
		 */
		fnCreateEntityAsy: function (pModelo, pEntidad, pDatoEndidad, pTpRequest) {

			var vMensaje = null;
			var oMensaje = {};
			// var sociedadPromise = new Promise();
			var promise = jQuery.Deferred();

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
				promise.resolve(oMensaje);
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
				promise.reject(vMensaje);
			};

			pModelo.create(pEntidad, pDatoEndidad, {
				context: null,
				success: fnSucess,
				error: fnError,
				async: pTpRequest
			});

			// return oMensaje;
			return promise;

		},

		/**
		 * Consumir servicio READ
		 * @public
		 * @param {object} pModel Modelo del Servicio Web
		 * @param {string} pEntidad Nombre de la entidad a consumir
		 * @param {object} pFilters Objeto con los filtros definidos
		 */
		fnReadEntityAsyn: function (pModelo, pEntidad, pFilters, pTpRequest) {
			var vMensaje = null;
			var oMensaje = {};
			// var sociedadPromise = new Promise();
			var promise = jQuery.Deferred();

			var fnSucess = function (data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
				promise.resolve(oMensaje);
			};
			var fnError = function (e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
				promise.reject(vMensaje);
			};

			pModelo.read(pEntidad, null, pFilters, pTpRequest, fnSucess, fnError);

			return promise;
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

		showResponseMessages: function (oResponse, pMessageTitleError = this.getResourceBundle().getText("errorTitleMessageBox"),
			pMessageTitleOk = this.getResourceBundle().getText("SuccessTitle")) {

			var msgType = MessageType.Error,
				MessageTitle,
				oResponseJson;

			if (oResponse === undefined) {
				return false;
			}

			if (oResponse.headers.hasOwnProperty("sap-message")) {
				oResponseJson = JSON.parse(oResponse.headers["sap-message"]);

				if (oResponseJson.severity === "info") {
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

				for (var j = 0; j < oResponseJson.details.length; j++) {
					this.addMessage(new Message({
						message: oResponseJson.details[j].message,
						type: MessageType.Error
					}));
				}

				return true;
			}

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
		onMessagePopoverPress: function (oEvent) {
			this._getMessagePopover().openBy(oEvent.getSource());
		},
		_getMessagePopover: function () {
			// create popover lazily (singleton)
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(),
					"cbc.co.simulador_costos.view.Utilities.fragments.MessagePopover", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},
		startProcessConsult: function (pProcessId, pModule) {
			if (pProcessId !== "") {
				this.getProcessStatus(pModule);
			}
		},
		getProcessStatus: function (pModule) {
			var oModel = this.getView().getModel("ModelSimulador");
			var aFilter = [];

			if (this.getModel("modelView").getProperty("/processId") !== "") {

				aFilter.push(new Filter("IdProceso", FilterOperator.EQ, this.getModel("modelView").getProperty("/processId")));
				aFilter.push(new Filter("Modulo", FilterOperator.EQ, pModule));

				oModel.read("/procesoImportSet", {
					filters: aFilter,
					success: function (oData, response) {
						if (oData.results[0].Estado === "OK") {

							MessageBox.show(
								this.getResourceBundle().getText("importOk"), {
									icon: MessageBox.Icon.SUCCESS,
									title: this.getResourceBundle().getText("SuccessTitle"),
									actions: [MessageBox.Action.OK]
								});

							this.getModel("modelView").setProperty("/processId", "");
							this.getView().setBusy(false);

							if (typeof this.loadMaterial !== "undefined") {
								this.loadMaterial("DEFAULT", "PLAN", "");
							}

							if (typeof this.getLogisticCostValoration !== "undefined") {
								this.getLogisticCostValoration();
							}

							this.addMessage(new Message({
								message: this.getResourceBundle().getText("importOk"),
								type: MessageType.Success
							}));

						} else if (oData.results[0].Estado === "ERROR") {
							this.getModel("modelView").setProperty("/processId", "");
							this.getView().setBusy(false);

							this.addMessage(new Message({
								message: this.getResourceBundle().getText("ImportErrorSend"),
								type: MessageType.Error
							}));
							this.getModel("modelView").setProperty("/busy", false);
						} else {
							setTimeout(this.getProcessStatus(pModule), 100000);
						}
					}.bind(this),
					error: function (oError) {
						if (oError.statusCode === undefined || (oError.statusCode.toString() !== "504" && oError.statusCode.toString() !== "500")) {
							this.addMessage(new Message({
								message: this.getView().getModel("i18n").getResourceBundle().getText("ImportErrorSend"),
								type: MessageType.Error
							}));
							this.getModel("modelView").setProperty("/processId", "");
							this.getView().setBusy(false);
							this.getModel("modelView").setProperty("/busy", false);
						} else if (this.getModel("modelView").getProperty("/processId") !== "") {
							setTimeout(this.getProcessStatus(pModule), 100000);
						}
					}.bind(this)
				});
			}
		},
		uuidv4: function () {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0,
					v = c === "x" ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
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
		},
		/**
		 * Ejecutar formula commodite
		 * @function
		 * @param 
		 * @private
		 */
		materialFormulaExecute: function (pMaterial, pWithEval = false) {
			var vFormula = "",
				vPatron = "",
				vMessage = "",
				eResult = cDefaultNumValue;

			if (pMaterial.Txtlgm !== undefined && pMaterial.Txtlgm.toString() !== "") {
				vFormula = pMaterial.Txtlgm;

				vPatron = "PrecioProductivo";
				vFormula = vFormula.replace(vPatron, pMaterial.preprodc);

				vPatron = "CostoMaterial";
				vFormula = vFormula.replace(vPatron, pMaterial.costmat);

				vPatron = "CostoConversion";
				vFormula = vFormula.replace(vPatron, pMaterial.costconv);

				vPatron = "CostoEnvio";
				vFormula = vFormula.replace(vPatron, pMaterial.costenv);

				try {
					eResult = eval(vFormula);
					if (isNaN(eResult)) {
						eResult = cDefaultNumValue;
					}
				} catch (error) {
					eResult = cDefaultNumValue;

					vMessage = this.getResourceBundle().getText("Material") + ": " + pMaterial.MDEF_IDMATERIAL +
						" " + this.getResourceBundle().getText("titleCompanyCode") + ": " + pMaterial.MDEF_SOCIEDAD +
						" " + this.getResourceBundle().getText("Plant") + ": " + pMaterial.MDEF_CENTRO +
						" " + this.getResourceBundle().getText("Year") + ": " + pMaterial.MDEF_PERIODO +
						" " + this.getResourceBundle().getText("period") + ": " + pMaterial.MDEF_MES;

					this.addMessage(new Message({
						message: vMessage,
						description: this.getView().getModel("i18n").getResourceBundle().getText("FormError") + " " + vFormula + "\n" + error.message,
						type: MessageType.Error
					}));

					if (pWithEval === true) {
						return NaN;
					}

				}
			}
			return this.formatNumberIn(eResult);

		},
		materialCalculation: function (oValueItem) {
			oValueItem.MDEF_COSTOMATERIAL = this.formatNumberIn(Number(
				Number(oValueItem.MDEF_PRECIOPRODUCTIVO) +
				Number(oValueItem.MDEF_COSTOCONVERSION) +
				Number(oValueItem.MDEF_COSTOADICIONAL) +
				Number(oValueItem.MDEF_COSTOENVIO)).toFixed(cNumberDecimal));

			oValueItem.MDEF_COSTOTRANSFERENCIA = this.formatNumberIn(Number(
				(Number(oValueItem.MDEF_COSTOMATERIAL) +
					Number(oValueItem.MDEF_OTROSCOSTOS)) *
				(Number(oValueItem.MDEF_PCTRANSFERENCIA) / 100)).toFixed(cNumberDecimal));

			oValueItem.MDEF_PRECIOPREMISA = this.formatNumberIn(Number(
				Number(oValueItem.MDEF_COSTOMATERIAL) +
				Number(oValueItem.MDEF_OTROSCOSTOS) +
				Number(oValueItem.MDEF_COSTOTRANSFERENCIA)).toFixed(cNumberDecimal));

			return oValueItem;
		},
		publishVersion: function (oVersion) {
			var oModel = this.getView().getModel("ModelSimulador");
			this.getModel("modelView").setProperty("/busy", true);

			oModel.update("/versionSet(Version='" + oVersion.Version + "',Modulo='" + oVersion.Modulo + "',FiscYear='" +
				oVersion.FiscYear + "')", oVersion, {
					success: function (oData, oResponse) {
						this.getModel("modelView").setProperty("/busy", false);

						if (this.getView().byId("objStatus") !== undefined) {
							if (oVersion.Estado === "9") {
								this.getView().byId("objStatus").setState("Success");
								this.getModel("modelView").setProperty("/versionStatus", this.getResourceBundle().getText("status1"));
							} else {
								this.getView().byId("objStatus").setState("Warning");
								this.getModel("modelView").setProperty("/versionStatus", this.getResourceBundle().getText("status0"));
							}
						}

					}.bind(this),
					error: function (oError) {
						this.showGeneralError({
							oDataError: oError
						});
						this.addMessage(new Message({
							message: this.getView().getModel("i18n").getResourceBundle().getText("ImportErrorSend"),
							description: oError.responseText,
							type: MessageType.Error
						}));
						this.getModel("modelView").setProperty("/busy", false);
					}.bind(this)
				});
		},
		getVersionStatus: function (oVersion) {
			var oModel = this.getView().getModel("ModelSimulador"),
				oFilter = [];

			oFilter.push(new Filter("Version", FilterOperator.EQ, oVersion.Version));
			oFilter.push(new Filter("Modulo", FilterOperator.EQ, oVersion.Modulo));

			oModel.read("/versionSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					var status = oData.results.length > 0 ? oData.results[0].Estado : "0";

					this.getModel("modelView").setProperty("/versionStatus", this.getResourceBundle().getText("status" + status));
					status = status === "1" ? "Success" : "Warning";

					if (this.getView().byId("objStatus") !== undefined) {
						this.getView().byId("objStatus").setState(status);
					}

				}.bind(this),
				error: function (oError) {
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
		}
	});

});