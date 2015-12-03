var map;
var centerMarker;
var infowindow = new google.maps.InfoWindow();
var directionsService = new google.maps.DirectionsService();
var markers = [];
var startArray = [];
var destinations = [];
var maxtime = 1001;
var bounds = {
    distance: 0.0,
    crimeRate: 0.0,
    time: maxtime-1
};
var bedFlag = 15;
var transitFlag = false;
var hasCalcRoute = false;
var userAddress = false;
var chart3plotted = false;
var chart3updated = false;
var plotted = false;
var busImg = "<img src='img/bus.png'/>";
var walkImg = "<img src='img/pedestriancrossing.png'/>";
var carImg = "<img src='img/car.png'/>";
var dsCounter = 0;
var minPrice = 10000;
var minPrice0 = 10000;
var minIndex;
var minIndex0;

function initialize(lat,lng) {
    var origin = new google.maps.LatLng(lat,lng);
    map = new google.maps.Map(document.getElementById('map'), {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: origin,
        zoom: 12,
        scaleControl: true
    });

    var layer = new google.maps.FusionTablesLayer({
        query: {
          select: 'geometry',
          from: '1CqmCQz51hpLe-CjCxJzCMCRNWP8xZVQWwJB-807w'
        },
        styles: [{
          polygonOptions: {
            fillColor: '#ffff33',
            fillOpacity: 0.1
          }
        }, {
          where: 'GEOID >= 1812870',
          polygonOptions: {
            fillColor: '#aaff00'
          }
        }, {
          where: 'GEOID <= 1805400',
          polygonOptions: {
            fillColor: '#ff8c1a'
          }
        }]
    });
    layer.setMap(map);

    centerMarker = new google.maps.Marker({
        map: map,
        icon: 'img/star-3.png'
    });
    centerMarker.name = 'Purdue Stewart Center';
    google.maps.event.addListener(centerMarker, 'mouseover', function() {
        infowindow.setContent(this.name);
        infowindow.open(map, this);
    });

    $.getJSON("data/processed.json", function(data){
        createMarkers(data.results);
        $.each(data.destination, function(index, item) {
            destinations.push(new google.maps.LatLng(item.lat,item.lng));
        });
        centerMarker.setPosition(destinations[0]);
        setPlotWidth();
        initDraw('chart2','crimeRate','','.2f','.3f');
        initDraw('chart1','distance','mi','.0f','.1f');
        document.getElementById("min-price").innerHTML = '$' + minPrice;
    });

    $("#p-transit-time").on('shown.bs.collapse', function(){
        if (!chart3plotted) {
            //alert("init chart3");
            initDraw('chart3','time','min','.0f','.1f');
            chart3plotted = true;
            chart3updated = true;
        } else if (!chart3updated && !userAddress) {
            //alert("update chart3");
            drawHist('chart3','time','.0f');
            chart3updated = true;
        }
    });


    $("#sp-overview").on('show.bs.collapse', function(){
        if (!plotted) {
            $.getJSON("data/weatherMMXT.json", function(data1){
               $.getJSON("data/weatherMMNT.json", function(data2){
                   plotTemperature(data1.results, data2.results);
                });
            });
            plotted = true;
        }
    });

    $('#list').change(function() {
        var option = $(this).find('option:selected');
        var key = parseInt(option.val()) - 1;
        if ( key >= 0 ) {
            map.setCenter(destinations[key]);
            map.setZoom(12);
            centerMarker.setPosition(destinations[key]);
            centerMarker.name = option.text();
            updateMarkersFromPreCalc(key);
            if ($("#address").val() != '') {
                $("#address").val('');
                userAddress = false;
            }
        }
    });

    document.getElementById('show').addEventListener('click', function() {
        markers[minIndex].setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            markers[minIndex].setAnimation(null);
        }, 3500);
    });

    var geocoder = new google.maps.Geocoder();
    document.getElementById('submit').addEventListener('click', function() {
        var address = document.getElementById('address').value;
        geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                $("#list").val('0');
                userAddress = true;
                map.setCenter(results[0].geometry.location);
                centerMarker.setPosition(results[0].geometry.location);
                centerMarker.name = address;
                updateMarkers(results[0].geometry.location);
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
    var form = document.getElementsByName('checkbox-bed');
    for (var i=0; i < form.length; i++) {
        form[i].addEventListener('change', function (event) {
            if (this.checked) {
                if (bedFlag < 15) {
                    bedFlag += parseInt(this.value);
                    showMarkers();
                } else {
                    bedFlag = parseInt(this.value);
                    hideMarkers('bedFlag');
                }
            } else {
                bedFlag -= parseInt(this.value);
                if ( bedFlag === 0 ) {
                    bedFlag = 15;
                    showMarkers();
                } else {
                    hideMarkers('bedFlag');
                }
            }
        });
    }

    document.getElementById('checkbox-transit').addEventListener('change', function () {
        if (this.checked) {
            transitFlag = true;
            if (!hasCalcRoute && userAddress) {
                alert("This will take about a minute. Google only accepts at most 10 requests per second for the direction service. The transit time plot will be updated when all the requests are completed.");
                calcRoute();
                hasCalcRoute = true;
            } else {
                $("#p-transit-time").collapse('show');
                hideMarkers('time');
            }
        } else {
            transitFlag = false;
            $("#p-transit-time").collapse('hide');
            showMarkers();
        }
    });
}

function createMarkers(data) {
    $.each(data, function(index, item) {
    //if (index % 4 === 0) {
        startArray.push(new google.maps.LatLng(item.lat, item.lng));
        var marker = new google.maps.Marker({
            map: map,
            position: {lat: item.lat, lng: item.lng},
            icon: 'img/home-2.png'
        });
        if (item.price < minPrice) {
            minPrice = item.price;
            minIndex = index;
        }
        marker.name = '$'+ item.price + ' / ' + item.bed + 'br - ' + item.size + 'ft<sup>2</sup>';
        marker.price = item.price;
        marker.sqft = item.size;
        marker.bed = item.bed;
        if (item.bed < 4) {
            marker.bedFlag = Math.pow(2, item.bed - 1);
        } else {
            marker.bedFlag = 8;
        }
        marker.url = item.url;
        marker.address = item.address;
        marker.preCalcDistance = item.distance;
        marker.preCalcRoute = item.transit;
        marker.crimeRate = +item.crime_rate;
        marker.distance = item.distance[0];
        if (item.transit[0].steps.length > 0) {
            marker.route = renderRoute(item.transit[0].steps);
            marker.time = item.transit[0].duration.value/60.;
        } else {
            marker.route = '';
            marker.time = maxtime;
        }
        //if (index===0) {
        //    marker.route = '';
        //    marker.time = maxtime;
        //}
        markers.push(marker);
        google.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.setContent(this.name);
            infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'click', function() {
            if ($("#sp-result").is(":hidden")) {
                //$("#accordion .in").addClass('collapse')
                //                   .removeClass('in');
                //$("#sp-result").removeClass('collapse')
                //               .addClass('in');
                $('#result-link').click();
            }
            document.getElementById("property-price").innerHTML = '$' + this.price;
            document.getElementById("property-bedroom").innerHTML = this.bed;
            document.getElementById("property-sqft").innerHTML = this.sqft + ' ft<sup>2</sup>';
            document.getElementById("property-address").innerHTML = this.address;
            document.getElementById("driving-distance").innerHTML = (this.distance).toFixed(1) + ' mi';
            document.getElementById("crime-rate").innerHTML = (this.crimeRate).toFixed(3);
            document.getElementById("website").innerHTML = '<a href=' + this.url + ' target="_blank"' + '>Craigslist</a>';
            if (transitFlag) {
                document.getElementById("transit-time").innerHTML = (this.time).toFixed(0) + ' mins';
                document.getElementById("transit-route").innerHTML = this.route;
            } else {
                document.getElementById("transit-time").innerHTML = '';
                document.getElementById("transit-route").innerHTML = '';
            }
        });
        //if (index==20) return false;
     //}
    });
    minPrice0 = minPrice;
    minIndex0 = minIndex;
}

function updateMarkersFromPreCalc(key) {
    resetAll();
    for (var i=0; i < markers.length; i++) {
        markers[i].distance = markers[i].preCalcDistance[key];
        if (markers[i].preCalcRoute[key].steps.length > 0) {
            markers[i].route = renderRoute(markers[i].preCalcRoute[key].steps);
            markers[i].time = markers[i].preCalcRoute[key].duration.value/60.;
        } else {
            markers[i].route = '';
            markers[i].time = maxtime;
        }
        if (!markers[i].getVisible()) markers[i].setVisible(true);
    }
    drawHist('chart1','distance','.0f');
}

function updateMarkers(centerLoc) {
    var counter=0;
    for (var i=0; i < startArray.length; i+=25) {
        var service = new google.maps.DistanceMatrixService();
        (function(key) {
            service.getDistanceMatrix({
                origins: startArray.slice(i,Math.min(i+25,startArray.length)),
                destinations: [centerLoc],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
            },
            function (response, status) {
                if (status != google.maps.DistanceMatrixStatus.OK) {
                    alert('Error was: ' + status);
                    return false;
                } else {
                    $.each(response.rows, function(index, item) {
                        markers[index+key].distance = item.elements[0].distance.value/1000.*0.621371;
                        markers[index+key].setVisible(true);
                        counter++;
                        if (counter == markers.length) drawHist('chart1','distance','.0f');
                    });
                }
            });
        })(i);
    }
    resetAll();
}

function calcRoute() {
    var centerLoc = centerMarker.getPosition();
    for (var j=0; j < markers.length; j++) {
        setTimeout((function(i) {
            calcTransitRoute(i, centerLoc);
        })(j), 100*(j+1)); // 10 requests per second
    }
}

function calcTransitRoute(i, centerLoc) {
     var request = {
         origin: markers[i].getPosition(),
         destination: centerLoc,
         transitOptions: {
             arrivalTime: new Date(2015,12,7,8,0,0,0)
         },
         travelMode: google.maps.TravelMode.TRANSIT
     };
     directionsService.route(request, function(response, status) {
         if (status === google.maps.DirectionsStatus.OK) {
            markers[i].route = renderRoute(response.routes[0].legs[0].steps);
            markers[i].time = response.routes[0].legs[0].duration.value/60.;
            dsCounter++;
        } else if ( status == "OVER_QUERY_LIMIT" ) {
            setTimeout(function() { calcTransitRoute(i, centerLoc); }, 200);
        } else if ( status == "ZERO_RESULTS" ) {
            markers[i].route = '';
            markers[i].time = maxtime;
            dsCounter++;
        } else {
            alert('Directions request failed due to ' + status);
        }
        if (dsCounter === markers.length) {
            drawHist('chart3','time','.0f');
            chart3updated = true;
            $("#p-transit-time").collapse('show');
            hideMarkers('time');
        }
     });
}

function hideMarkers(col) {
    minPrice = 10000;
    if ( col === 'bedFlag' ) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].getVisible()) {
                if ((markers[i].bedFlag & bedFlag) === 0) {
                    markers[i].setVisible(false);
                } else {
                    setMinPrice(i);
                }
            }
        }
    } else {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].getVisible()) {
                if (markers[i][col] >= bounds[col]) {
                    //markers[i].setMap(null);
                    markers[i].setVisible(false);
                } else {
                    setMinPrice(i);
                }
            }
        }
    }
    document.getElementById("min-price").innerHTML = '$' + minPrice;
}

function showMarkers() {
    minPrice = 10000;
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].getVisible()) {
            setMinPrice(i);
            continue;
        }
        if ((markers[i].bedFlag & bedFlag) === 0) continue;
        var show = true;
        for (col in bounds) {
            if (col === 'time' && !transitFlag) continue;
            if (markers[i][col] >= bounds[col]) {
                show = false;
                break;
            }
        }
        if (show) {
            markers[i].setVisible(true);
            setMinPrice(i);
        }
    }
    document.getElementById("min-price").innerHTML = '$' + minPrice;
}

function setMinPrice(i) {
    if (markers[i].price < minPrice) {
        minPrice = markers[i].price;
        minIndex = i;
    }
}

function resetAll() {
    if ($("#sp-filter").is(":hidden")) {
        //$("#accordion .in").addClass('collapse')
        //                   .removeClass('in');
        //$("#sp-filter").removeClass('collapse')
        //               .addClass('in');
        $("#filter-link").click();
    }
    $("#p-transit-time").collapse('hide');
    bounds['time'] = maxtime -1;
    reset('chart2');
    clearForm();
    transitFlag = false;
    hasCalcRoute = false;
    chart3updated = false;
    minPrice = minPrice0;
    minIndex = minIndex0;
    document.getElementById("min-price").innerHTML = '$' + minPrice;
}

function clearForm() {
    var form = document.getElementsByName('checkbox-bed');
    for (var i=0; i < form.length; i++) {
        if (form[i].checked) form[i].checked = false;
    }
    document.getElementById('checkbox-transit').checked = false;
    bedFlag = 15;
}

function renderRoute(steps) {
    var route = '';
    for (var j=0; j < steps.length; j++) {
        var str = '<span data-tooltip="'+ steps[j].instructions +'" data-tooltip-position="right">';
        switch (steps[j].travel_mode) {
            case 'TRANSIT':
                route += '<div class="row">' + busImg + str + steps[j].duration.text + '</span>'
                    + '<span class="label label-pill label-primary">' + steps[j].transit.line.short_name +'</span></div>';
                break;
            case 'WALKING':
                route += '<div class="row">' + walkImg + str + steps[j].duration.text + '</span></div>';
                break;
            default:
                route += '<div class="row">' + carImg + str + steps[j].duration.text + '</span></div>';
        }
    }
    return route;
}



google.maps.event.addDomListener(window, 'load', function(){initialize(40.42508, -86.912651);});

