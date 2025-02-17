sap.ui.define([
	"sap/ui/core/format/NumberFormat"
	], function(NumberFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		formatDate: function(oDate) {
			if (oDate && oDate !== "00000000") {
				var oYear = oDate.substring(0, 4);
				if (oYear === "9999") {
					oYear = "9998";
				}
				var oMonth = oDate.substring(4, 6) - 1;
				var oDay = oDate.substring(6, 8);
				var oDate1 = new Date(oYear, oMonth, oDay);
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy",
				});
				return dateFormat.format(oDate1);
			} else if (oDate === "00000000") {
				return null;
			} else {
				return oDate;
			}
		},
		formatDateObject: function(oDate) {
			if (oDate) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy",
				});
				return dateFormat.format(oDate, true);
			}
			return oDate;
		},
		concatenatNotes: function(oObject) {
			if (oObject) {
				var oConcatenatedTx;
				var i;
				for (i = 0; i < oObject.length; i++) {
					oConcatenatedTx += oObject[i] + " ";
				}
				return oConcatenatedTx;
			} else {
				return "";
			}
		},
		formatStatus: function(oStatus) {
			if (oStatus) {
				if (oStatus === "3") {
					return "Error";
				} else {
					if (oStatus === "2") {
						return "Warning";
					} else {
						if (oStatus === "1") {
							return "Success";
						}
					}
				}
			}
			return "None";
		},
		formatPeriod: function(sPeriod) {
			if (!sPeriod || !sPeriod.substring(0, 1) === "P") return sPeriod;
			var sFactor = sPeriod.substring(1, sPeriod.length - 1),
				sUnit = sPeriod.substring(sPeriod.length - 1),
				oUnits = {
					D: "Days",
					W: "Weeks",
					M: "Months",
					Y: "Years",
				},
				sTextKey = oUnits[sUnit],
				oBundle = sap.ui.getCore().getModel("i18n");
			if (!sTextKey) {
				return sPeriod;
			}
			var sText = oBundle.getText(sTextKey);
			return `${sFactor} ${sText}`;
		},
		sumValues: function(val1, val2, val3, currency) {
			var total = (parseFloat(val1) + parseFloat(val2) + parseFloat(val3)).toFixed(2);
			var oCurrencyFormat = NumberFormat.getCurrencyInstance();
			return oCurrencyFormat.format(total, currency);
		}

	};
});