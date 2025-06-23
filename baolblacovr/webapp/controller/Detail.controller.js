sap.ui.define(
  [
    "baolblacovr/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "baolblacovr/model/formatter",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    Device,
    Filter,
    Sorter,
    Fragment,
    exportLibrary,
    Spreadsheet,
    MessageBox,
  ) {
    "use strict";
    const EdmType = exportLibrary.EdmType;
    return BaseController.extend("baolblacovr.controller.Detail", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data

        const oViewModel = new JSONModel({
          busy: false,
          delay: 0,
        });
        // Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
        this._mViewSettingsDialogs = {};
        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);

        this.setModel(oViewModel, "detailView");

        this.getOwnerComponent().getModel().setSizeLimit(5000);

        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler when the share by E-Mail button has been clicked
       * @public
       */
      onShareEmailPress: function () {
        const oViewModel = this.getModel("detailView");

        // @ts-ignore
        sap.m.URLHelper.triggerEmail(
          null,
          oViewModel.getProperty("/shareSendEmailSubject"),
          oViewModel.getProperty("/shareSendEmailMessage"),
        );
      },

      /**
       * Event handler when the share in JAM button has been clicked
       * @public
       */
      onShareInJamPress: function () {
        const oViewModel = this.getModel("detailView"),
          oShareDialog = sap.ui.getCore().createComponent({
            name: "sap.collaboration.components.fiori.sharing.dialog",
            settings: {
              object: {
                id: location.href,
                share: oViewModel.getProperty("/shareOnJamTitle"),
              },
            },
          });

        // @ts-ignore
        oShareDialog.open();
      },

      onOpenItemsBeforeRebindTable: function (oEvent) {
        const binding = oEvent.getParameter("bindingParams");
        const oFilterContract = new sap.ui.model.Filter({
          path: "ContractID",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this.sObjectId,
        });
        binding.filters.push(oFilterContract);
        const oFilterAmount = new sap.ui.model.Filter({
          path: "Amount",
          operator: sap.ui.model.FilterOperator.GT,
          value1: "0",
        });
        binding.filters.push(oFilterAmount);
        //sort
        const oSorter = new sap.ui.model.Sorter("DueDate", false);
        binding.sorter.push(oSorter);
      },

      onListUpdateFinished: function () {
        // var sTitle,
        // 	iTotalItems = oEvent.getParameter("total"),
        // 	oViewModel = this.getModel("detailView");
        // // only update the counter if the length is final
        // if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
        // 	if (iTotalItems) {
        // 		sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
        // 	} else {
        // 		//Display 'Line Items' instead of 'Line items (0)'
        // 		sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
        // 	}
        // 	oViewModel.setProperty("/lineItemListTitle", sTitle);
        // }
      },

      /**
       * Event handler when a table item gets pressed
       * @param {sap.ui.base.Event} oEvent the table selectionChange event
       * @public
       */
      onPressTransaction: function (oEvent) {
        // The context of the row that got pressed
        // @ts-ignore
        const oContext = oEvent.getParameter("rowContext");
        if (oContext) {
          this._showTransactionRow(oContext);
          return;
        }
        // The source is the list item that got pressed
        this._showTransaction(oEvent.getSource());
      },
      onTransactionsExport: function () {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        //var oRowBinding = this.getView().getModel("Transactions").getProperty("/dataPlain");
        const oTable = this.byId("transactionsTable");
        const oRowBinding = oTable.getBinding("rows");
        const aCols = [];
        aCols.push({
          property: "PostingDate",
          label: oBundle.getText("bookingdate"),
          type: EdmType.Date,
          inputFormat: "yyyyMMdd",
        });
        aCols.push({
          property: "StatusTxt",
          label: oBundle.getText("status"),
          type: EdmType.String,
        });
        aCols.push({
          property: "ValueDate",
          label: oBundle.getText("valuedate"),
          type: EdmType.Date,
          inputFormat: "yyyyMMdd",
        });
        aCols.push({
          property: "CreationDateTime",
          label: oBundle.getText("CreationDateTime"),
          type: EdmType.DateTime,
        });
        aCols.push({
          property: "CreationUserID",
          label: oBundle.getText("CreationUserID"),
          type: EdmType.String,
        });
        aCols.push({
          property: "TransactionType",
          label: oBundle.getText("transactiontype"),
          type: EdmType.String,
        });
        aCols.push({
          property: ["TransactionTypeTxt", "PaymentNotes"],
          label: oBundle.getText("transactiontypenotes"),
          type: EdmType.String,
          template: "{0} / {1}",
        });
        aCols.push({
          property: ["PaymentTransactionOrderID", "PrenoteReferenceID"],
          label: oBundle.getText("PaymentOrderOrPrenote"),
          type: EdmType.String,
          template: "{0} / {1}",
        });
        aCols.push({
          property: [
            "CounterPartyBankAccountID",
            "CounterPartyBankAccountHolder",
          ],
          label: oBundle.getText("Counterparty"),
          type: EdmType.String,
          template: "{0} / {1}",
        });
        aCols.push({
          property: "AccountCurrencyAmount",
          label: oBundle.getText("amount"),
          type: EdmType.Number,
          scale: 2,
          delimiter: true,
          unitProperty: "TransactionCurrency",
        });
        const oSettings = {
          workbook: {
            columns: aCols,
            //hierarchyLevel: 'Category',
            context: {
              application: oBundle.getText("appTitle"),
              title: oBundle.getText("transactions"),
              sheetName: oBundle.getText("transactions"),
            },
          },
          dataSource: oRowBinding,
          fileName: "Transactions.xlsx",
        };

        const oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },

      onPressPrenote: function (oEvent) {
        // The source is the list item that got pressed
        this._showPrenote(oEvent.getSource());
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Shows the selected row on the table
       * @param {sap.ui.model.Context} oContext Selected row context
       * @private
       * https://sapui5.netweaver.ondemand.com/docs/guide/2366345a94f64ec1a80f9d9ce50a59ef.html
       */
      _showTransactionRow: function (oContext) {
        this.getRouter().navTo("transaction", {
          idkey: oContext.getPath().substr(1),
        });
      },

      /**
       * Shows the selected item on the object page
       * On phones a additional history entry is created
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       * https://sapui5.netweaver.ondemand.com/docs/guide/2366345a94f64ec1a80f9d9ce50a59ef.html
       */
      _showTransaction: function (oItem) {
        //sap.m.MessageToast.show(oItem.getBindingContext().getPath().substr(1));
        this.getRouter().navTo("transaction", {
          idkey: oItem.getBindingContext().getPath().substr(1),
        });
      },

      _showPrenote: function (oItem) {
        //sap.m.MessageToast.show(oItem.getBindingContext().getPath().substr(1));
        this.getRouter().navTo("prenote", {
          idkeypn: oItem.getBindingContext().getPath().substr(1),
        });
      },

      /**
       * Binds the view to the object path and expands the aggregated line items.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        // @ts-ignore
        const sObjectId = oEvent.getParameter("arguments").objectId;
        this.sObjectId = sObjectId;

        const sPath = "/ContractSet('" + sObjectId + "')";
        this.getModel().read(sPath, {
          success: (oData) => {
            const oJsonModel = new sap.ui.model.json.JSONModel(oData);
            this.getView().setModel(oJsonModel, "ContractDetails");
          },
          error: (oError) => {
            console.error(oError);
          },
        });

        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              const sObjectPath = this.getModel().createKey("ContractSet", {
                ID: sObjectId,
              });
              this._bindView("/" + sObjectPath);
            }.bind(this),
          );
        // set the transaction tab bar as default
        if (this.getView().byId("iconTabBar")) {
          this.getView().byId("iconTabBar").setSelectedKey("Transaction");
          // make the filter & sorter button appeared for tab transactions.
          this.getView().byId("idSortBT").setVisible(false); //.setVisible(true);
          this.getView().byId("idFilterBT").setVisible(false); //.setVisible(true);
        }
      },

      /**
       * Binds the view to the object path. Makes sure that detail view displays
       * a busy indicator while data for the corresponding element binding is loaded.
       * @function
       * @param {string} sObjectPath path to the object to be bound to the view.
       * @private
       */
      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        const oViewModel = this.getModel("detailView");

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oViewModel.setProperty("/busy", false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      _onBindingChange: function () {
        const oView = this.getView(),
          oElementBinding = oView.getElementBinding();
        // clear filter
        const oTable = this.byId("lineItemsListTransactions");
        if (oTable) {
          const oBinding = oTable.getBinding("items");
          oBinding.filter([]);
        }
        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("detailObjectNotFound");
          // if object could not be found, the selection in the master list
          // does not make sense anymore.
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }

        const sPath = oElementBinding.getPath(),
          oResourceBundle = this.getResourceBundle(),
          oObject = oView.getModel().getObject(sPath),
          sObjectId = oObject.ID,
          sObjectName = oObject.Party,
          oViewModel = this.getModel("detailView");

        this.getOwnerComponent().oListSelector.selectAListItem(sPath);

        oViewModel.setProperty(
          "/saveAsTileTitle",
          oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]),
        );
        oViewModel.setProperty("/shareOnJamTitle", sObjectName);
        oViewModel.setProperty(
          "/shareSendEmailSubject",
          oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]),
        );
        oViewModel.setProperty(
          "/shareSendEmailMessage",
          oResourceBundle.getText("shareSendEmailObjectMessage", [
            sObjectName,
            sObjectId,
            location.href,
          ]),
        );
      },

      _onMetadataLoaded: function () {
        // Store original busy indicator delay for the detail view
        const iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
          oViewModel = this.getModel("detailView"),
          oLineItemTable = this.byId("transactionsTable"),
          iOriginalLineItemTableBusyDelay =
            oLineItemTable.getBusyIndicatorDelay();

        // Make sure busy indicator is displayed immediately when
        // detail view is displayed for the first time
        oViewModel.setProperty("/delay", 0);
        oViewModel.setProperty("/lineItemTableDelay", 0);

        oLineItemTable.attachEventOnce("updateFinished", function () {
          // Restore original busy indicator delay for line item table
          oViewModel.setProperty(
            "/lineItemTableDelay",
            iOriginalLineItemTableBusyDelay,
          );
        });

        // Binding the view will set it to not busy - so the view is always busy if it is not bound
        oViewModel.setProperty("/busy", true);
        // Restore original busy indicator delay for the detail view
        oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
      },

      handelTabBarSelect: function (oEvent) {
        const selectedKey = oEvent.getParameters().selectedKey;
        let propertyName;
        switch (selectedKey) {
          case "OpenItems":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            //gets table
            // eslint-disable-next-line no-case-declarations
            const table = this.getView().byId("smartTableOpenItems");
            //refreshes table
            table.rebindTable();
            break;
          case "Balences":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "Balances";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
                this.getView()
                  .getModel(propertyName)
                  .getProperty("/objectId") !== this.sObjectId
              ) {
                this._loadModel(propertyName);
              }
            }
            break;
          case "PaymentPlan":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "PaymentPlan";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
                this.getView()
                  .getModel(propertyName)
                  .getProperty("/objectId") !== this.sObjectId
              ) {
                this._loadModel(propertyName);
              }
            }
            break;
          case "PaymentParty":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "PaymentParty";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
                this.getView()
                  .getModel(propertyName)
                  .getProperty("/objectId") !== this.sObjectId
              ) {
                this._loadModel(propertyName);
              }
            }
            break;

          case "Conditions":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "Conditions";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
                this.getView()
                  .getModel(propertyName)
                  .getProperty("/objectId") !== this.sObjectId
              ) {
                this._loadModel(propertyName);
              }
            }
            break;
          case "OtherPartys":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "OtherPartys";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
                this.getView()
                  .getModel(propertyName)
                  .getProperty("/objectId") !== this.sObjectId
              ) {
                this._loadModel(propertyName);
              }
            }
            break;
          /*case "Dispersion":
          // make the filter & sorter button disappeared.
          this.getView().byId("idSortBT").setVisible(false);
          this.getView().byId("idFilterBT").setVisible(false);
          propertyName = "Vendors";
          if (this.getView().getModel(propertyName) === undefined) {
            this._loadModel(propertyName);
          } else {
            if (
            this.getView()
              .getModel(propertyName)
              .getProperty("/objectId") !== this.sObjectId
            ) {
            this._loadModel(propertyName);
            }
          }
          break;
          case "Collaterals":
            // make the filter & sorter button disappeared.
            this.getView().byId("idSortBT").setVisible(false);
            this.getView().byId("idFilterBT").setVisible(false);
            propertyName = "Collaterals";
            if (this.getView().getModel(propertyName) === undefined) {
              this._loadModel(propertyName);
            } else {
              if (
              this.getView()
                .getModel(propertyName)
                .getProperty("/objectId") !== this.sObjectId
              ) {
              this._loadModel(propertyName);
              }
            }
            break;*/
          default:
            // make the filter & sorter button appeared for tab transactions.
            this.getView().byId("idSortBT").setVisible(false); //.setVisible(true);
            this.getView().byId("idFilterBT").setVisible(false); //.setVisible(true);
        }
      },
      _loadModel: function (propertyName) {
        this.getModel("detailView").setProperty("/busy", true);
        const oModel = this.getOwnerComponent().getModel();
        oModel.setSizeLimit(5000);
        const that = this;
        const sPath =
          "/" +
          this.getModel().createKey("ContractSet", {
            ID: this.sObjectId,
          }) +
          "/" +
          propertyName;
        //checks for sorting
        const sorters = [];
        switch (propertyName) {
          case "OpenItems":
            sorters.push(new sap.ui.model.Sorter("DueDate", false));
            break;
        }
        oModel.read(sPath, {
          sorters: sorters,
          success: function (oData) {
            let oDataModel = new JSONModel({
              objectId: that.sObjectId,
              data: oData.results,
            });
            oDataModel.setSizeLimit(5000);
            if (propertyName === "PaymentPlan") {
              const oGroups = that._groupPaymentPlan(oData.results);
              oDataModel = new JSONModel({
                objectId: oDataModel.sObjectId,
                data: {
                  Items: oGroups,
                },
                dataPlain: oData.results,
              });
            }
            that.getView().setModel(oDataModel, propertyName);
            that.getModel("detailView").setProperty("/busy", false);
          },
          error: function () {
            that.getModel("detailView").setProperty("/busy", false);
          },
        });
      },
      _groupPaymentPlan: function (oResults) {
        const oGroups = [];
        for (let index = 0; index < oResults.length; index++) {
          const oResult = oResults[index];
          let oHeader = oGroups.find((h) => h.Date === oResult.Date);
          if (!oHeader) {
            oHeader = {
              Date: oResult.Date,
              Items: [],
            };
            oGroups.push(oHeader);
          }
          if (oResult.Category === "1") {
            oHeader.ContractID = oResult.ContractID;
            oHeader.ItemID = oResult.ItemID;
            oHeader.Category = oResult.Category;
            oHeader.CategoryTxt = oResult.CategoryTxt;
            oHeader.Amount = oResult.Amount;
            oHeader.Currency = oResult.Currency;
            oHeader.RemainingDebitAmount = oResult.RemainingDebitAmount;
            continue;
          }
          const oItem = {
            ContractID: oResult.ContractID,
            ItemID: oResult.ItemID,
            Date: oResult.Date,
            Category: oResult.Category,
            CategoryTxt: oResult.CategoryTxt,
            Amount: oResult.Amount,
            Currency: oResult.Currency,
            RemainingDebitAmount: oResult.RemainingDebitAmount,
          };
          oHeader.Items.push(oItem);
        }
        return oGroups;
      },
      onPaymentPlanCollapseAll: function () {
        const oTreeTable = this.byId("paymentPlanTree");
        oTreeTable.collapseAll();
      },
      onPaymentPlanExpandAll: function () {
        const oTreeTable = this.byId("paymentPlanTree");
        oTreeTable.expandToLevel(3);
      },
      onPaymentPlanExport: function () {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const oRowBinding = this.getView()
          .getModel("PaymentPlan")
          .getProperty("/dataPlain");
        const aCols = [];
        aCols.push({
          property: "Date",
          label: oBundle.getText("date"),
          type: EdmType.Date,
          inputFormat: "yyyyMMdd",
        });
        aCols.push({
          property: "CategoryTxt",
          label: oBundle.getText("categoryTxt"),
          type: EdmType.String,
        });
        aCols.push({
          property: "Amount",
          label: oBundle.getText("amount"),
          type: EdmType.Number,
          scale: 2,
          delimiter: true,
          unitProperty: "Currency",
        });
        aCols.push({
          property: "RemainingDebitAmount",
          label: oBundle.getText("remainingDebitAmount"),
          type: EdmType.Number,
          scale: 2,
          delimiter: true,
          unitProperty: "Currency",
        });
        const oSettings = {
          workbook: {
            columns: aCols,
            hierarchyLevel: "Category",
            context: {
              application: oBundle.getText("appTitle"),
              title: oBundle.getText("PaymentPlan"),
              sheetName: oBundle.getText("PaymentPlan"),
            },
          },
          dataSource: oRowBinding,
          fileName: "PaymentPlan.xlsx",
        };

        const oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },
      handleSortButtonPressed: function () {
        //this.createViewSettingsDialog("baolblacovr.view.SortDialog").open();
        const oDialog = this.createViewSettingsDialog(
          "baolblacovr.view.SortDialog",
        );
        const i18nModel = this.getView().getModel("i18n");
        oDialog.setModel(i18nModel, "i18n");
        oDialog.open();
      },

      handleFilterButtonPressed: function () {
        //this.createViewSettingsDialog("baolblacovr.view.FilterDialog").open();
        const oDialog = this.createViewSettingsDialog(
          "baolblacovr.view.FilterDialog",
        );
        const i18nModel = this.getView().getModel("i18n");
        oDialog.setModel(i18nModel, "i18n");
        oDialog.open();
      },
      createViewSettingsDialog: function (sDialogFragmentName) {
        let oDialog = this._mViewSettingsDialogs[sDialogFragmentName];

        if (!oDialog) {
          let dialogId;
          if (sDialogFragmentName === "baolblacovr.view.SortDialog") {
            dialogId = "idSortDialog";
          } else {
            dialogId = "idFilterDialog";
          }
          oDialog = sap.ui.xmlfragment(dialogId, sDialogFragmentName, this);
          this._mViewSettingsDialogs[sDialogFragmentName] = oDialog;

          if (Device.system.desktop) {
            oDialog.addStyleClass("sapUiSizeCompact");
          }
        }
        return oDialog;
      },
      handleSortDialogConfirm: function (oEvent) {
        const oTable = this.byId("transactionsTable");
        const mParams = oEvent.getParameters();

        const oBinding = oTable.getBinding("rows");
        const aSorters = [];

        const sPath = mParams.sortItem.getKey();
        const bDescending = mParams.sortDescending;
        aSorters.push(new Sorter(sPath, bDescending));

        // apply the selected sort and group settings
        oBinding.sort(aSorters);
      },

      // @ts-ignore
      handleFilterDialogConfirm: function () {
        //var oTable = this.byId("lineItemsListTransactions"),
        const oTable = this.byId("transactionsTable"),
          // mParams = oEvent.getParameters(),
          //oBinding = oTable.getBinding("items"),
          oBinding = oTable.getBinding("rows"),
          aFilters = [];
        const sPathAmount = "AccountCurrencyAmount";
        const morethanAmount = Fragment.byId(
            "idFilterDialog",
            "idMorethanAmount",
          ).getValue(),
          lessThanAmount = Fragment.byId(
            "idFilterDialog",
            "idLessThanAmount",
          ).getValue(),
          BTLessAmount = Fragment.byId("idFilterDialog", "idBTLess").getValue(),
          BTBigAmount = Fragment.byId("idFilterDialog", "idBTBig").getValue(),
          postingDate = Fragment.byId(
            "idFilterDialog",
            "DPstartDate",
          ).getValue(),
          paymentNote = Fragment.byId(
            "idFilterDialog",
            "idPaymentNote",
          ).getValue();
        let oFilter;
        if (morethanAmount) {
          oFilter = new Filter(sPathAmount, "GT", morethanAmount);
          aFilters.push(oFilter);
        } else {
          if (lessThanAmount) {
            oFilter = new Filter(sPathAmount, "LE", lessThanAmount);
            aFilters.push(oFilter);
          } else {
            if (BTLessAmount & BTBigAmount) {
              oFilter = new Filter(
                sPathAmount,
                "BT",
                BTLessAmount,
                BTBigAmount,
              );
              aFilters.push(oFilter);
            }
          }
        }
        if (postingDate) {
          const sPath = "PostingDate";
          oFilter = new Filter(sPath, "GE", postingDate);
          aFilters.push(oFilter);
        }
        if (paymentNote) {
          const sPathPaymentNote = "PaymentNotes";
          oFilter = new Filter(sPathPaymentNote, "Contains", paymentNote);
          aFilters.push(oFilter);
        }
        oBinding.filter(aFilters);
      },
      // @ts-ignore
      handleFilterInputChange: function () {
        const oCustomFilter =
          this._mViewSettingsDialogs[
            "baolblacovr.view.FilterDialog"
          ].getFilterItems()[0];
        // Set the custom filter's count and selected properties
        // oCustomFilter.setFilterCount(1);
        oCustomFilter.setSelected(true);
      },
      // @ts-ignore
      handleFilterDialogReset: function () {
        Fragment.byId("idFilterDialog", "idMorethanAmount").setValue("");
        Fragment.byId("idFilterDialog", "idLessThanAmount").setValue("");
        Fragment.byId("idFilterDialog", "idBTLess").setValue("");
        Fragment.byId("idFilterDialog", "idBTBig").setValue("");
        Fragment.byId("idFilterDialog", "DPstartDate").setValue("");
        Fragment.byId("idFilterDialog", "idPaymentNote").setValue("");
      },
      // @ts-ignore
      nav2DirectPaymentApp: function () {
        const navigate = false;
        if (
          sap.ushell &&
          // @ts-ignore
          sap.ushell.Container &&
          // @ts-ignore
          sap.ushell.Container.getService
        ) {
          // @ts-ignore
          const oCrossAppNavigator = sap.ushell.Container.getService(
            "CrossApplicationNavigation",
          ); // get a handle on the global XAppNav service
          const hash =
            (oCrossAppNavigator &&
              oCrossAppNavigator.hrefForExternal({
                target: {
                  semanticObject: "ElectivePayment",
                  action: "manage",
                },
                params: {
                  objectId: this.sObjectId,
                },
              })) ||
            "";
          if (navigate) {
            oCrossAppNavigator.toExternal({
              target: {
                shellHash: hash,
              },
            });
          }
        }
      },
      // @ts-ignore
      nav2ConditionChangeApp: function () {
        const navigate = false;
        if (
          sap.ushell &&
          // @ts-ignore
          sap.ushell.Container &&
          // @ts-ignore
          sap.ushell.Container.getService
        ) {
          // @ts-ignore
          const oCrossAppNavigator = sap.ushell.Container.getService(
            "CrossApplicationNavigation",
          ); // get a handle on the global XAppNav service
          const hash =
            (oCrossAppNavigator &&
              oCrossAppNavigator.hrefForExternal({
                target: {
                  semanticObject: "LoanConditions",
                  action: "Change",
                },
                params: {
                  objectId: this.sObjectId,
                },
              })) ||
            "";
          if (navigate) {
            oCrossAppNavigator.toExternal({
              target: {
                shellHash: hash,
              },
            });
          }
        }
      },

      // @ts-ignore
      nav2MasterContractApp: function () {
        if (
          sap.ushell &&
          // @ts-ignore
          sap.ushell.Container &&
          // @ts-ignore
          sap.ushell.Container.getService
        ) {
          // @ts-ignore
          const oCrossAppNavigator = sap.ushell.Container.getService(
            "CrossApplicationNavigation",
          ); // get a handle on the global XAppNav service
          let hash =
            (oCrossAppNavigator &&
              oCrossAppNavigator.hrefForExternal({
                target: {
                  //semanticObject: "MasterContract",
                  //action: "Display"
                  // ZBAOLBLACMAC_O-display
                  semanticObject: "ZBAOLBLACMAC_O",
                  action: "display",
                },
              })) ||
            "";
          const masterContractId = this.getView()
            .byId("MasterContractId")
            .getText();
          const customerNumber = this.getView()
            .byId("AccountHolderID")
            .getText();
          hash =
            hash +
            "&" +
            "/view/" +
            customerNumber.padStart(10, "0") +
            "/" +
            masterContractId;
          oCrossAppNavigator.toExternal({
            target: {
              shellHash: hash,
            },
          });
        }
      },

      onSearch: function () {
        const aFilters = [];
        let validFrom = "19000101";
        let validTo = "99991231";

        this.getView()
          .byId("filterbar")
          .getFilterGroupItems()
          // @ts-ignore
          .reduce(function (aFilters, oFilterGroupItem) {
            const filterName = oFilterGroupItem.getName();
            const filterValue = oFilterGroupItem.getControl().getValue();
            if (filterValue !== "") {
              switch (filterName) {
                case "ValidFrom":
                  validFrom = filterValue;
                  break;
                case "ValidTo":
                  validTo = filterValue;
                  break;
              }
            }
          }, []);

        if (validFrom > validTo) {
          MessageBox.warning(
            this.getResourceBundle().getText("PostingDateValidationMsg"),
          );
          return;
        }

        const sPathPaymentNote = "PostingDate";
        const oFilter = new Filter(sPathPaymentNote, "BT", validFrom, validTo);
        aFilters.push(oFilter);

        const oTable = this.byId("transactionsTable");
        if (oTable) {
          const oRowBinding = oTable.getBinding("rows");
          oRowBinding.filter(aFilters);
        }
      },
    });
  },
);
