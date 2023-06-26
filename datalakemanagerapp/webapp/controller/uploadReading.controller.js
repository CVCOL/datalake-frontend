sap.ui.define([
    "./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",	
	"sap/ui/core/message/Message"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Message) {
        "use strict";
        var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.uploadReading", {
            onInit: function () {

                var oModelV = new JSONModel({
                    busy: false,
                    title: "",
                    versionStatus: this.getResourceBundle().getText("status0")
                });
                this.setModel(oModelV, "modelView");
    
                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();
    
                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(oView, true);
    
            },
            onFileUpload: function(oEvent) {
                var oFileUploader = oEvent.getSource();
                var file = oEvent.getParameter("files")[0];
                var token = "";			
                var baseurl = "https://dkpolaris.eastus.azurecontainer.io/"; 
                var form = new FormData();
          
                form.append("file", file);
                form.append("idFile", oFileUploader.getName() );
                form.append("User", 'polarissrv' );
                form.append("FilePeriod", this.byId("FilePeriod").getValue() );
                    
                baseurl = "http://localhost:8002/";  
                            
                token = this.getToke(baseurl);			
                
                var settings = {
                                "url": baseurl+"uploadfile",
                                "method": "POST",
                                "timeout": 0,
                                "headers": {								
                                    "Authorization": "Bearer "+token
                                },
                                "processData": false,
                                "contentType": false,
                                "data": form,
                                success: function(result) { },
                                error: function(e) { console.log(e.message); }
                                };
        
                $.ajax(settings);
    
            },
    
            getToke: function(baseurl) {
                
                var url = baseurl + 'token';			
                
                var token = $.ajax({
                    url: url,
                    async: false,
                    method: 'POST',
                    timeout: 0,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: {
                        "grant_type": "password",
                        "username": "polarissrv",
                        "password": "23Haina*Pol+"
                    },
                    success: function(result) { },
                    error: function(e) { console.log(e.message); }
                });						
                
                return token.responseJSON.access_token;
            }
        });
    
    });