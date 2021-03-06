(function (module) {
    mifosX.controllers = _.extend(module, {
        CreateInterestRateChartController: function (scope, resourceFactory, location, routeParams, dateFilter,$modal) {
            scope.formData = {};//used for update/save form data
            scope.restrictDate = new Date();
            scope.fromDate = {}; //required for date formatting
            scope.endDate = {};//required for date formatting

            //deposit product details
            scope.productName = routeParams.productName;
            scope.productId = routeParams.productId;

            scope.productsLink = '';
            scope.viewProductLink = '';
            scope.productType = routeParams.productType;
            //alert(scope.productType);
            if (routeParams.productType === 'fixeddepositproduct') {
                scope.productsLink = 'fixeddepositproducts';
                scope.viewProductLink = 'viewfixeddepositproduct';
            } else if (routeParams.productType === 'recurringdepositproduct') {
                scope.productsLink = 'recurringdepositproducts';
                scope.viewProductLink = 'viewrecurringdepositproduct';
            }

            //get a interestrate chart
            resourceFactory.interestRateChartResource.get({resourceType: "template"}, function (data) {
                scope.chart = data;
                scope.chart.chartSlabs = [];
                scope.fromDate.date = new Date();
            });

            /**
             * Add a new row with default values for entering chart details
             */
            scope.addNewRow = function () {
                var fromPeriod = '';
                var amountRangeFrom = '';
                var periodType = '';
                if (_.isNull(scope.chart.chartSlabs) || _.isUndefined(scope.chart.chartSlabs)) {
                    scope.chart.chartSlabs = [];
                } else {
                    var lastChartSlab = {};
                    if (scope.chart.chartSlabs.length > 0) {
                        lastChartSlab = angular.copy(scope.chart.chartSlabs[scope.chart.chartSlabs.length - 1]);
                    }
                    if (!(_.isNull(lastChartSlab) || _.isUndefined(lastChartSlab))) {
                        fromPeriod = _.isNull(lastChartSlab) ? '' : parseInt(lastChartSlab.toPeriod) + 1;
                        amountRangeFrom = _.isNull(lastChartSlab) ? '' : parseFloat(lastChartSlab.amountRangeTo) + 1;
                        periodType = angular.copy(lastChartSlab.periodType);
                    }
                }

                var chartSlab = {
                    "periodType": periodType,
                    "fromPeriod": fromPeriod,
                    "amountRangeFrom": amountRangeFrom,
                    "incentives":[]
                };

                scope.chart.chartSlabs.push(chartSlab);
            }

            /**
             * Remove chart details row
             */
            scope.removeRow = function (index) {
                scope.chart.chartSlabs.splice(index, 1);
            }

            //back to deposit product view
            scope.cancel = function () {
                location.path('/interestratecharts/' + routeParams.productId + '/' + routeParams.productName + '/' + routeParams.productType);
            };

            /**
             * Update Interest rate chart details
             */
            scope.submitInterestRateChartForm = function () {
                //scope.chartData = {};
                //scope.chartData = copyChartData(scope.chart);
                var chartData = copyChartData(scope.chart);

                scope.formData.charts = [];//declare charts array
                scope.formData.charts.push(chartData);//add chart details
                //update deposit product with new chart
                if (routeParams.productType === 'fixeddepositproduct') {
                    resourceFactory.fixedDepositProductResource.update({productId: routeParams.productId}, scope.formData, function (data) {
                        location.path('/interestratecharts/' + routeParams.productId + '/' + routeParams.productName + '/' + scope.productType);
                    });
                } else if (routeParams.productType === 'recurringdepositproduct') {
                    resourceFactory.recurringDepositProductResource.update({productId: routeParams.productId}, scope.formData, function (data) {
                        location.path('/interestratecharts/' + routeParams.productId + '/' + routeParams.productName + '/' + scope.productType);
                    });
                }

                //resourceFactory.interestRateChartResource.save(chartData, function (data) {
                //  location.path('/interestratecharts/' + routeParams.productId + '/' + routeParams.productName);
                //});
            }

            /**
             *  create new chart data object
             */

            copyChartData = function () {
                var newChartData = {
                    name: scope.chart.name,
                    description: scope.chart.description,
                    fromDate: dateFilter(scope.fromDate.date, scope.df),
                    endDate: dateFilter(scope.endDate.date, scope.df),
                    productId: scope.productId,
                    dateFormat: scope.df,
                    locale: scope.optlang.code,
                    chartSlabs: angular.copy(copyChartSlabs(scope.chart.chartSlabs))
                }

                //remove empty values
                _.each(newChartData, function (v, k) {
                    if (!v)
                        delete newChartData[k];
                });

                return newChartData;
            }

            /**
             *  copy all chart details to a new Array
             * @param chartSlabs
             * @returns {Array}
             */
            copyChartSlabs = function (chartSlabs) {
                var detailsArray = [];
                _.each(chartSlabs, function (chartSlab) {
                    var chartSlabData = copyChartSlab(chartSlab);
                    detailsArray.push(chartSlabData);
                });
                return detailsArray;
            }

            /**
             * create new chart detail object data from chartSlab
             * @param chartSlab
             *
             */

            copyChartSlab = function (chartSlab) {
                var newChartSlabData = {
                    id: chartSlab.id,
                    description: chartSlab.description,
                    periodType: chartSlab.periodType.id,
                    fromPeriod: chartSlab.fromPeriod,
                    toPeriod: chartSlab.toPeriod,
                    amountRangeFrom: chartSlab.amountRangeFrom,
                    amountRangeTo: chartSlab.amountRangeTo,
                    annualInterestRate: chartSlab.annualInterestRate,
                    locale: scope.optlang.code,
                    incentives:angular.copy(copyIncentives(chartSlab.incentives))
                }

                //remove empty values
                _.each(newChartSlabData, function (v, k) {
                    if (!v && v != 0)
                        delete newChartSlabData[k];
                });

                return newChartSlabData;
            }

            scope.incentives = function(index){
                $modal.open({
                    templateUrl: 'incentive.html',
                    controller: IncentiveCtrl,
                    resolve: {
                        data: function () {
                            return scope.chart;
                        },
                        chartSlab: function () {
                            return scope.chart.chartSlabs[index];
                        }
                    }
                });
            }

            /**
             *  copy all chart details to a new Array
             * @param incentiveDatas
             * @returns {Array}
             */
            copyIncentives = function (incentives) {
                var detailsArray = [];
                _.each(incentives, function (incentive) {
                    var incentiveData = copyIncentive(incentive);
                    detailsArray.push(incentiveData);
                });
                return detailsArray;
            }

            /**
             * create new chart detail object data from chartSlab
             * @param incentiveData
             *
             */

            copyIncentive = function (incentiveData) {
                var newIncentiveDataData = {
                    id: incentiveData.id,
                    "entityType":incentiveData.entityType,
                    "attributeName":incentiveData.attributeName.id,
                    "conditionType":incentiveData.conditionType.id,
                    "attributeValue":incentiveData.attributeValue,
                    "incentiveType":incentiveData.incentiveType.id,
                    "amount":incentiveData.amount
                }
                return newIncentiveDataData;
            }

            var IncentiveCtrl = function ($scope, $modalInstance, data,chartSlab) {
                $scope.data = data;
                $scope.chartSlab = chartSlab;
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };

                $scope.addNewRow = function () {
                    var incentive = {
                        "entityType":"2",
                        "attributeName":"",
                        "conditionType":"",
                        "attributeValue":"",
                        "incentiveType":"",
                        "amount":""
                    };

                    $scope.chartSlab.incentives.push(incentive);
                }

                /**
                 * Remove chart details row
                 */
                $scope.removeRow = function (index) {
                    $scope.chartSlab.incentives.splice(index, 1);
                }
            };

        }

    });
    mifosX.ng.application.controller('CreateInterestRateChartController', ['$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter','$modal', mifosX.controllers.CreateInterestRateChartController]).run(function ($log) {
        $log.info("CreateInterestRateChartController initialized");
    });
}(mifosX.controllers || {}));
