var map;
var centerMarker;
var infowindow = new google.maps.InfoWindow();
var markers = [];
var startArray = [];
var destinations = [];
var bounds = {
    distance: 0.0,
    crimeRate: 0.0
};
var bedFlag = 15;
var plotted = false;

function initialize(lat,lng) {
    var origin = new google.maps.LatLng(lat,lng);
    map = new google.maps.Map(document.getElementById('map'), {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: origin,
        zoom: 12
    });

    centerMarker = new google.maps.Marker({
        map: map,
        icon: 'img/star-3.png'
    });
    centerMarker.name = 'Purdue Memorial Union';
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
        initDraw('chart2','crimeRate','crime rate','.2f');
        initDraw('chart1','distance','Distance (km)','.0f');
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

    document.getElementById('list').addEventListener('click', function() {
        var e = document.getElementById('list');
        if ( e.selectedIndex > 0 ) {
            var key = e.selectedIndex-1;
            map.setCenter(destinations[key]);
            centerMarker.setPosition(destinations[key]);
            centerMarker.name = e.options[e.selectedIndex].value;
            updateMarkersFromPreCalc(key);
        }
    });
    var geocoder = new google.maps.Geocoder();
    document.getElementById('submit').addEventListener('click', function() {
        var address = document.getElementById('address').value;
        geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                centerMarker.setPosition(results[0].geometry.location);
                centerMarker.name = address;
                updateMarkers(results[0].geometry.location);
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
    var form = document.getElementById('bedroom').getElementsByTagName('input');
    for (var i=0; i < form.length; i++) {
        if ( form[i].type === 'checkbox' ) {
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
    }
}

function createMarkers(data) {
    $.each(data, function(index, item) {
        startArray.push(new google.maps.LatLng(item.lat, item.lng));
        var marker = new google.maps.Marker({
            map: map,
            position: {lat: item.lat, lng: item.lng},
            title: '$'+ item.price + ' / ' + item.bed + 'br - ' + item.size + 'ft<sup>2</sup>',
            icon: 'img/home-2.png'
        });
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
        marker.crimeRate = +item.crime_rate;
        marker.distance = item.distance[0]/1000.;
        markers.push(marker);
        google.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.setContent(this.title);
            infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'click', function() {
            if ($("#sp-result").is(":hidden")) {
                $("#accordion .in").addClass('collapse')
                                   .removeClass('in');
                $("#sp-result").removeClass('collapse')
                               .addClass('in');
            }
            document.getElementById("property-price").innerHTML = 'Rent: $' + this.price;
            document.getElementById("property-bedroom").innerHTML = 'Bedroom: ' + this.bed;
            document.getElementById("property-sqft").innerHTML = 'Size: ' + this.sqft + ' ft<sup>2</sup>';
            document.getElementById("property-address").innerHTML = 'Address: '+this.address;
            document.getElementById("driving-distance").innerHTML = 'Driving distance: ' + (this.distance).toFixed(1) + ' km';
            document.getElementById("crime-rate").innerHTML = 'Crime rate: ' + (this.crimeRate).toFixed(3);
            document.getElementById("website").innerHTML = "<a href=" + this.url + ">Link</a>";
        });
        //if (index==20) return false;
    });
}

function updateMarkersFromPreCalc(key) {
    for (var i=0; i < markers.length; i++) {
        markers[i].distance = markers[i].preCalcDistance[key]/1000.;
        if (!markers[i].getVisible()) markers[i].setVisible(true);
    }
    drawHist('chart1','distance');
    resetAll();
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
                        markers[index+key].distance = item.elements[0].distance.value/1000.;
                        markers[index+key].setVisible(true);
                        counter++;
                        if (counter == markers.length) drawHist('chart1','distance');
                    });
                }
            });
        })(i);
    }
    resetAll();
}

function hideMarkers(col) {
    if ( col === 'bedFlag' ) {
       for (var i = 0; i < markers.length; i++) {
           if ((markers[i].bedFlag & bedFlag) === 0) {
               markers[i].setVisible(false);
           }
       }
    } else {
       for (var i = 0; i < markers.length; i++) {
           if (markers[i][col] > bounds[col]) {
               //markers[i].setMap(null);
               markers[i].setVisible(false);
           }
       }
    }
}

function showMarkers() {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].getVisible()) continue;
        if ((markers[i].bedFlag & bedFlag) === 0) continue;
        var show = true;
        for (col in bounds) {
            if (markers[i][col] > bounds[col]) {
                show = false;
                break;
            }
        }
        if (show) markers[i].setVisible(true);
    }
}

function resetAll() {
    reset('chart2');
    clearForm();
    if ($("#sp-filter").is(":hidden")) {
        $("#accordion .in").addClass('collapse')
                           .removeClass('in');
        $("#sp-filter").removeClass('collapse')
                       .addClass('in');
    }
}

function clearForm() {
    var form = document.getElementById('bedroom').getElementsByTagName('input');
    for (var i=0; i < form.length; i++) {
        if ( form[i].type === 'checkbox' ) {
            if (form[i].checked) form[i].checked = false;
        }
    }
    bedFlag = 15;
}

google.maps.event.addDomListener(window, 'load', function(){initialize(40.4240,-86.9290);});

