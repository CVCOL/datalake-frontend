sap.ui.define([
    "./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",	
	"sap/ui/core/message/Message",
    "sap/ui/core/date/UI5Date"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, Message, UI5Date) {
        "use strict";
        var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.uploadData", {
            onInit: function () {
                
                let date = new Date(),    
                oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "M/y"}),            
				month = (date.getMonth()),
				day = ("0" + date.getDate()).slice(-2),
				year = date.getFullYear();

                var oModel = new JSONModel({
                    busy: false,
                    title: this.getResourceBundle().getText("uploadsource"),
                    valueFilePeriod: oDateFormat.format(UI5Date.getInstance(year,month))
                });
                this.getOwnerComponent().setModel(oModel, "viewModel");
    
                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();
    
                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(oView, true);
    
            },
            onFileUpload: function(oEvent) {
                
                this.setViewBusy(true);

                var oFileUploader = oEvent.getSource();
                var file = oEvent.getParameter("files")[0];  
                var period = "";            
                var form = new FormData();
                
                if ( ( oFileUploader.getName() == "Derechoconexionunitario" || 
                       oFileUploader.getName() == "Derechoconexionunitario" ||
                       oFileUploader.getName() == "Derechoconexionunitario" ) 
                    && ( this.byId("FilePeriod").getValue() == "" ) ) {
                    this.byId("FilePeriod").setValueState("Error");
                    return;
                }else{ 
                    this.byId("FilePeriod").setValueState("None");            
                }
                
                if (this.byId("FilePeriod").getValue() != ""){
                    period = this.byId("FilePeriod").getValue();
                    let arr_period = period.split('/');
                    period = arr_period[0] + "/" + "01" + "/" + arr_period[1].substring(2);
                }

                form.append("file", file);
                form.append("idFile", oFileUploader.getName() );
                form.append("User", 'polarissrv' );
                form.append("FilePeriod", period );

                var oLoginModel = this.getLoginModel();
                var url = oLoginModel.endpoint_backend+"uploadfile";

                var settings = $.ajax({
                    context: this,
                    url: url,
                    async: false,
                    method: 'POST',
                    timeout: 0,
                    headers: { "Authorization": "Bearer "+oLoginModel.token },
                    processData: false,
                    contentType: false,
                    data: form,                       
                    success: function(result) {
                        this.setViewBusy(false);
                        var resultJson = {"message": result["Mensaje"], "severity": result["Tipo_Mensaje"] }
                        this.showResponseMessages(resultJson);
                    }.bind(this),
                    error: function(e) { 
                        this.setViewBusy(false);
                        this.showResponseMessages(e) 
                    }.bind(this)
                });
            }
        });
    
    });