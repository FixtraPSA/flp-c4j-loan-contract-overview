/*global location */
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
		"sap/m/MessageBox"
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
		MessageBox
	) {
		"use strict";
		var EdmType = exportLibrary.EdmType;
		return BaseController.extend("baolblacovr.controller.Detail", {
			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit: function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data

				var oViewModel = new JSONModel({
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
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},

			/**
			 * Event handler when the share in JAM button has been clicked
			 * @public
			 */
			onShareInJamPress: function () {
				var oViewModel = this.getModel("detailView"),
					oShareDialog = sap.ui.getCore().createComponent({
						name: "sap.collaboration.components.fiori.sharing.dialog",
						settings: {
							object: {
								id: location.href,
								share: oViewModel.getProperty("/shareOnJamTitle"),
							},
						},
					});

				oShareDialog.open();
			},

			onOpenItemsBeforeRebindTable: function (oEvent) {
				var binding = oEvent.getParameter("bindingParams");
				var oFilterContract = new sap.ui.model.Filter({
					path: "ContractID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: this.sObjectId,
				});
				binding.filters.push(oFilterContract);
				var oFilterAmount = new sap.ui.model.Filter({
					path: "Amount",
					operator: sap.ui.model.FilterOperator.GT,
					value1: "0",
				});
				binding.filters.push(oFilterAmount);
				//sort
				let oSorter = new sap.ui.model.Sorter("DueDate", false);
				binding.sorter.push(oSorter);
			},

			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished: function (oEvent) {
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
				var oContext = oEvent.getParameter("rowContext");
				if (oContext) {
					this._showTransactionRow(oContext);
					return;
				}
				// The source is the list item that got pressed
				this._showTransaction(oEvent.getSource());
			},
			onTransactionsExport: function () {
				var oBundle = this.getView().getModel("i18n").getResourceBundle();
				//var oRowBinding = this.getView().getModel("Transactions").getProperty("/dataPlain");
				var oTable = this.byId("transactionsTable");
				var oRowBinding = oTable.getBinding("rows");
				var aCols = [];
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
				var oSettings = {
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

				var oSheet = new Spreadsheet(oSettings);
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
				var sObjectId = oEvent.getParameter("arguments").objectId;
				this.sObjectId = sObjectId;

				const sPath = "/ContractSet('" + sObjectId + "')";
				this.getModel().read(sPath, {
					success: (oData) => {
						const oJsonModel = new sap.ui.model.json.JSONModel(oData);
						this.getView().setModel(oJsonModel, "ContractDetails");
					},
					error: (oError) => {
						console.error(oError);
					}
				});

				this.getModel()
					.metadataLoaded()
					.then(
						function () {
							var sObjectPath = this.getModel().createKey("ContractSet", {
								ID: sObjectId,
							});
							this._bindView("/" + sObjectPath);
						}.bind(this)
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
				var oViewModel = this.getModel("detailView");

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
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();
				// clear filter
				var oTable = this.byId("lineItemsListTransactions");
				if (oTable) {
					var oBinding = oTable.getBinding("items");
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

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.ID,
					sObjectName = oObject.Party,
					oViewModel = this.getModel("detailView");


				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty(
					"/saveAsTileTitle",
					oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName])
				);
				oViewModel.setProperty("/shareOnJamTitle", sObjectName);
				oViewModel.setProperty(
					"/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
				);
				oViewModel.setProperty(
					"/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [
						sObjectName,
						sObjectId,
						location.href,
					])
				);


			},

			_onMetadataLoaded: function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
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
						iOriginalLineItemTableBusyDelay
					);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			},
			
			handelTabBarSelect: function (oEvent) {
				var selectedKey = oEvent.getParameters().selectedKey;
				var propertyName;
				switch (selectedKey) {
					case "OpenItems":
						// make the filter & sorter button disappeared.
						this.getView().byId("idSortBT").setVisible(false);
						this.getView().byId("idFilterBT").setVisible(false);
						//gets table
						let table = this.getView().byId("smartTableOpenItems");
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
				var oModel = this.getOwnerComponent().getModel();
				oModel.setSizeLimit(5000);
				var that = this;
				var sPath =
					"/" +
					this.getModel().createKey("ContractSet", {
						ID: this.sObjectId,
					}) +
					"/" +
					propertyName;
				//checks for sorting
				let sorters = [];
				switch (propertyName) {
					case "OpenItems":
						sorters.push(new sap.ui.model.Sorter("DueDate", false));
						break;
				}
				oModel.read(sPath, {
					sorters: sorters,
					success: function (oData) {
						var oDataModel = new JSONModel({
							objectId: that.sObjectId,
							data: oData.results,
						});
						oDataModel.setSizeLimit(5000);
						if (propertyName === "PaymentPlan") {
							var oGroups = that._groupPaymentPlan(oData.results);
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
					let oItem = {
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
				var oTreeTable = this.byId("paymentPlanTree");
				oTreeTable.collapseAll();
			},
			onPaymentPlanExpandAll: function () {
				var oTreeTable = this.byId("paymentPlanTree");
				oTreeTable.expandToLevel(3);
			},
			onPaymentPlanExport: function () {
				var oBundle = this.getView().getModel("i18n").getResourceBundle();
				var oRowBinding = this.getView()
					.getModel("PaymentPlan")
					.getProperty("/dataPlain");
				var aCols = [];
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
				var oSettings = {
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

				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function () {
					oSheet.destroy();
				});
			},
			handleSortButtonPressed: function () {
				//this.createViewSettingsDialog("baolblacovr.view.SortDialog").open();
				var oDialog = this.createViewSettingsDialog(
					"baolblacovr.view.SortDialog"
				);
				var i18nModel = this.getView().getModel("i18n");
				oDialog.setModel(i18nModel, "i18n");
				oDialog.open();
			},

			handleFilterButtonPressed: function () {
				//this.createViewSettingsDialog("baolblacovr.view.FilterDialog").open();
				var oDialog = this.createViewSettingsDialog(
					"baolblacovr.view.FilterDialog"
				);
				var i18nModel = this.getView().getModel("i18n");
				oDialog.setModel(i18nModel, "i18n");
				oDialog.open();
			},
			createViewSettingsDialog: function (sDialogFragmentName) {
				var oDialog = this._mViewSettingsDialogs[sDialogFragmentName];

				if (!oDialog) {
					var dialogId;
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
				//var oTable = this.byId("lineItemsListTransactions"),
				var oTable = this.byId("transactionsTable"),
					mParams = oEvent.getParameters(),
					//oBinding = oTable.getBinding("items"),
					oBinding = oTable.getBinding("rows"),
					sPath,
					bDescending,
					aSorters = [];

				sPath = mParams.sortItem.getKey();
				bDescending = mParams.sortDescending;
				aSorters.push(new Sorter(sPath, bDescending));

				// apply the selected sort and group settings
				oBinding.sort(aSorters);
			},

			handleFilterDialogConfirm: function (oEvent) {
				//var oTable = this.byId("lineItemsListTransactions"),
				var oTable = this.byId("transactionsTable"),
					// mParams = oEvent.getParameters(),
					//oBinding = oTable.getBinding("items"),
					oBinding = oTable.getBinding("rows"),
					aFilters = [];
				var sPathAmount = "AccountCurrencyAmount";
				var morethanAmount = Fragment.byId(
					"idFilterDialog",
					"idMorethanAmount"
				).getValue(),
					lessThanAmount = Fragment.byId(
						"idFilterDialog",
						"idLessThanAmount"
					).getValue(),
					BTLessAmount = Fragment.byId("idFilterDialog", "idBTLess").getValue(),
					BTBigAmount = Fragment.byId("idFilterDialog", "idBTBig").getValue(),
					postingDate = Fragment.byId(
						"idFilterDialog",
						"DPstartDate"
					).getValue(),
					paymentNote = Fragment.byId(
						"idFilterDialog",
						"idPaymentNote"
					).getValue(),
					oFilter;
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
								BTBigAmount
							);
							aFilters.push(oFilter);
						}
					}
				}
				if (postingDate) {
					var sPath = "PostingDate";
					oFilter = new Filter(sPath, "GE", postingDate);
					aFilters.push(oFilter);
				}
				if (paymentNote) {
					var sPathPaymentNote = "PaymentNotes";
					oFilter = new Filter(sPathPaymentNote, "Contains", paymentNote);
					aFilters.push(oFilter);
				}
				oBinding.filter(aFilters);
			},
			handleFilterInputChange: function (oEvent) {
				var oCustomFilter =
					this._mViewSettingsDialogs[
						"baolblacovr.view.FilterDialog"
					].getFilterItems()[0];
				// Set the custom filter's count and selected properties
				// oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			},
			handleFilterDialogReset: function (oEvent) {
				Fragment.byId("idFilterDialog", "idMorethanAmount").setValue("");
				Fragment.byId("idFilterDialog", "idLessThanAmount").setValue("");
				Fragment.byId("idFilterDialog", "idBTLess").setValue("");
				Fragment.byId("idFilterDialog", "idBTBig").setValue("");
				Fragment.byId("idFilterDialog", "DPstartDate").setValue("");
				Fragment.byId("idFilterDialog", "idPaymentNote").setValue("");
			},
			nav2DirectPaymentApp: function (oEvent) {
				const navigate = false;
				if (
					sap.ushell &&
					sap.ushell.Container &&
					sap.ushell.Container.getService
				) {
					var oCrossAppNavigator = sap.ushell.Container.getService(
						"CrossApplicationNavigation"
					); // get a handle on the global XAppNav service
					var hash =
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
			nav2ConditionChangeApp: function (oEvent) {
				const navigate = false;
				if (
					sap.ushell &&
					sap.ushell.Container &&
					sap.ushell.Container.getService
				) {
					var oCrossAppNavigator = sap.ushell.Container.getService(
						"CrossApplicationNavigation"
					); // get a handle on the global XAppNav service
					var hash =
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

			nav2MasterContractApp: function (oEvent) {
				if (
					sap.ushell &&
					sap.ushell.Container &&
					sap.ushell.Container.getService
				) {
					var oCrossAppNavigator = sap.ushell.Container.getService(
						"CrossApplicationNavigation"
					); // get a handle on the global XAppNav service
					var hash =
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
					var masterContractId = this.getView()
						.byId("MasterContractId")
						.getText();
					var customerNumber = this.getView().byId("AccountHolderID").getText();
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
				var aFilters = [];
				var validFrom = "19000101";
				var validTo = "99991231"

				this.getView().byId("filterbar").getFilterGroupItems().reduce(function (aFilters, oFilterGroupItem) {
					var filterName = oFilterGroupItem.getName();
					var filterValue = oFilterGroupItem.getControl().getValue();
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

				if(validFrom > validTo){
					MessageBox.warning(this.getResourceBundle().getText("PostingDateValidationMsg"));
					return;
				}

				var sPathPaymentNote = "PostingDate";
				var oFilter = new Filter(sPathPaymentNote, "BT", validFrom, validTo);
				aFilters.push(oFilter);

				var oTable = this.byId("transactionsTable");
				if (oTable) {
					var oRowBinding = oTable.getBinding("rows");
					oRowBinding.filter(aFilters);
				}

			}
		});
	}
);
